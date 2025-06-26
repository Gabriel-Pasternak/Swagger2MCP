import OpenAI from 'openai';
import { ChatMessage, MCPServer, MCPEndpoint, APICallResult, AuthConfig } from '../types';
import { APIExecutor } from './apiExecutor';
import { JsonUtils } from './jsonUtils';

export class OpenAIClient {
  private client: OpenAI | null = null;
  private server: MCPServer | null = null;
  private apiExecutor: APIExecutor | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true 
      });
    }
  }

  setApiKey(apiKey: string) {
    this.client = new OpenAI({ 
      apiKey, 
      dangerouslyAllowBrowser: true 
    });
  }

  setServer(server: MCPServer, authConfig?: AuthConfig) {
    this.server = server;
    this.apiExecutor = new APIExecutor(server, authConfig);
  }

  async chat(messages: ChatMessage[], userMessage: string): Promise<{
    response: string;
    apiResult?: APICallResult;
    executedCall?: boolean;
  }> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    if (!this.server || !this.apiExecutor) {
      throw new Error('No MCP server configured');
    }

    // First, analyze if the user wants to execute an API call
    const intentAnalysis = await this.analyzeUserIntent(userMessage);
    
    let apiResult: APICallResult | undefined;
    let executedCall = false;

    // If user wants to execute an API call, do it
    if (intentAnalysis.shouldExecute && intentAnalysis.endpoint && intentAnalysis.parameters) {
      try {
        apiResult = await this.apiExecutor.executeEndpoint(
          intentAnalysis.endpoint,
          intentAnalysis.parameters
        );
        executedCall = true;
      } catch (error) {
        console.error('API execution failed:', error);
      }
    }

    // Generate response based on context and API results
    const systemMessage = this.generateSystemMessage(apiResult);
    
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessage },
      ...messages.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1500
      });

      const responseText = completion.choices[0]?.message?.content || 'No response generated';

      return {
        response: responseText,
        apiResult,
        executedCall
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeUserIntent(userMessage: string): Promise<{
    shouldExecute: boolean;
    endpoint?: MCPEndpoint;
    parameters?: Record<string, any>;
    confidence: number;
  }> {
    if (!this.client || !this.server || !this.apiExecutor) {
      return { shouldExecute: false, confidence: 0 };
    }

    const analysisPrompt = `Analyze this user request and determine if they want to execute an API call:

User message: "${userMessage}"

Available API endpoints:
${this.server.endpoints.map(e => `
- ${e.name}: ${e.description}
  Method: ${e.method} ${e.path}
  Parameters: ${e.parameters.map(p => `${p.name}(${p.type}${p.required ? '*' : ''})`).join(', ')}
`).join('')}

Determine:
1. Does the user want to execute an API call? (yes/no)
2. Which endpoint should be used? (endpoint name or null)
3. What parameters can be extracted from the message?
4. What parameters are missing and need to be asked for?

Respond ONLY with valid JSON in this exact format:
{
  "shouldExecute": boolean,
  "endpointName": "string or null",
  "extractedParameters": {},
  "missingParameters": [],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        // Use the new JsonUtils to safely parse the response
        const analysis = JsonUtils.parseAIResponse(content);
        
        if (analysis && JsonUtils.hasRequiredProperties(analysis, ['shouldExecute'])) {
          if (analysis.shouldExecute && analysis.endpointName) {
            const endpoint = this.apiExecutor.findEndpointByName(analysis.endpointName);
            
            if (endpoint && (!analysis.missingParameters || analysis.missingParameters.length === 0)) {
              return {
                shouldExecute: true,
                endpoint,
                parameters: analysis.extractedParameters || {},
                confidence: analysis.confidence || 0.5
              };
            }
          }
          
          return {
            shouldExecute: false,
            confidence: analysis.confidence || 0
          };
        } else {
          console.warn('Invalid analysis structure from OpenAI:', analysis);
        }
      }
    } catch (error) {
      console.error('Intent analysis failed:', error);
    }

    return { shouldExecute: false, confidence: 0 };
  }

  private generateSystemMessage(apiResult?: APICallResult): string {
    if (!this.server) return '';

    let systemMessage = `You are an AI assistant that can help users interact with the "${this.server.name}" API. You have access to the following endpoints:

${this.server.endpoints.map(endpoint => `
- **${endpoint.name}**: ${endpoint.description}
  - Method: ${endpoint.method}
  - Path: ${endpoint.path}
  - Parameters: ${endpoint.parameters.map(p => `${p.name} (${p.type}${p.required ? ', required' : ''})`).join(', ')}
`).join('\n')}

You can execute API calls for users when they request specific actions. When a user asks for something that requires an API call, you should:
1. Identify the appropriate endpoint
2. Extract or ask for required parameters
3. Execute the API call
4. Present the results in a helpful format

Be conversational, helpful, and explain what you're doing when making API calls.`;

    if (apiResult) {
      systemMessage += `\n\nAPI Call Result:
- Endpoint: ${apiResult.endpoint}
- Method: ${apiResult.method}
- Success: ${apiResult.success}
- Status Code: ${apiResult.statusCode}
${apiResult.success ? `- Data: ${JsonUtils.safeStringify(apiResult.data, 2)}` : `- Error: ${apiResult.error}`}

Please interpret and present this API response to the user in a helpful, conversational way.`;
    }

    return systemMessage;
  }

  async analyzeEndpointUsage(userQuery: string): Promise<{
    suggestedEndpoint?: string;
    requiredParameters?: string[];
    explanation: string;
  }> {
    if (!this.client || !this.server) {
      return { explanation: 'Configuration not complete' };
    }

    const prompt = `Given the user query: "${userQuery}"

And these available API endpoints:
${this.server.endpoints.map(e => `- ${e.name}: ${e.description} (${e.method} ${e.path})`).join('\n')}

Which endpoint would be most appropriate to fulfill this request? Provide:
1. The endpoint name (if applicable)
2. Required parameters that would need to be collected from the user
3. A brief explanation of how this endpoint would help

Respond ONLY with valid JSON:
{
  "suggestedEndpoint": "endpoint_name_or_null",
  "requiredParameters": ["param1", "param2"],
  "explanation": "Brief explanation"
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const result = JsonUtils.parseAIResponse(content);
        if (result && JsonUtils.hasRequiredProperties(result, ['explanation'])) {
          return result;
        } else {
          // Fallback to returning the raw content as explanation
          return { explanation: content };
        }
      }
      
      return { explanation: 'No analysis available' };
    } catch (error) {
      return { explanation: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}
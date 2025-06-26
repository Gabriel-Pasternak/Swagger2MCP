import { ChatMessage, MCPServer, MCPEndpoint, APICallResult, AuthConfig, GeminiResponse } from '../types';
import { APIExecutor } from './apiExecutor';
import { JsonUtils } from './jsonUtils';

export class GeminiClient {
  private apiKey: string | null = null;
  private server: MCPServer | null = null;
  private apiExecutor: APIExecutor | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
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
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
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
    
    // Build conversation context for Gemini
    const conversationContext = this.buildConversationContext(messages, userMessage, systemMessage);

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: conversationContext
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

      return {
        response: responseText,
        apiResult,
        executedCall
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildConversationContext(messages: ChatMessage[], userMessage: string, systemMessage: string): string {
    let context = systemMessage + '\n\n';
    
    // Add recent conversation history
    const recentMessages = messages.slice(-10);
    recentMessages.forEach(msg => {
      context += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    
    context += `User: ${userMessage}\n`;
    context += 'Assistant: ';
    
    return context;
  }

  private async analyzeUserIntent(userMessage: string): Promise<{
    shouldExecute: boolean;
    endpoint?: MCPEndpoint;
    parameters?: Record<string, any>;
    confidence: number;
  }> {
    if (!this.apiKey || !this.server || !this.apiExecutor) {
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
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: analysisPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          }
        })
      });

      if (response.ok) {
        const data: GeminiResponse = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
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
            console.warn('Invalid analysis structure from Gemini:', analysis);
          }
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
    if (!this.apiKey || !this.server) {
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
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          }
        })
      });

      if (response.ok) {
        const data: GeminiResponse = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (content) {
          const result = JsonUtils.parseAIResponse(content);
          if (result && JsonUtils.hasRequiredProperties(result, ['explanation'])) {
            return result;
          } else {
            // Fallback to returning the raw content as explanation
            return { explanation: content };
          }
        }
      }
      
      return { explanation: 'No analysis available' };
    } catch (error) {
      return { explanation: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}
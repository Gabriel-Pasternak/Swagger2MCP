export interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  options?: Operation;
  head?: Operation;
  trace?: Operation;
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  tags?: string[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema: any;
  description?: string;
}

export interface RequestBody {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

export interface MediaType {
  schema: any;
  example?: any;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  endpoints: MCPEndpoint[];
  status: 'generating' | 'ready' | 'error';
  code: string;
  authConfig?: AuthConfig;
}

export interface MCPEndpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  description: string;
  parameters: MCPParameter[];
  requestBodySchema?: any;
  responseSchema?: any;
}

export interface MCPParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  in?: 'query' | 'header' | 'path' | 'cookie';
}

export interface AuthConfig {
  type: 'none' | 'apiKey' | 'bearer' | 'basic';
  apiKey?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  headerName?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    endpoint?: string;
    response?: any;
    executedCall?: boolean;
    apiResponse?: any;
  };
}

export interface ServerConfig {
  aiProvider: 'openai' | 'gemini' | 'openrouter';
  openaiApiKey: string;
  geminiApiKey: string;
  openrouterApiKey: string;
  openrouterModel: string;
  siteUrl?: string;
  siteName?: string;
  apiBaseUrl?: string;
  authConfig?: AuthConfig;
}

export interface APICallResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  endpoint?: string;
  method?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}
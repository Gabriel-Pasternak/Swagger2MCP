import { MCPServer, MCPEndpoint, AuthConfig, APICallResult } from '../types';

export class APIExecutor {
  private server: MCPServer;
  private authConfig?: AuthConfig;

  constructor(server: MCPServer, authConfig?: AuthConfig) {
    this.server = server;
    this.authConfig = authConfig;
  }

  async executeEndpoint(
    endpoint: MCPEndpoint,
    parameters: Record<string, any>
  ): Promise<APICallResult> {
    try {
      // Build the URL
      let url = this.buildUrl(endpoint, parameters);
      
      // Prepare headers
      const headers = this.buildHeaders(endpoint);
      
      // Prepare request options
      const options: RequestInit = {
        method: endpoint.method,
        headers,
      };

      // Add body for non-GET requests
      if (endpoint.method !== 'GET' && parameters.body) {
        options.body = JSON.stringify(parameters.body);
      }

      // Add query parameters for GET requests
      if (endpoint.method === 'GET') {
        url = this.addQueryParameters(url, endpoint, parameters);
      }

      console.log(`Executing ${endpoint.method} ${url}`, { parameters, options });

      const response = await fetch(url, options);
      const data = await response.json().catch(() => response.text());

      return {
        success: response.ok,
        data,
        statusCode: response.status,
        endpoint: endpoint.name,
        method: endpoint.method,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error) {
      console.error('API execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        endpoint: endpoint.name,
        method: endpoint.method
      };
    }
  }

  private buildUrl(endpoint: MCPEndpoint, parameters: Record<string, any>): string {
    let url = this.server.baseUrl + endpoint.path;
    
    // Replace path parameters
    endpoint.parameters
      .filter(param => param.in === 'path')
      .forEach(param => {
        if (parameters[param.name] !== undefined) {
          url = url.replace(`{${param.name}}`, encodeURIComponent(String(parameters[param.name])));
        }
      });

    return url;
  }

  private buildHeaders(endpoint: MCPEndpoint): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'MCP-Chat-Client/1.0'
    };

    // Add authentication headers
    if (this.authConfig) {
      switch (this.authConfig.type) {
        case 'apiKey':
          if (this.authConfig.apiKey && this.authConfig.headerName) {
            headers[this.authConfig.headerName] = this.authConfig.apiKey;
          }
          break;
        case 'bearer':
          if (this.authConfig.bearerToken) {
            headers['Authorization'] = `Bearer ${this.authConfig.bearerToken}`;
          }
          break;
        case 'basic':
          if (this.authConfig.username && this.authConfig.password) {
            const credentials = btoa(`${this.authConfig.username}:${this.authConfig.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
      }
    }

    return headers;
  }

  private addQueryParameters(
    url: string,
    endpoint: MCPEndpoint,
    parameters: Record<string, any>
  ): string {
    const queryParams = new URLSearchParams();
    
    endpoint.parameters
      .filter(param => param.in === 'query')
      .forEach(param => {
        if (parameters[param.name] !== undefined) {
          queryParams.append(param.name, String(parameters[param.name]));
        }
      });

    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  findEndpointByName(name: string): MCPEndpoint | undefined {
    return this.server.endpoints.find(endpoint => 
      endpoint.name.toLowerCase().includes(name.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(name.toLowerCase())
    );
  }

  findEndpointsByIntent(intent: string): MCPEndpoint[] {
    const searchTerms = intent.toLowerCase().split(' ');
    
    return this.server.endpoints.filter(endpoint => {
      const searchText = `${endpoint.name} ${endpoint.description} ${endpoint.path}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    }).slice(0, 3); // Return top 3 matches
  }
}
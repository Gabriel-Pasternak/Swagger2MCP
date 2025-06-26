import yaml from 'js-yaml';
import { SwaggerSpec, MCPServer, MCPEndpoint, MCPParameter } from '../types';

export class SwaggerParser {
  static async parseFile(file: File): Promise<SwaggerSpec> {
    try {
      const content = await file.text();
      
      let spec: SwaggerSpec;
      
      if (file.name.endsWith('.json')) {
        spec = JSON.parse(content);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        spec = yaml.load(content) as SwaggerSpec;
      } else {
        // Try to parse as JSON first, then YAML
        try {
          spec = JSON.parse(content);
        } catch {
          spec = yaml.load(content) as SwaggerSpec;
        }
      }

      // Validate the spec
      if (!spec.info || !spec.paths) {
        throw new Error('Invalid Swagger/OpenAPI specification');
      }

      return spec;
    } catch (error) {
      throw new Error(`Failed to parse Swagger file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static generateMCPServer(spec: SwaggerSpec): MCPServer {
    const endpoints: MCPEndpoint[] = [];
    
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (operation && typeof operation === 'object') {
          const endpoint: MCPEndpoint = {
            id: `${method}_${path}`.replace(/[^a-zA-Z0-9_]/g, '_'),
            name: operation.operationId || `${method}_${path}`.replace(/[^a-zA-Z0-9_]/g, '_'),
            method: method.toUpperCase(),
            path,
            description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
            parameters: this.extractParameters(operation.parameters || [], path),
            requestBodySchema: operation.requestBody,
            responseSchema: operation.responses
          };
          endpoints.push(endpoint);
        }
      });
    });

    const baseUrl = spec.servers?.[0]?.url || 'https://api.example.com';

    const server: MCPServer = {
      id: `mcp_${spec.info.title.replace(/[^a-zA-Z0-9_]/g, '_')}`,
      name: spec.info.title,
      description: spec.info.description || `MCP Server for ${spec.info.title}`,
      baseUrl,
      endpoints,
      status: 'generating',
      code: this.generateServerCode(spec, endpoints)
    };

    return server;
  }

  private static extractParameters(params: any[], path: string): MCPParameter[] {
    const parameters: MCPParameter[] = [];
    
    // Extract path parameters
    const pathParams = path.match(/\{([^}]+)\}/g);
    if (pathParams) {
      pathParams.forEach((param) => {
        const paramName = param.slice(1, -1);
        parameters.push({
          name: paramName,
          type: 'string',
          required: true,
          description: `Path parameter: ${paramName}`,
          in: 'path'
        });
      });
    }

    // Extract other parameters
    params.forEach((param) => {
      if (param.name && param.schema) {
        parameters.push({
          name: param.name,
          type: this.getParameterType(param.schema),
          required: param.required || false,
          description: param.description,
          in: param.in || 'query'
        });
      }
    });

    return parameters;
  }

  private static getParameterType(schema: any): string {
    if (schema.type) {
      return schema.type;
    }
    if (schema.$ref) {
      return 'object';
    }
    return 'string';
  }

  private static generateServerCode(spec: SwaggerSpec, endpoints: MCPEndpoint[]): string {
    const serverName = spec.info.title.replace(/[^a-zA-Z0-9_]/g, '_');
    const baseUrl = spec.servers?.[0]?.url || 'https://api.example.com';

    return `#!/usr/bin/env node

/**
 * MCP Server for ${spec.info.title}
 * Generated from Swagger/OpenAPI specification
 * 
 * ${spec.info.description || ''}
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BASE_URL = '${baseUrl}';
const server = new Server(
  {
    name: '${serverName}',
    version: '${spec.info.version}',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
${endpoints.map(endpoint => this.generateToolDefinition(endpoint)).join('\n\n')}

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
${endpoints.map(endpoint => this.generateToolHandler(endpoint)).join('\n')}
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
${endpoints.map(endpoint => this.generateToolListEntry(endpoint)).join(',\n')}
    ],
  };
});

${endpoints.map(endpoint => this.generateEndpointHandler(endpoint, baseUrl)).join('\n\n')}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${serverName} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;
  }

  private static generateToolDefinition(endpoint: MCPEndpoint): string {
    const params = endpoint.parameters.map(param => 
      `    ${param.name}: {
      type: '${param.type}',
      description: '${param.description || param.name}',
      ${param.required ? 'required: true' : ''}
    }`
    ).join(',\n');

    return `const ${endpoint.id}_tool = {
  name: '${endpoint.name}',
  description: '${endpoint.description}',
  inputSchema: {
    type: 'object',
    properties: {
${params}
    },
    required: [${endpoint.parameters.filter(p => p.required).map(p => `'${p.name}'`).join(', ')}]
  }
};`;
  }

  private static generateToolHandler(endpoint: MCPEndpoint): string {
    return `    case '${endpoint.name}':
      return await handle_${endpoint.id}(args);`;
  }

  private static generateToolListEntry(endpoint: MCPEndpoint): string {
    return `      ${endpoint.id}_tool`;
  }

  private static generateEndpointHandler(endpoint: MCPEndpoint, baseUrl: string): string {
    const pathParams = endpoint.parameters.filter(p => p.in === 'path');
    const queryParams = endpoint.parameters.filter(p => p.in === 'query');

    return `
async function handle_${endpoint.id}(args) {
  try {
    let url = BASE_URL + '${endpoint.path}';
    
    // Replace path parameters
${pathParams.map(param => `    url = url.replace('{${param.name}}', args.${param.name});`).join('\n')}
    
    // Add query parameters
    const queryParams = new URLSearchParams();
${queryParams.map(param => `    if (args.${param.name} !== undefined) {
      queryParams.append('${param.name}', String(args.${param.name}));
    }`).join('\n')}
    
    if (queryParams.toString()) {
      url += '?' + queryParams.toString();
    }
    
    const options = {
      method: '${endpoint.method}',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-Server/1.0'
      }
    };
    
    ${endpoint.method !== 'GET' ? `
    if (args.body) {
      options.body = JSON.stringify(args.body);
    }` : ''}
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          data: data
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: \`Error calling ${endpoint.name}: \${error.message}\`
      }],
      isError: true
    };
  }
}`;
  }
}
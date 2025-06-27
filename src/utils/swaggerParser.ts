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
    
    try {
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        if (!pathItem || typeof pathItem !== 'object') return;
        
        Object.entries(pathItem).forEach(([method, operation]) => {
          if (operation && typeof operation === 'object' && method && typeof method === 'string') {
            // Sanitize the endpoint ID to ensure it's a valid identifier
            const sanitizedPath = path.replace(/[^a-zA-Z0-9_]/g, '_');
            const sanitizedMethod = method.replace(/[^a-zA-Z0-9_]/g, '_');
            const endpointId = `${sanitizedMethod}_${sanitizedPath}`.replace(/_{2,}/g, '_');
            
            const endpoint: MCPEndpoint = {
              id: endpointId,
              name: operation.operationId?.replace(/[^a-zA-Z0-9_]/g, '_') || endpointId,
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

      if (endpoints.length === 0) {
        throw new Error('No valid endpoints found in the Swagger specification');
      }

      const baseUrl = spec.servers?.[0]?.url || 'https://api.example.com';

      const server: MCPServer = {
        id: `mcp_${spec.info.title.replace(/[^a-zA-Z0-9_]/g, '_')}`,
        name: spec.info.title,
        description: spec.info.description || `MCP Server for ${spec.info.title}`,
        baseUrl,
        endpoints,
        status: 'generating',
        code: {
          typescript: this.generateTypescriptServerCode(spec, endpoints),
          python: this.generatePythonServerCode(spec, endpoints)
        }
      };

      return server;
      
    } catch (error) {
      throw new Error(`Failed to generate MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  private static generateTypescriptServerCode(spec: SwaggerSpec, endpoints: MCPEndpoint[]): string {
    const serverName = spec.info.title.replace(/[^a-zA-Z0-9_]/g, '_');
    const baseUrl = spec.servers?.[0]?.url || 'https://api.example.com';

    // Filter out any endpoints that might have invalid data
    const validEndpoints = endpoints.filter(endpoint => 
      endpoint.method && 
      typeof endpoint.method === 'string' && 
      endpoint.id && 
      endpoint.name
    );

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
${validEndpoints.map(endpoint => this.generateTypescriptToolDefinition(endpoint)).join('\n\n')}

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
${validEndpoints.map(endpoint => this.generateTypescriptToolHandler(endpoint)).join('\n')}
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
${validEndpoints.map(endpoint => this.generateTypescriptToolListEntry(endpoint)).join(',\n')}
    ],
  };
});

${validEndpoints.map(endpoint => this.generateTypescriptEndpointHandler(endpoint, baseUrl)).join('\n\n')}

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

  private static generatePythonServerCode(spec: SwaggerSpec, endpoints: MCPEndpoint[]): string {
    const serverName = spec.info.title.replace(/[^a-zA-Z0-9_]/g, '_');
    const baseUrl = spec.servers?.[0]?.url || 'https://api.example.com';

    // Filter out any endpoints that might have invalid data
    const validEndpoints = endpoints.filter(endpoint => 
      endpoint.method && 
      typeof endpoint.method === 'string' && 
      endpoint.id && 
      endpoint.name
    );

    return `#!/usr/bin/env python3

"""
MCP Server for ${spec.info.title}
Generated from Swagger/OpenAPI specification

${spec.info.description || ''}
"""

import json
import asyncio
from typing import Any
import httpx
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import NotificationOptions, Server
import mcp.server.stdio

BASE_URL = "${baseUrl}"

app = Server("${serverName}")

${validEndpoints.map(endpoint => this.generatePythonToolDefinition(endpoint)).join('\n\n')}

${validEndpoints.map(endpoint => this.generatePythonEndpointHandler(endpoint, baseUrl)).join('\n\n')}

async def main():
    # Run the server using stdin/stdout streams
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="${serverName}",
                server_version="${spec.info.version}",
                capabilities=app.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
`;
  }

  private static generateTypescriptToolDefinition(endpoint: MCPEndpoint): string {
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

  private static generatePythonToolDefinition(endpoint: MCPEndpoint): string {
    const validParams = endpoint.parameters.filter(param => 
      param.name && 
      typeof param.name === 'string' && 
      param.name.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) // Valid Python identifier
    );
    
    const params = validParams.map(param => {
      const paramType = param.type === 'integer' ? 'int' : param.type === 'number' ? 'float' : 'str';
      const paramName = param.name.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize parameter name
      return `    ${paramName}: ${paramType}${param.required ? '' : ' = None'}`;
    }).join(',\n');

    const functionName = endpoint.name.replace(/[^a-zA-Z0-9_]/g, '_');

    return `@app.call_tool()
async def ${functionName}(
${params || '    # No parameters'}
) -> list[types.TextContent] | types.ErrorData:
    """${endpoint.description}"""
    args = {k: v for k, v in locals().items() if v is not None}
    return await handle_${endpoint.id}(args)`;
  }

  private static generateTypescriptToolHandler(endpoint: MCPEndpoint): string {
    return `    case '${endpoint.name}':
      return await handle_${endpoint.id}(args);`;
  }

  private static generateTypescriptToolListEntry(endpoint: MCPEndpoint): string {
    return `      ${endpoint.id}_tool`;
  }

  private static generateTypescriptEndpointHandler(endpoint: MCPEndpoint, baseUrl: string): string {
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

  private static generatePythonEndpointHandler(endpoint: MCPEndpoint, baseUrl: string): string {
    const pathParams = endpoint.parameters.filter(p => p.in === 'path');
    const queryParams = endpoint.parameters.filter(p => p.in === 'query');
    
    // Validate and normalize the HTTP method
    const httpMethod = endpoint.method && typeof endpoint.method === 'string' 
      ? endpoint.method.toLowerCase() 
      : 'get';

    return `
async def handle_${endpoint.id}(args: dict) -> list[types.TextContent] | types.ErrorData:
    """Handle ${endpoint.description}"""
    try:
        url = BASE_URL + "${endpoint.path}"
        
        # Replace path parameters
${pathParams.map(param => `        url = url.replace("{${param.name}}", str(args.get("${param.name}", "")))`).join('\n')}
        
        # Prepare query parameters
        params = {}
${queryParams.map(param => `        if "${param.name}" in args:
            params["${param.name}"] = args["${param.name}"]`).join('\n')}
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "MCP-Server/1.0"
        }
        
        # Make the request
        ${endpoint.method !== 'GET' ? `
        json_data = args.get("body") if "${endpoint.method}" != "GET" else None
        async with httpx.AsyncClient() as client:
            response = await client.${httpMethod}(
                url, 
                params=params, 
                json=json_data, 
                headers=headers
            )` : `
        async with httpx.AsyncClient() as client:
            response = await client.${httpMethod}(url, params=params, headers=headers)`}
        
        result = {
            "status": response.status_code,
            "statusText": response.reason_phrase,
            "data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        }
        
        return [types.TextContent(
            type="text",
            text=json.dumps(result, indent=2)
        )]
        
    except Exception as error:
        return types.ErrorData(error=f"Error calling ${endpoint.name}: {str(error)}")`;
  }
}

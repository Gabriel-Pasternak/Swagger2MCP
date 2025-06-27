import { MCPServer, MCPEndpoint } from '../types';

export class MCPGenerator {
  static generateServerPackage(server: MCPServer, language: 'typescript' | 'python'): string {
    if (language === 'python') {
      return this.generatePythonRequirements(server);
    }
    
    return JSON.stringify({
      name: `mcp-${server.id}`,
      version: '1.0.0',
      description: server.description,
      main: 'index.js',
      type: 'module',
      scripts: {
        start: 'node index.js',
        dev: 'node --watch index.js'
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.0.0',
        'node-fetch': '^3.3.2'
      },
      bin: {
        [`mcp-${server.id}`]: './index.js'
      }
    }, null, 2);
  }

  static generatePythonRequirements(server: MCPServer): string {
    return `# ${server.name} MCP Server Requirements
mcp>=1.0.0
httpx>=0.25.0
pydantic>=2.0.0
typing-extensions>=4.8.0
`;
  }

  static generateReadme(server: MCPServer, language: 'typescript' | 'python'): string {
    const installCommand = language === 'python' ? 'pip install -r requirements.txt' : 'npm install';
    const runCommand = language === 'python' ? 'python main.py' : 'npm start';
    const fileExtension = language === 'python' ? '.py' : '.js';

    return `# ${server.name} MCP Server

${server.description}

## Installation

\`\`\`bash
${installCommand}
\`\`\`

## Usage

\`\`\`bash
${runCommand}
\`\`\`

## Configuration

Make sure to update the BASE_URL in the main${fileExtension} file to match your API endpoint.

## Available Tools

${server.endpoints.map(endpoint => `
### ${endpoint.name}

${endpoint.description}

- **Method**: ${endpoint.method}
- **Path**: ${endpoint.path}
- **Parameters**:
${endpoint.parameters.map(param => `  - \`${param.name}\` (${param.type})${param.required ? ' *required*' : ''}: ${param.description || 'No description'}`).join('\n')}
`).join('\n')}

## Integration with Claude

Add this server to your Claude configuration:

\`\`\`json
{
  "mcpServers": {
    "${server.id}": {
      "command": "${language === 'python' ? 'python' : 'node'}",
      "args": ["${language === 'python' ? 'main.py' : 'index.js'}"]
    }
  }
}
\`\`\`
`;
  }

  static generateZipFile(server: MCPServer, language: 'typescript' | 'python'): Blob {
    const files: Record<string, string> = {};
    
    if (language === 'python') {
      files['requirements.txt'] = this.generatePythonRequirements(server);
      files['main.py'] = server.code.python;
    } else {
      files['package.json'] = this.generateServerPackage(server, language);
      files['index.js'] = server.code.typescript;
    }
    
    files['README.md'] = this.generateReadme(server, language);
    
    // Create a simple text representation of the zip contents
    const zipContent = Object.entries(files)
      .map(([filename, content]) => `=== ${filename} ===\n${content}\n`)
      .join('\n\n');
    
    return new Blob([zipContent], { type: 'text/plain' });
  }

  static generateTypescriptEndpointHandler(endpoint: MCPEndpoint, baseUrl: string): string {
    const pathParams = endpoint.parameters.filter(p => endpoint.path.includes(`{${p.name}}`));
    const queryParams = endpoint.parameters.filter(p => !endpoint.path.includes(`{${p.name}}`));

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

  static generatePythonEndpointHandler(endpoint: MCPEndpoint, baseUrl: string): string {
    const pathParams = endpoint.parameters.filter(p => endpoint.path.includes(`{${p.name}}`));
    const queryParams = endpoint.parameters.filter(p => !endpoint.path.includes(`{${p.name}}`));
    
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

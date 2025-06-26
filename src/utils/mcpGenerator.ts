import { MCPServer, MCPEndpoint } from '../types';

export class MCPGenerator {
  static generateServerPackage(server: MCPServer): string {
    return JSON.stringify({
      name: `mcp-${server.id}`,
      version: '1.0.0',
      description: server.description,
      main: 'index.js',
      type: 'module',
      scripts: {
        start: 'node index.js'
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

  static generateEndpointHandler(endpoint: MCPEndpoint, baseUrl: string): string {
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

  static generateReadme(server: MCPServer): string {
    return `# ${server.name} MCP Server

${server.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Available Tools

${server.endpoints.map(endpoint => `
### ${endpoint.name}

${endpoint.description}

- **Method**: ${endpoint.method}
- **Path**: ${endpoint.path}
- **Parameters**:
${endpoint.parameters.map(param => `  - \`${param.name}\` (${param.type})${param.required ? ' *required*' : ''}: ${param.description || 'No description'}`).join('\n')}
`).join('\n')}

## Configuration

Make sure to update the BASE_URL in the index.js file to match your API endpoint.
`;
  }

  static generateZipFile(server: MCPServer): Blob {
    // This is a mock implementation - in a real app you'd use a zip library
    const files = {
      'package.json': this.generateServerPackage(server),
      'index.js': server.code,
      'README.md': this.generateReadme(server)
    };
    
    // Create a simple text representation of the zip contents
    const zipContent = Object.entries(files)
      .map(([filename, content]) => `=== ${filename} ===\n${content}\n`)
      .join('\n\n');
    
    return new Blob([zipContent], { type: 'text/plain' });
  }
}
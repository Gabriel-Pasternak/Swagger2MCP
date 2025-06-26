# Swagger to MCP Server Converter + Chat Bot

Transform your APIs into intelligent chat assistants with AI-powered API execution capabilities. Upload your Swagger/OpenAPI specification and create an interactive chat interface that can execute real API calls and help users interact with your endpoints using natural language.

## ✨ Features

### 🔄 **API Conversion**
- **Swagger/OpenAPI Support**: Upload JSON or YAML specification files
- **MCP Server Generation**: Automatically generates Model Context Protocol servers
- **Real-time Processing**: Convert APIs to chat-enabled interfaces in seconds

### 🤖 **AI-Powered Chat Interface**
- **Multiple AI Providers**: Support for OpenAI GPT-4o, Google Gemini, and OpenRouter
- **Natural Language Processing**: Execute API calls using conversational commands
- **Intent Recognition**: Automatically detects when users want to perform API operations
- **Smart Parameter Extraction**: AI extracts required parameters from user messages

### 🔐 **Authentication & Security**
- **Multiple Auth Methods**: API Key, Bearer Token, Basic Authentication
- **Secure Configuration**: Protected API key storage and transmission
- **Custom Headers**: Support for custom authentication headers

### 💼 **Developer Features**
- **Code Generation**: Generate production-ready MCP server code
- **Monaco Editor**: Syntax-highlighted code viewing and editing
- **Download Support**: Export generated servers for local development
- **Real-time API Testing**: Execute live API calls through the chat interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- An API key from one of the supported AI providers:
  - [OpenAI Platform](https://platform.openai.com/api-keys)
  - [Google AI Studio](https://aistudio.google.com/app/apikey)
  - [OpenRouter](https://openrouter.ai/keys) (includes free models)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/swagger-mcp-converter.git
   cd swagger-mcp-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

## 📖 Usage Guide

### Step 1: Upload Your API Specification
- Drag and drop your Swagger/OpenAPI file (JSON or YAML)
- Supported formats: `.json`, `.yaml`, `.yml`
- The tool will automatically parse and validate your specification

### Step 2: Configure AI Provider
1. Click the **Settings** button in the chat interface
2. Choose your preferred AI provider:
   - **OpenAI**: GPT-4o, GPT-4o Mini, GPT-3.5 Turbo
   - **Google Gemini**: Gemini 2.0 Flash, Gemini 1.5 Pro
   - **OpenRouter**: Multiple models including free options
3. Enter your API key and configure authentication
4. Set up API authentication if your endpoints require it

### Step 3: Start Chatting
Use natural language to interact with your API:

```
🗣️ "Get user with ID 123"
🗣️ "List all products in the electronics category"
🗣️ "Create a new order with these items..."
🗣️ "What endpoints are available?"
```

### Step 4: Download Your MCP Server
- Use the **Download** tab to export your generated server
- Includes complete Node.js project with dependencies
- Ready for integration with Claude and other AI assistants

## ⚙️ Configuration

### AI Provider Setup

#### OpenAI
```javascript
{
  "aiProvider": "openai",
  "openaiApiKey": "sk-..."
}
```

#### Google Gemini
```javascript
{
  "aiProvider": "gemini", 
  "geminiApiKey": "AIza..."
}
```

#### OpenRouter
```javascript
{
  "aiProvider": "openrouter",
  "openrouterApiKey": "sk-or-...",
  "openrouterModel": "mistralai/mistral-small-3.2-24b-instruct:free",
  "siteUrl": "https://yoursite.com", // Optional
  "siteName": "Your Site Name" // Optional
}
```

### API Authentication

#### API Key Header
```javascript
{
  "type": "apiKey",
  "headerName": "X-API-Key",
  "apiKey": "your-api-key"
}
```

#### Bearer Token
```javascript
{
  "type": "bearer",
  "bearerToken": "your-bearer-token"
}
```

#### Basic Authentication
```javascript
{
  "type": "basic",
  "username": "your-username",
  "password": "your-password"
}
```

## 🏗️ Architecture

### Core Components

- **SwaggerParser**: Converts OpenAPI specs to MCP server definitions
- **AIClientFactory**: Manages multiple AI provider integrations
- **APIExecutor**: Handles real-time API call execution
- **MCPGenerator**: Generates production-ready MCP server code
- **ChatInterface**: Provides conversational API interaction

### Supported AI Models

| Provider | Model | Features |
|----------|-------|----------|
| OpenAI | GPT-4o | Advanced reasoning, function calling |
| OpenAI | GPT-4o Mini | Fast, cost-effective |
| Google | Gemini 2.0 Flash | Multimodal, fast processing |
| OpenRouter | Mistral Small (Free) | No-cost option |
| OpenRouter | Various | Access to 50+ models |

## 🛠️ Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Code Editor**: Monaco Editor
- **Parsing**: js-yaml for YAML support
- **Icons**: Lucide React

### Project Structure

```
src/
├── components/          # React components
│   ├── ChatInterface.tsx
│   ├── FileUpload.tsx
│   ├── ServerOverview.tsx
│   └── CodeViewer.tsx
├── hooks/              # Custom React hooks
│   ├── useChat.ts
│   └── useSwaggerToMCP.ts
├── utils/              # Utility functions
│   ├── swaggerParser.ts
│   ├── aiClientFactory.ts
│   ├── apiExecutor.ts
│   └── mcpGenerator.ts
├── types/              # TypeScript definitions
│   └── index.ts
└── App.tsx            # Main application component
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Reporting Issues

Please use the [GitHub Issues](https://github.com/yourusername/swagger-mcp-converter/issues) page to report bugs or request features.

## 📝 Examples

### Sample Swagger Input
```yaml
openapi: 3.0.0
info:
  title: Pet Store API
  version: 1.0.0
paths:
  /pets:
    get:
      summary: List all pets
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
```

### Generated Chat Interaction
```
User: "Show me all pets with a limit of 10"
Assistant: I'll fetch the pets for you with a limit of 10.

✅ API Call Executed
GET /pets?limit=10
Status: 200 OK

Results:
[
  {"id": 1, "name": "Fluffy", "type": "cat"},
  {"id": 2, "name": "Buddy", "type": "dog"}
]
```

## 🔧 Advanced Usage

### Custom Base URLs
Override the base URL from your Swagger file:
```javascript
{
  "apiBaseUrl": "https://api.production.com"
}
```

### Environment Variables
Create a `.env` file for default configurations:
```bash
VITE_DEFAULT_AI_PROVIDER=openai
VITE_DEFAULT_OPENAI_MODEL=gpt-4o
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT models
- [Google](https://ai.google.dev/) for Gemini models  
- [OpenRouter](https://openrouter.ai/) for model aggregation
- [Anthropic](https://www.anthropic.com/) for the MCP specification
- [Swagger/OpenAPI](https://swagger.io/) for API specification standards

## 🔗 Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Claude AI Integration Guide](https://docs.anthropic.com/)

---

**Made with ❤️ for the AI and API developer community**

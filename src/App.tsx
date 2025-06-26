import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ServerOverview } from './components/ServerOverview';
import { CodeViewer } from './components/CodeViewer';
import { ChatInterface } from './components/ChatInterface';
import { useSwaggerToMCP } from './hooks/useSwaggerToMCP';
import { useChat } from './hooks/useChat';
import { MCPGenerator } from './utils/mcpGenerator';
import { Zap, Github, ExternalLink, MessageCircle, Code, Database, Menu, X, FileText, Download, HelpCircle } from 'lucide-react';

function App() {
  const { server, isLoading, error, processSwaggerFile, resetServer } = useSwaggerToMCP();
  const { messages, isLoading: chatLoading, config, sendMessage, handleConfigChange } = useChat(server);
  
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'instructions' | 'code' | 'download'>('instructions');

  const handleDownload = () => {
    if (!server) return;
    
    const zipBlob = MCPGenerator.generateZipFile(server);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${server.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sidebarTabs = [
    {
      id: 'instructions' as const,
      label: 'Instructions',
      icon: HelpCircle,
    },
    {
      id: 'code' as const,
      label: 'View Code',
      icon: FileText,
    },
    {
      id: 'download' as const,
      label: 'Download',
      icon: Download,
    },
  ];

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'instructions':
        return (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Configure AI Provider</h4>
                    <p className="text-sm text-gray-600">Click the settings button in the chat to configure your AI provider (OpenAI, Gemini, or OpenRouter) and API authentication.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Start Chatting</h4>
                    <p className="text-sm text-gray-600">Ask the AI assistant to perform actions using natural language. It can execute real API calls and show you the results.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Download MCP Server</h4>
                    <p className="text-sm text-gray-600">Use the Download tab to get the generated MCP server for integration with other AI tools.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Server Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{server?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Endpoints:</span>
                  <span className="font-medium text-gray-900">{server?.endpoints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                View the generated MCP server code for your API. This code can be used to integrate with Claude and other AI assistants.
              </p>
              <button
                onClick={() => setShowCodeViewer(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Code</span>
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Code Preview</h4>
              <div className="bg-gray-900 rounded-md p-4 overflow-hidden">
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  <code>{server?.code.slice(0, 500)}...</code>
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is a preview of your generated MCP server code. Click "View Full Code" to see the complete implementation.
              </p>
            </div>
          </div>
        );

      case 'download':
        return (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Options</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download your generated MCP server and related files for local development and integration.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download MCP Server</span>
              </button>
              
              <div className="text-xs text-gray-500">
                Downloads a text file containing:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>package.json configuration</li>
                  <li>Complete server implementation</li>
                  <li>README.md with usage instructions</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Integration Guide</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p>After downloading:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Extract the contents to your project directory</li>
                  <li>Run <code className="bg-gray-100 px-1 rounded">npm install</code> to install dependencies</li>
                  <li>Configure your API base URL in the server code</li>
                  <li>Run <code className="bg-gray-100 px-1 rounded">npm start</code> to start the MCP server</li>
                </ol>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={resetServer}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Upload Another Swagger File
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              {server && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200 lg:hidden"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
              {server && !sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <Menu className="w-4 h-4" />
                  <span className="text-sm">Show Sidebar</span>
                </button>
              )}
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-gray-900">Swagger to MCP</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <a
                href="https://github.com/Gabriel-Pasternak/Swagger2MCP.git"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md transition-colors duration-200"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {!server ? (
          /* Upload Section */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Transform Your APIs into AI Chat Assistants
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Upload your Swagger/OpenAPI specification and create an intelligent chat assistant 
                  that can execute real API calls and help users interact with your endpoints naturally.
                </p>
                
                <div className="flex justify-center space-x-8 mb-8">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Parse Swagger Files</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Code className="w-5 h-5 text-purple-600" />
                    <span className="text-sm">Generate MCP Servers</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Execute API Calls</span>
                  </div>
                </div>
              </div>

              <FileUpload
                onFileSelect={processSwaggerFile}
                isLoading={isLoading}
                error={error}
                success={!!server}
              />
              
              {error && (
                <div className="mt-6 max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                  <button
                    onClick={resetServer}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chat Layout with Sidebar */
          <>
            {/* Sidebar - Fixed height, hidden scrollbar */}
            <div className={`
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              fixed lg:relative z-30 w-80 h-full bg-gray-50 border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col overflow-hidden
            `}>
              {/* Sidebar Header */}
              <div className="flex-shrink-0 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{server.name}</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 lg:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sidebar Tabs */}
              <div className="flex-shrink-0 border-b border-gray-200">
                <nav className="flex">
                  {sidebarTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex-1 px-4 py-3 text-sm font-medium border-r border-gray-200 last:border-r-0 transition-colors duration-200
                          ${activeTab === tab.id
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Content - Scrollable with hidden scrollbar */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {renderSidebarContent()}
              </div>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Main Chat Area - Full height, chat messages will scroll */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <ChatInterface
                messages={messages}
                onSendMessage={sendMessage}
                onConfigChange={handleConfigChange}
                config={config}
                isLoading={chatLoading}
                serverName={server.name}
              />
            </div>
          </>
        )}
      </div>

      {/* Code Viewer Modal */}
      {showCodeViewer && server && (
        <CodeViewer
          code={server.code}
          language="javascript"
          title={`${server.name} - MCP Server Code`}
          onClose={() => setShowCodeViewer(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

export default App;

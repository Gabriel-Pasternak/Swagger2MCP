import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Zap, CheckCircle, XCircle, Brain, Sparkles, Globe, Star, AlertCircle } from 'lucide-react';
import { ChatMessage, ServerConfig, AuthConfig } from '../types';
import { AIClientFactory } from '../utils/aiClientFactory';
import { OpenRouterClient } from '../utils/openrouterClient';
import { MessageContentRenderer } from './MessageContentRenderer';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onConfigChange: (config: ServerConfig) => void;
  config: ServerConfig;
  isLoading?: boolean;
  serverName?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onConfigChange,
  config,
  isLoading = false,
  serverName
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading && AIClientFactory.validateConfig(config)) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleSaveConfig = () => {
    onConfigChange(tempConfig);
    setShowSettings(false);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderApiResponse = (apiResponse: any) => {
    if (!apiResponse) return null;

    return (
      <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${apiResponse.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <Zap className={`w-4 h-4 ${apiResponse.success ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">API Response</span>
                  {apiResponse.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">{apiResponse.method}</span> • {apiResponse.endpoint}
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              apiResponse.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {apiResponse.statusCode}
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {apiResponse.success ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Response Data</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(apiResponse.data, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-800 font-mono leading-relaxed">
                  {JSON.stringify(apiResponse.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Error Details</span>
              </div>
              <p className="text-sm text-red-700">{apiResponse.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <Brain className="w-4 h-4 text-green-600" />;
      case 'gemini':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'openrouter':
        return <Globe className="w-4 h-4 text-purple-600" />;
      default:
        return <Brain className="w-4 h-4 text-gray-600" />;
    }
  };

  const isConfigured = AIClientFactory.validateConfig(config);
  const requiredApiKey = AIClientFactory.getRequiredApiKey(config.aiProvider);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Fixed Chat Header - Always visible with consistent height */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
            {getProviderIcon(config.aiProvider)}
            <span className="font-medium text-gray-700 truncate">
              {AIClientFactory.getProviderDisplayName(config.aiProvider)}
            </span>
            {!isConfigured && (
              <div className="flex items-center space-x-1 text-amber-600 flex-shrink-0">
                <AlertCircle className="w-3 h-3" />
                <span className="text-xs hidden sm:inline">Setup needed</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Settings button - Always visible */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200 flex-shrink-0 ml-3"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>

      {/* Messages Area - Scrollable content only */}
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                How can I help you with {serverName}?
              </h3>
              <p className="text-gray-600 mb-8">
                I can execute API calls and help you interact with your endpoints using natural language.
              </p>
              
              {isConfigured ? (
                <div className="grid grid-cols-1 gap-3 text-left max-w-md mx-auto">
                  <div 
                    className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-white" 
                    onClick={() => onSendMessage("What endpoints are available?")}
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1">🔍 Explore endpoints</div>
                    <div className="text-gray-600 text-xs">What endpoints are available?</div>
                  </div>
                  <div 
                    className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-white" 
                    onClick={() => onSendMessage("Get user with ID 1")}
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1">⚡ Test an API call</div>
                    <div className="text-gray-600 text-xs">Get user with ID 1</div>
                  </div>
                  <div 
                    className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-white" 
                    onClick={() => onSendMessage("How can you help me?")}
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1">💡 Learn capabilities</div>
                    <div className="text-gray-600 text-xs">How can you help me?</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 max-w-md mx-auto shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-800 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Configuration Required</span>
                  </div>
                  <p className="text-amber-700 text-sm mb-4">
                    Please configure your {requiredApiKey} in settings to start chatting with your API.
                  </p>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-colors text-sm font-medium shadow-md"
                  >
                    Configure Now
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="space-y-8">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white' 
                          : 'bg-gradient-to-br from-green-500 to-blue-600 text-white'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <Bot className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="font-semibold text-gray-900">
                          {message.type === 'user' ? 'You' : 'Assistant'}
                        </span>
                        {message.metadata?.executedCall && (
                          <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                            <Zap className="w-3 h-3" />
                            <span>API Call Executed</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <MessageContentRenderer content={message.content} />
                        
                        {message.metadata?.apiResponse && renderApiResponse(message.metadata.apiResponse)}
                        
                        {message.metadata?.endpoint && !message.metadata?.executedCall && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                              <span className="text-sm text-blue-800 font-medium">
                                Suggested endpoint: {message.metadata.endpoint}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="group">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-3">Assistant</div>
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-3 text-gray-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-sm">Thinking and processing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Input Area - Always accessible with consistent height */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white shadow-lg">
        {/* Configuration status bar - Fixed height to prevent layout shifts */}
        <div className="min-h-[60px] flex items-center justify-center px-4">
          {!isConfigured ? (
            <div className="w-full max-w-3xl mx-auto">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Configure {requiredApiKey} to start chatting</span>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-sm text-amber-700 hover:text-amber-900 underline font-medium"
                >
                  Configure
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto">
              <div className="flex items-center justify-center p-3 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Ready to chat with {serverName}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Input form - Always visible */}
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isConfigured ? "Type your message here..." : "Configure AI provider to start chatting"}
                  disabled={isLoading || !isConfigured}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 resize-none text-sm shadow-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim() || !isConfigured}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">AI Assistant Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Provider
                  </label>
                  <select
                    value={tempConfig.aiProvider}
                    onChange={(e) => setTempConfig({ ...tempConfig, aiProvider: e.target.value as 'openai' | 'gemini' | 'openrouter' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="gemini">Google Gemini (2.0 Flash)</option>
                    <option value="openrouter">OpenRouter (Multiple Models)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {AIClientFactory.getProviderDescription(tempConfig.aiProvider)}
                  </p>
                </div>

                {tempConfig.aiProvider === 'openai' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenAI API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={tempConfig.openaiApiKey}
                      onChange={(e) => setTempConfig({ ...tempConfig, openaiApiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>
                    </p>
                  </div>
                )}

                {tempConfig.aiProvider === 'gemini' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gemini API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={tempConfig.geminiApiKey}
                      onChange={(e) => setTempConfig({ ...tempConfig, geminiApiKey: e.target.value })}
                      placeholder="AIza..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
                    </p>
                  </div>
                )}

                {tempConfig.aiProvider === 'openrouter' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OpenRouter API Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={tempConfig.openrouterApiKey}
                        onChange={(e) => setTempConfig({ ...tempConfig, openrouterApiKey: e.target.value })}
                        placeholder="sk-or-..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter</a>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={tempConfig.openrouterModel}
                        onChange={(e) => setTempConfig({ ...tempConfig, openrouterModel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        {OpenRouterClient.getAvailableModels().map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} {model.free && '(Free)'}
                          </option>
                        ))}
                      </select>
                      {OpenRouterClient.getAvailableModels().find(m => m.id === tempConfig.openrouterModel)?.free && (
                        <p className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>Free model selected - no API costs!</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={tempConfig.siteUrl || ''}
                          onChange={(e) => setTempConfig({ ...tempConfig, siteUrl: e.target.value })}
                          placeholder="https://yoursite.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={tempConfig.siteName || ''}
                          onChange={(e) => setTempConfig({ ...tempConfig, siteName: e.target.value })}
                          placeholder="Your Site"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Site info helps with OpenRouter analytics and rankings (optional)
                    </p>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Base URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={tempConfig.apiBaseUrl || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, apiBaseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Override the base URL from your Swagger file if needed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Authentication
                  </label>
                  <select
                    value={tempConfig.authConfig?.type || 'none'}
                    onChange={(e) => setTempConfig({
                      ...tempConfig,
                      authConfig: { ...tempConfig.authConfig, type: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="none">No Authentication</option>
                    <option value="apiKey">API Key Header</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Authentication</option>
                  </select>
                </div>

                {tempConfig.authConfig?.type === 'apiKey' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header Name
                      </label>
                      <input
                        type="text"
                        value={tempConfig.authConfig?.headerName || ''}
                        onChange={(e) => setTempConfig({
                          ...tempConfig,
                          authConfig: { ...tempConfig.authConfig, headerName: e.target.value }
                        })}
                        placeholder="X-API-Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key Value
                      </label>
                      <input
                        type="password"
                        value={tempConfig.authConfig?.apiKey || ''}
                        onChange={(e) => setTempConfig({
                          ...tempConfig,
                          authConfig: { ...tempConfig.authConfig, apiKey: e.target.value }
                        })}
                        placeholder="your-api-key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {tempConfig.authConfig?.type === 'bearer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bearer Token
                    </label>
                    <input
                      type="password"
                      value={tempConfig.authConfig?.bearerToken || ''}
                      onChange={(e) => setTempConfig({
                        ...tempConfig,
                        authConfig: { ...tempConfig.authConfig, bearerToken: e.target.value }
                      })}
                      placeholder="your-bearer-token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                )}

                {tempConfig.authConfig?.type === 'basic' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={tempConfig.authConfig?.username || ''}
                        onChange={(e) => setTempConfig({
                          ...tempConfig,
                          authConfig: { ...tempConfig.authConfig, username: e.target.value }
                        })}
                        placeholder="username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={tempConfig.authConfig?.password || ''}
                        onChange={(e) => setTempConfig({
                          ...tempConfig,
                          authConfig: { ...tempConfig.authConfig, password: e.target.value }
                        })}
                        placeholder="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  * Required fields must be filled
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setTempConfig(config); // Reset to original config
                      setShowSettings(false);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={!AIClientFactory.validateConfig(tempConfig)}
                    className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
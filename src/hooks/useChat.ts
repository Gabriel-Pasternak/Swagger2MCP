import { useState, useCallback } from 'react';
import { ChatMessage, ServerConfig, MCPServer } from '../types';
import { AIClientFactory, AIClient } from '../utils/aiClientFactory';

export const useChat = (server: MCPServer | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ServerConfig>({
    aiProvider: 'openai',
    openaiApiKey: '',
    geminiApiKey: '',
    openrouterApiKey: '',
    openrouterModel: 'mistralai/mistral-small-3.2-24b-instruct:free',
    siteUrl: '',
    siteName: '',
    apiBaseUrl: '',
    authConfig: { type: 'none' }
  });

  const [aiClient, setAiClient] = useState<AIClient | null>(null);

  const handleConfigChange = useCallback((newConfig: ServerConfig) => {
    setConfig(newConfig);
    
    // Create new AI client based on provider
    if (AIClientFactory.validateConfig(newConfig)) {
      const client = AIClientFactory.createClient(newConfig);
      setAiClient(client);
      
      if (server) {
        // Update server base URL if provided
        const updatedServer = {
          ...server,
          baseUrl: newConfig.apiBaseUrl || server.baseUrl
        };
        client.setServer(updatedServer, newConfig.authConfig);
      }
    } else {
      setAiClient(null);
    }
  }, [server]);

  const sendMessage = useCallback(async (content: string) => {
    if (!aiClient || !server) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get response from AI client (which may include API execution)
      const result = await aiClient.chat(messages, content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
        metadata: {
          executedCall: result.executedCall,
          apiResponse: result.apiResult,
          endpoint: result.apiResult?.endpoint
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [aiClient, server, messages]);

  // Update AI client when server changes
  useState(() => {
    if (server && aiClient) {
      const updatedServer = {
        ...server,
        baseUrl: config.apiBaseUrl || server.baseUrl
      };
      aiClient.setServer(updatedServer, config.authConfig);
    }
  });

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    config,
    sendMessage,
    handleConfigChange,
    clearMessages
  };
};
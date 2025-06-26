import { OpenAIClient } from './openaiClient';
import { GeminiClient } from './geminiClient';
import { OpenRouterClient } from './openrouterClient';
import { ServerConfig } from '../types';

export type AIClient = OpenAIClient | GeminiClient | OpenRouterClient;

export class AIClientFactory {
  static createClient(config: ServerConfig): AIClient {
    switch (config.aiProvider) {
      case 'openai':
        return new OpenAIClient(config.openaiApiKey);
      case 'gemini':
        return new GeminiClient(config.geminiApiKey);
      case 'openrouter':
        return new OpenRouterClient(
          config.openrouterApiKey, 
          config.openrouterModel, 
          config.siteUrl, 
          config.siteName
        );
      default:
        throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
    }
  }

  static validateConfig(config: ServerConfig): boolean {
    switch (config.aiProvider) {
      case 'openai':
        return !!config.openaiApiKey;
      case 'gemini':
        return !!config.geminiApiKey;
      case 'openrouter':
        return !!(config.openrouterApiKey && config.openrouterModel);
      default:
        return false;
    }
  }

  static getRequiredApiKey(provider: 'openai' | 'gemini' | 'openrouter'): string {
    switch (provider) {
      case 'openai':
        return 'OpenAI API Key';
      case 'gemini':
        return 'Gemini API Key';
      case 'openrouter':
        return 'OpenRouter API Key';
      default:
        return 'API Key';
    }
  }

  static getProviderDisplayName(provider: 'openai' | 'gemini' | 'openrouter'): string {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'gemini':
        return 'Google Gemini';
      case 'openrouter':
        return 'OpenRouter';
      default:
        return provider;
    }
  }

  static getProviderDescription(provider: 'openai' | 'gemini' | 'openrouter'): string {
    switch (provider) {
      case 'openai':
        return 'GPT-4o and other OpenAI models';
      case 'gemini':
        return 'Google\'s Gemini models';
      case 'openrouter':
        return 'Access to multiple AI models via OpenRouter';
      default:
        return '';
    }
  }

  static getSupportedModels(provider: 'openai' | 'gemini' | 'openrouter'): Array<{ id: string; name: string; free?: boolean }> {
    switch (provider) {
      case 'openai':
        return [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
        ];
      case 'gemini':
        return [
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
        ];
      case 'openrouter':
        return OpenRouterClient.getAvailableModels();
      default:
        return [];
    }
  }
}
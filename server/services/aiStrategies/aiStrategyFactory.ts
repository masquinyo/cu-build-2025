import AnthropicStrategy from './anthropicStrategy';

interface AIConfig {
  provider?: string;
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  toolsEndpoint?: string;
}

interface ProviderInfo {
  name: string;
  displayName: string;
  supported: boolean;
  models: string[];
}

interface AIStrategy {
  generateResponse(prompt: string, tools?: any[]): Promise<string>;
  getModelInfo(): any;
  getAvailableTools?(): Promise<any[]>;
}

class AIStrategyFactory {
  static createStrategy(config: AIConfig): AIStrategy {
    const provider = config.provider?.toLowerCase() || 'anthropic';
    
    switch (provider) {
      case 'anthropic':
        return new AnthropicStrategy({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
          model: config.model,
          maxTokens: config.maxTokens,
          toolsEndpoint: config.toolsEndpoint
        });
      
      case 'openai':
        throw new Error('OpenAI provider not yet implemented');
      
      case 'google':
        throw new Error('Google provider not yet implemented');
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  static getSupportedProviders(): ProviderInfo[] {
    return [
      {
        name: 'anthropic',
        displayName: 'Anthropic Claude',
        supported: true,
        models: [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
          'claude-sonnet-4-20250514'
        ]
      },
      {
        name: 'openai',
        displayName: 'OpenAI GPT',
        supported: false,
        models: ['gpt-4', 'gpt-3.5-turbo']
      },
      {
        name: 'google',
        displayName: 'Google Gemini',
        supported: false,
        models: ['gemini-pro', 'gemini-pro-vision']
      }
    ];
  }

  static validateConfiguration(config: AIConfig): boolean {
    if (!config.apiKey) {
      throw new Error('AI API key is required');
    }

    if (!config.provider) {
      throw new Error('AI provider is required');
    }

    const supportedProviders = this.getSupportedProviders()
      .filter(p => p.supported)
      .map(p => p.name);

    if (!supportedProviders.includes(config.provider.toLowerCase())) {
      throw new Error(`Unsupported provider: ${config.provider}. Supported: ${supportedProviders.join(', ')}`);
    }

    return true;
  }
}

export default AIStrategyFactory;
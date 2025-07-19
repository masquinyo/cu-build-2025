import Anthropic from '@anthropic-ai/sdk';

interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
}

interface ModelCapabilities {
  tier: string;
  contextWindow: number;
  strengths: string[];
  costTier: string;
}

interface ModelInfo {
  provider: string;
  model: string;
  maxTokens: number;
  capabilities: ModelCapabilities;
}

class AnthropicStrategy {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.anthropic.com'
    });
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.maxTokens = config.maxTokens || 2000;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      console.log(`🤖 AnthropicStrategy.generateResponse() called with model: ${this.model}`);
      console.log(`🤖 Prompt length: ${prompt.length} characters`);
      
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      if (response.content && response.content.length > 0) {
        const contentBlock = response.content[0];
        if (contentBlock.type === 'text') {
          return contentBlock.text;
        }
      }
      
      throw new Error('Empty response from Anthropic API');
    } catch (error: any) {
      console.error('Anthropic API error:', error.message);
      throw new Error(`Anthropic API failed: ${error.message}`);
    }
  }

  getModelInfo(): ModelInfo {
    return {
      provider: 'anthropic',
      model: this.model,
      maxTokens: this.maxTokens,
      capabilities: this.getModelCapabilities()
    };
  }

  getModelCapabilities(): ModelCapabilities {
    const capabilities: Record<string, ModelCapabilities> = {
      'claude-3-opus-20240229': {
        tier: 'premium',
        contextWindow: 200000,
        strengths: ['Complex reasoning', 'Creative writing', 'Analysis'],
        costTier: 'high'
      },
      'claude-3-sonnet-20240229': {
        tier: 'balanced',
        contextWindow: 200000,
        strengths: ['Balanced performance', 'Good reasoning', 'Efficient'],
        costTier: 'medium'
      },
      'claude-3-haiku-20240307': {
        tier: 'fast',
        contextWindow: 200000,
        strengths: ['Speed', 'Low cost', 'Simple tasks'],
        costTier: 'low'
      },
      'claude-sonnet-4-20250514': {
        tier: 'latest',
        contextWindow: 200000,
        strengths: ['Latest features', 'Enhanced reasoning', 'Improved accuracy'],
        costTier: 'premium'
      }
    };

    return capabilities[this.model] || {
      tier: 'unknown',
      contextWindow: 200000,
      strengths: ['General purpose'],
      costTier: 'medium'
    };
  }

  validateModel(model: string): boolean {
    const supportedModels = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
      'claude-sonnet-4-20250514'
    ];

    return supportedModels.includes(model);
  }
}

export default AnthropicStrategy;
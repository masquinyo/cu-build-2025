import AIStrategyFactory from './aiStrategies/aiStrategyFactory';

interface AIServiceConfig {
  provider?: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  toolsEndpoint?: string;
}

interface AccountData {
  accountId: string;
  memberId?: string; // Keep for backward compatibility
  mcpServerUrl?: string;
  memberExists?: boolean;
  monthlyDeposits?: number | null;
  nsfFees?: number | null;
  balanceRatio?: number | null;
  spendingRatio?: number | null;
  income?: number | null;
  contextData?: any;
  memoryData?: any;
  serverResponses?: any;
  serverErrors?: any;
}

interface CriteriaData {
  met: boolean;
  value: number;
  target: number;
  description: string;
}

interface DetailedExplanation {
  calculation: string;
  reasoning: string;
  impact: string;
  improvement: string;
}

interface AnalysisResult {
  'exists-state': boolean;
  overallScore: string;
  scoreValue: number;
  criteria: {
    monthlyDeposits: CriteriaData;
    nsfFees: CriteriaData;
    balanceRatio: CriteriaData;
    spendingRatio: CriteriaData;
  };
  recommendations: string[];
  encouragementMessage: string;
  detailedExplanations?: {
    monthlyDeposits: DetailedExplanation;
    nsfFees: DetailedExplanation;
    balanceRatio: DetailedExplanation;
    spendingRatio: DetailedExplanation;
    overallScore: DetailedExplanation;
  };
  aiModelInfo?: any;
}

interface AIStrategy {
  generateResponse(prompt: string, tools?: any[]): Promise<string>;
  getModelInfo(): any;
  getAvailableTools?(): Promise<any[]>;
}

class AIService {
  private strategy: AIStrategy;
  private toolsEndpoint: string | undefined;

  constructor(config: AIServiceConfig) {
    AIStrategyFactory.validateConfiguration(config);
    
    const apiKey = config.apiKey || process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('AI API key is required');
    }

    this.strategy = AIStrategyFactory.createStrategy({
      provider: config.provider || process.env.AI_PROVIDER || 'anthropic',
      apiKey: apiKey,
      baseURL: config.baseURL || process.env.AI_SERVICE_URL,
      model: config.model || process.env.AI_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: config.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '2000'),
      toolsEndpoint: config.toolsEndpoint || process.env.AI_TOOLS_ENDPOINT
    });

    this.toolsEndpoint = config.toolsEndpoint || process.env.AI_TOOLS_ENDPOINT;

    console.log(`🤖 AI Service initialized with ${this.strategy.getModelInfo().provider} - ${this.strategy.getModelInfo().model}`);
    if (this.toolsEndpoint) {
      console.log(`🔧 Tools endpoint configured: ${this.toolsEndpoint}`);
    }
  }

  async generateFinancialHealthAnalysis(accountData: AccountData): Promise<AnalysisResult> {
    try {
      // Check if account exists first
      if (accountData.memberExists === false) {
        console.log(`⚠️ Account ${accountData.accountId} not found in system`);
        return this.createMemberNotFoundResponse(accountData.accountId);
      }
      
      console.log(`🔍 [DEBUG] Account ID: ${accountData.accountId}`);
      console.log(`⚠️ generateFinancialHealthAnalysis method is deprecated - chatbot uses buildSystemPrompt instead`);
      
      // Return a simple fallback response since chatbot uses buildSystemPrompt
      const analysisResult = {
        "exists-state": true,
        overallScore: "Analysis available via chatbot",
        scoreValue: 0,
        criteria: {
          monthlyDeposits: { met: false, value: 0, target: 1200, description: "Use chatbot for analysis" },
          nsfFees: { met: false, value: 0, target: 3, description: "Use chatbot for analysis" },
          balanceRatio: { met: false, value: 0, target: 0.20, description: "Use chatbot for analysis" },
          spendingRatio: { met: false, value: 0, target: 0.95, description: "Use chatbot for analysis" }
        },
        recommendations: ["Please use the chatbot interface for financial analysis"],
        encouragementMessage: "Use the interactive chatbot for personalized financial insights",
        aiModelInfo: this.strategy.getModelInfo()
      };
      
      analysisResult.aiModelInfo = this.strategy.getModelInfo();
      
      return analysisResult;
    } catch (error: any) {
      console.error('AI Service error:', error);
      throw new Error(`Failed to analyze financial health: ${error.message}`);
    }
  }

  // buildAnalysisPrompt and related methods removed - chatbot uses buildSystemPrompt from ChatbotService instead



  private createMemberNotFoundResponse(_accountId: string): AnalysisResult {
    return {
      "exists-state": false,
      overallScore: "N/A",
      scoreValue: 0,
      criteria: {
        monthlyDeposits: { 
          met: false, 
          value: 0, 
          target: 0,
          description: "Member not found in system"
        },
        nsfFees: { 
          met: false, 
          value: 0, 
          target: 0,
          description: "Member not found in system"
        },
        balanceRatio: { 
          met: false, 
          value: 0, 
          target: 0,
          description: "Member not found in system"
        },
        spendingRatio: { 
          met: false, 
          value: 0, 
          target: 0,
          description: "Member not found in system"
        }
      },
      recommendations: [],
      encouragementMessage: "",
      aiModelInfo: this.strategy ? this.strategy.getModelInfo() : {
        provider: 'system',
        model: 'member-validation',
        capabilities: { tier: 'validation', strengths: ['Member existence check'] }
      }
    };
  }

  getModelInfo(): any {
    return this.strategy ? this.strategy.getModelInfo() : null;
  }

  getSupportedProviders(): any {
    return AIStrategyFactory.getSupportedProviders();
  }

  async getAvailableTools(): Promise<any[]> {
    if (this.strategy.getAvailableTools) {
      return await this.strategy.getAvailableTools();
    }
    return [];
  }

  getToolsEndpoint(): string | undefined {
    return this.toolsEndpoint;
  }
}

export default AIService;
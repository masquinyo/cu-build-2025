import AIService from '../services/aiService';

// Mock environment variables
process.env.AI_API_KEY = 'test-api-key';
process.env.AI_PROVIDER = 'anthropic';
process.env.AI_MODEL = 'claude-3-sonnet-20240229';

// Mock the AIStrategyFactory and strategy
jest.mock('../services/aiStrategies/aiStrategyFactory', () => ({
  default: {
    validateConfiguration: jest.fn(),
    createStrategy: jest.fn(() => ({
      generateResponse: jest.fn(),
      getModelInfo: jest.fn(() => ({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' }))
    })),
    getSupportedProviders: jest.fn(() => ['anthropic', 'openai'])
  }
}));

describe('AIService', () => {
  let aiService: AIService;
  let mockStrategy: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh AIService instance
    aiService = new AIService({
      provider: 'anthropic',
      apiKey: 'test-api-key',
      model: 'claude-3-sonnet-20240229'
    });

    // Get the mocked strategy
    const AIStrategyFactory = require('../services/aiStrategies/aiStrategyFactory').default;
    mockStrategy = AIStrategyFactory.createStrategy();
  });

  describe('Constructor', () => {
    it('should initialize with provided configuration', () => {
      expect(aiService).toBeDefined();
      expect(mockStrategy.getModelInfo).toHaveBeenCalled();
    });

    it('should use environment variables as fallback', () => {
      const service = new AIService({});
      expect(service).toBeDefined();
    });
  });

  describe('generateFinancialHealthAnalysis', () => {
    const mockMemberData = {
      memberId: '484877878',
      monthlyDeposits: 1500,
      nsfFees: 2,
      balanceRatio: 0.25,
      spendingRatio: 0.97,
      income: 5000,
      contextData: {
        memberProfile: 'Test profile',
        riskAssessment: 'Low risk'
      },
      memoryData: {
        historicalTrends: 'Improving',
        patterns: ['consistent deposits']
      },
      serverResponses: {
        primary: { success: true },
        context7: { success: true }
      },
      serverErrors: {}
    };

    const mockValidAIResponse = JSON.stringify({
      overallScore: "Good",
      scoreValue: 82,
      criteria: {
        monthlyDeposits: { met: true, value: 1500, target: 1200, description: "Minimum monthly deposits requirement" },
        nsfFees: { met: true, value: 2, target: 3, description: "Maximum NSF fees in 6 months" },
        balanceRatio: { met: true, value: 0.25, target: 0.20, description: "Average daily balance as percentage of income" },
        spendingRatio: { met: true, value: 0.97, target: 0.95, description: "Spending efficiency relative to deposits" }
      },
      recommendations: [
        "Continue maintaining excellent monthly deposit consistency",
        "Keep monitoring spending to avoid NSF fees",
        "Consider increasing emergency fund balance",
        "Maintain current spending efficiency levels"
      ],
      encouragementMessage: "Great job maintaining strong financial habits!",
      detailedExplanations: {
        monthlyDeposits: {
          calculation: "Monthly deposits calculated from transaction history",
          reasoning: "Deposits exceed minimum threshold consistently",
          impact: "Positive impact on financial stability",
          improvement: "Continue current deposit patterns"
        },
        nsfFees: {
          calculation: "NSF fees counted over 6-month period",
          reasoning: "Low NSF fee count indicates good account management",
          impact: "Minimal negative impact on financial health",
          improvement: "Maintain current account monitoring practices"
        },
        balanceRatio: {
          calculation: "Average daily balance divided by monthly income",
          reasoning: "Balance ratio exceeds recommended threshold",
          impact: "Indicates good cash flow management",
          improvement: "Consider optimizing balance for higher returns"
        },
        spendingRatio: {
          calculation: "Spending as percentage of deposits",
          reasoning: "Efficient spending patterns observed",
          impact: "Indicates disciplined financial behavior",
          improvement: "Continue monitoring discretionary spending"
        },
        overallScore: {
          calculation: "Weighted average of all criteria",
          reasoning: "All criteria met with strong performance",
          impact: "Excellent financial health trajectory",
          improvement: "Maintain current practices with minor optimizations"
        }
      }
    });

    it('should successfully analyze financial health with valid data', async () => {
      mockStrategy.generateResponse.mockResolvedValue(mockValidAIResponse);

      const result = await aiService.generateFinancialHealthAnalysis(mockMemberData);

      expect(mockStrategy.generateResponse).toHaveBeenCalledWith(expect.stringContaining('Member ID: 484877878'));
      expect(result.overallScore).toBe('Good');
      expect(result.scoreValue).toBe(82);
      expect(result.criteria.monthlyDeposits.met).toBe(true);
      expect(result.aiModelInfo).toBeDefined();
    });

    it('should handle AI response parsing errors gracefully', async () => {
      mockStrategy.generateResponse.mockResolvedValue('Invalid JSON response');

      await expect(aiService.generateFinancialHealthAnalysis(mockMemberData))
        .rejects
        .toThrow('AI response parsing failed and no fallback data available');
    });

    it('should handle AI service errors', async () => {
      mockStrategy.generateResponse.mockRejectedValue(new Error('API Error'));

      await expect(aiService.generateFinancialHealthAnalysis(mockMemberData))
        .rejects
        .toThrow('Failed to analyze financial health: API Error');
    });

    it('should include contextual data in the prompt', async () => {
      mockStrategy.generateResponse.mockResolvedValue(mockValidAIResponse);

      await aiService.generateFinancialHealthAnalysis(mockMemberData);

      const calledPrompt = mockStrategy.generateResponse.mock.calls[0][0];
      expect(calledPrompt).toContain('Member Profile: Test profile');
      expect(calledPrompt).toContain('Historical Trends: Improving');
      expect(calledPrompt).toContain('primary: Connected and responding');
    });

    it('should handle missing contextual data', async () => {
      const minimalData = {
        memberId: '484877878',
        monthlyDeposits: 1000,
        nsfFees: 1,
        balanceRatio: 0.15,
        spendingRatio: 0.93,
        income: 4000
      };

      mockStrategy.generateResponse.mockResolvedValue(mockValidAIResponse);

      await aiService.generateFinancialHealthAnalysis(minimalData);

      const calledPrompt = mockStrategy.generateResponse.mock.calls[0][0];
      expect(calledPrompt).toContain('No contextual data available');
      expect(calledPrompt).toContain('No historical data available');
    });
  });

  describe('Response Validation', () => {
    it('should validate required fields in AI response', async () => {
      const invalidResponse = JSON.stringify({
        overallScore: "Good",
        // Missing scoreValue, criteria, recommendations, encouragementMessage
      });

      mockStrategy.generateResponse.mockResolvedValue(invalidResponse);

      await expect(aiService.generateFinancialHealthAnalysis({
        memberId: '484877878',
        monthlyDeposits: 1000
      })).rejects.toThrow('AI response parsing failed');
    });

    it('should validate criteria structure', async () => {
      const invalidCriteriaResponse = JSON.stringify({
        overallScore: "Good",
        scoreValue: 75,
        criteria: {
          monthlyDeposits: { met: true, value: 1200, target: 1200, description: "Valid" },
          // Missing other required criteria
        },
        recommendations: ["Test recommendation"],
        encouragementMessage: "Good job!"
      });

      mockStrategy.generateResponse.mockResolvedValue(invalidCriteriaResponse);

      await expect(aiService.generateFinancialHealthAnalysis({
        memberId: '484877878',
        monthlyDeposits: 1200
      })).rejects.toThrow('AI response parsing failed');
    });
  });

  describe('Utility Methods', () => {
    it('should return model info', () => {
      const modelInfo = aiService.getModelInfo();
      expect(modelInfo).toEqual({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' });
    });

    it('should return supported providers', () => {
      const providers = aiService.getSupportedProviders();
      expect(providers).toEqual(['anthropic', 'openai']);
    });
  });
});
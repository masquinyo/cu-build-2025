import request from 'supertest';
import app from '../index';

// Mock environment variables
process.env.AI_API_KEY = 'test-api-key';
process.env.AI_PROVIDER = 'anthropic';
process.env.MCP_SERVER_URL = 'http://localhost:3002';

// Mock MCP Server Manager
jest.mock('../services/mcpServerManager', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
    queryAllServers: jest.fn().mockResolvedValue({
      results: {
        primary: {
          monthlyDeposits: 1500,
          nsfFees: 2,
          balanceRatio: 0.25,
          spendingRatio: 0.97,
          income: 5000
        },
        context7: {
          contextData: {
            memberProfile: 'Premium member with consistent banking history',
            riskAssessment: 'Low risk - stable income and spending patterns'
          }
        },
        memory: {
          memoryData: {
            historicalTrends: 'Consistent improvement over past 6 months',
            patterns: ['regular deposits', 'controlled spending']
          }
        }
      },
      errors: {}
    }),
    getServerStatus: jest.fn().mockReturnValue({
      primary: { status: 'connected', lastResponse: Date.now() },
      context7: { status: 'connected', lastResponse: Date.now() },
      memory: { status: 'connected', lastResponse: Date.now() }
    })
  }));
});

// Mock AI Service
jest.mock('../services/aiService', () => {
  return jest.fn().mockImplementation(() => ({
    generateFinancialHealthAnalysis: jest.fn().mockResolvedValue({
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
      encouragementMessage: "Great job maintaining strong financial habits! Your consistent deposits and controlled spending show excellent financial discipline.",
      detailedExplanations: {
        monthlyDeposits: {
          calculation: "Monthly deposits of $1,500 calculated from recent transaction history",
          reasoning: "Deposits exceed minimum threshold of $1,200 consistently over the analysis period",
          impact: "Strong deposit patterns indicate stable income and good financial planning",
          improvement: "Continue current deposit patterns and consider automating savings transfers"
        },
        nsfFees: {
          calculation: "2 NSF fees counted over the past 6-month period",
          reasoning: "Low NSF fee count indicates good account management and cash flow awareness",
          impact: "Minimal negative impact on financial health with room for improvement",
          improvement: "Set up account balance alerts to completely eliminate NSF fees"
        },
        balanceRatio: {
          calculation: "Average daily balance of 25% of monthly income ($1,250 average balance)",
          reasoning: "Balance ratio exceeds the recommended 20% threshold, showing good liquidity management",
          impact: "Indicates excellent cash flow management and emergency preparedness",
          improvement: "Consider optimizing excess cash for higher-yield savings or investment opportunities"
        },
        spendingRatio: {
          calculation: "Spending efficiency of 97% calculated as spending relative to deposits",
          reasoning: "High efficiency indicates disciplined spending within income limits",
          impact: "Demonstrates strong financial discipline and budget adherence",
          improvement: "Continue monitoring discretionary spending categories for optimization opportunities"
        },
        overallScore: {
          calculation: "Weighted average of all criteria: (100+100+100+100)/4 = 100% criteria met = 82/100 score",
          reasoning: "All four financial health criteria are met with strong performance in each area",
          impact: "Excellent financial health trajectory with sustainable habits established",
          improvement: "Maintain current practices while exploring advanced financial optimization strategies"
        }
      },
      aiModelInfo: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' }
    }),
    getModelInfo: jest.fn().mockReturnValue({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' }),
    getSupportedProviders: jest.fn().mockReturnValue(['anthropic', 'openai'])
  }));
});

describe('Financial Health API Integration Tests', () => {
  describe('POST /api/financial-health/:memberId', () => {
    it('should successfully analyze financial health for member 484877878', async () => {
      const response = await request(app)
        .post('/api/financial-health/484877878')
        .expect(200);

      expect(response.body).toHaveProperty('overallScore', 'Good');
      expect(response.body).toHaveProperty('scoreValue', 82);
      expect(response.body).toHaveProperty('criteria');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('encouragementMessage');
      expect(response.body).toHaveProperty('mcpServerStatus');
      expect(response.body).toHaveProperty('aiModelInfo');

      // Verify criteria structure
      expect(response.body.criteria).toHaveProperty('monthlyDeposits');
      expect(response.body.criteria).toHaveProperty('nsfFees');
      expect(response.body.criteria).toHaveProperty('balanceRatio');
      expect(response.body.criteria).toHaveProperty('spendingRatio');

      // Verify each criterion has required fields
      Object.values(response.body.criteria).forEach((criterion: any) => {
        expect(criterion).toHaveProperty('met');
        expect(criterion).toHaveProperty('value');
        expect(criterion).toHaveProperty('target');
        expect(criterion).toHaveProperty('description');
      });

      // Verify recommendations is an array
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.recommendations.length).toBeGreaterThan(0);

      // Verify detailed explanations
      expect(response.body.detailedExplanations).toHaveProperty('monthlyDeposits');
      expect(response.body.detailedExplanations).toHaveProperty('nsfFees');
      expect(response.body.detailedExplanations).toHaveProperty('balanceRatio');
      expect(response.body.detailedExplanations).toHaveProperty('spendingRatio');
      expect(response.body.detailedExplanations).toHaveProperty('overallScore');
    });

    it('should handle missing member ID', async () => {
      const response = await request(app)
        .post('/api/financial-health/')
        .expect(404);
    });

    it('should handle empty member ID', async () => {
      const response = await request(app)
        .post('/api/financial-health/ ')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should use caching for duplicate requests', async () => {
      // First request
      const response1 = await request(app)
        .post('/api/financial-health/484877878')
        .expect(200);

      // Second request (should be cached)
      const response2 = await request(app)
        .post('/api/financial-health/484877878')
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('mcpServers');
      expect(response.body).toHaveProperty('aiConfigured', true);
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/config', () => {
    it('should return configuration information', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(200);

      expect(response.body).toHaveProperty('mcpServerUrl');
      expect(response.body).toHaveProperty('context7Enabled');
      expect(response.body).toHaveProperty('memoryEnabled');
      expect(response.body).toHaveProperty('aiConfigured', true);
      expect(response.body).toHaveProperty('aiModelInfo');
      expect(response.body).toHaveProperty('supportedProviders');

      // Verify AI model info structure
      expect(response.body.aiModelInfo).toHaveProperty('provider', 'anthropic');
      expect(response.body.aiModelInfo).toHaveProperty('model', 'claude-3-sonnet-20240229');

      // Verify supported providers is an array
      expect(Array.isArray(response.body.supportedProviders)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      // Mock AI service to throw an error
      const AIService = require('../services/aiService');
      const mockInstance = new AIService();
      mockInstance.generateFinancialHealthAnalysis.mockRejectedValueOnce(new Error('AI API Error'));

      const response = await request(app)
        .post('/api/financial-health/test-error-member')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle MCP server errors', async () => {
      // Mock MCP manager to return errors
      const MCPServerManager = require('../services/mcpServerManager');
      const mockInstance = new MCPServerManager();
      mockInstance.queryAllServers.mockResolvedValueOnce({
        results: {},
        errors: {
          primary: 'Connection failed',
          context7: 'Timeout error'
        }
      });

      const response = await request(app)
        .post('/api/financial-health/no-data-member')
        .expect(200);

      // Should return a "no data" response when MCP servers fail
      expect(response.body).toHaveProperty('error', 'No Financial Health found');
      expect(response.body).toHaveProperty('hasData', false);
      expect(response.body).toHaveProperty('mcpServerStatus');
    });
  });

  describe('Data Validation', () => {
    it('should handle insufficient financial data', async () => {
      // Mock MCP manager to return minimal data
      const MCPServerManager = require('../services/mcpServerManager');
      const mockInstance = new MCPServerManager();
      mockInstance.queryAllServers.mockResolvedValueOnce({
        results: {
          primary: {
            // No meaningful financial data
            someOtherField: 'value'
          }
        },
        errors: {}
      });

      const response = await request(app)
        .post('/api/financial-health/minimal-data-member')
        .expect(200);

      expect(response.body).toHaveProperty('error', 'No Financial Health found');
      expect(response.body).toHaveProperty('hasData', false);
    });
  });
});
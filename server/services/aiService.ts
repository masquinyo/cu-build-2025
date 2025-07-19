import AIStrategyFactory from './aiStrategies/aiStrategyFactory';

interface AIServiceConfig {
  provider?: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
}

interface MemberData {
  memberId: string;
  monthlyDeposits?: number;
  nsfFees?: number;
  balanceRatio?: number;
  spendingRatio?: number;
  income?: number;
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
  generateResponse(prompt: string): Promise<string>;
  getModelInfo(): any;
}

class AIService {
  private strategy: AIStrategy;

  constructor(config: AIServiceConfig) {
    AIStrategyFactory.validateConfiguration(config);
    
    this.strategy = AIStrategyFactory.createStrategy({
      provider: config.provider || process.env.AI_PROVIDER || 'anthropic',
      apiKey: config.apiKey || process.env.AI_API_KEY!,
      baseURL: config.baseURL || process.env.AI_SERVICE_URL,
      model: config.model || process.env.AI_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: config.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '2000')
    });

    console.log(`🤖 AI Service initialized with ${this.strategy.getModelInfo().provider} - ${this.strategy.getModelInfo().model}`);
  }

  async generateFinancialHealthAnalysis(memberData: MemberData): Promise<AnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(memberData);
      
      console.log(`🔄 Generating financial health analysis using ${this.strategy.getModelInfo().model}`);
      const responseText = await this.strategy.generateResponse(prompt);
      
      const analysisResult = this.parseAIResponse(responseText);
      
      analysisResult.aiModelInfo = this.strategy.getModelInfo();
      
      return analysisResult;
    } catch (error: any) {
      console.error('AI Service error:', error);
      throw new Error(`Failed to analyze financial health: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(memberData: MemberData): string {
    const contextInfo = this.formatContextData(memberData.contextData);
    const memoryInfo = this.formatMemoryData(memberData.memoryData);
    const serverInfo = this.formatServerResponses(memberData.serverResponses, memberData.serverErrors);

    return `
      You are a financial health analyst with access to multiple data sources. Analyze the following member's comprehensive financial data and provide a detailed assessment.

      IMPORTANT: First, query the member profile from the MCP server to determine if the member exists in the database. Include an "exists-state" property in your response indicating whether the member was found.

      Member ID: ${memberData.memberId}
      
      INSTRUCTIONS FOR MCP SERVER:
      1. Query the member profile using the provided Member ID
      2. Return exists-state: true if member profile is found, false if not found
      3. If member exists, return all available financial data
      4. If member does not exist, return exists-state: false and skip financial analysis
      
      PRIMARY FINANCIAL DATA:
      - Monthly Deposits: ${memberData.monthlyDeposits || 'N/A'}
      - NSF Fees (6 months): ${memberData.nsfFees || 'N/A'}
      - Average Daily Balance Ratio: ${memberData.balanceRatio || 'N/A'}
      - Spending Ratio: ${memberData.spendingRatio || 'N/A'}
      - Income: ${memberData.income || 'N/A'}
      
      CONTEXTUAL DATA (from Context7 MCP):
      ${contextInfo}
      
      HISTORICAL INSIGHTS (from Memory MCP):
      ${memoryInfo}
      
      MCP SERVER STATUS:
      ${serverInfo}
      
      Financial Health Criteria:
      1. Minimum Monthly Deposits: $1,200+ (Required)
      2. NSF Fees: ≤3 fees in last 6 months (Required)
      3. Average Daily Balance: ≥20% of income for 3 out of 4 months (Required)
      4. Spending Efficiency: ≥95% of deposits for 3 out of 4 months (Required)
      
      Please analyze this data and respond with ONLY a valid JSON object in this exact format:
      
      {
        "exists-state": boolean,
        "overallScore": "Excellent|Good|Fair|Poor",
        "scoreValue": 0-100,
        "criteria": {
          "monthlyDeposits": {
            "met": boolean,
            "value": actual_numeric_value,
            "target": 1200,
            "description": "Minimum monthly deposits requirement"
          },
          "nsfFees": {
            "met": boolean,
            "value": actual_numeric_value,
            "target": 3,
            "description": "Maximum NSF fees in 6 months"
          },
          "balanceRatio": {
            "met": boolean,
            "value": actual_decimal_value,
            "target": 0.20,
            "description": "Average daily balance as percentage of income"
          },
          "spendingRatio": {
            "met": boolean,
            "value": actual_decimal_value,
            "target": 0.95,
            "description": "Spending efficiency relative to deposits"
          }
        },
        "recommendations": [
          "Specific actionable tip 1",
          "Specific actionable tip 2",
          "Specific actionable tip 3",
          "Specific actionable tip 4"
        ],
        "encouragementMessage": "Positive, motivational message based on their current financial health level that acknowledges their efforts and provides hope for improvement",
        "detailedExplanations": {
          "monthlyDeposits": {
            "calculation": "Detailed explanation of how the monthly deposits value was calculated from the available data",
            "reasoning": "Analysis of why this value meets or doesn't meet the criteria, including context from historical data",
            "impact": "Explanation of how this metric affects overall financial health and what it indicates about spending patterns",
            "improvement": "Specific steps to improve this metric, with timeline and expected outcomes"
          },
          "nsfFees": {
            "calculation": "Detailed explanation of how NSF fees were counted and analyzed over the 6-month period",
            "reasoning": "Analysis of NSF frequency patterns, triggers, and relationship to account management",
            "impact": "How NSF fees affect financial health, credit, and relationship with financial institution",
            "improvement": "Strategies to prevent NSF fees, including buffer management and spending controls"
          },
          "balanceRatio": {
            "calculation": "How the average daily balance ratio was computed relative to monthly income",
            "reasoning": "Analysis of balance patterns, income utilization, and cash flow management effectiveness",
            "impact": "What this ratio indicates about financial stability, emergency preparedness, and money management skills",
            "improvement": "Methods to improve balance ratios through savings strategies and income optimization"
          },
          "spendingRatio": {
            "calculation": "How spending efficiency was calculated as percentage of deposits and income",
            "reasoning": "Analysis of spending patterns, necessity vs discretionary spending, and financial discipline",
            "impact": "What spending patterns reveal about financial priorities and long-term financial health",
            "improvement": "Techniques to optimize spending efficiency while maintaining quality of life"
          },
          "overallScore": {
            "calculation": "How the overall score was derived from the four criteria, including any weighting factors",
            "reasoning": "Comprehensive analysis of how all metrics work together to indicate financial health",
            "impact": "What this score means for long-term financial stability and creditworthiness",
            "improvement": "Prioritized roadmap for improving overall financial health based on current performance"
          }
        }
      }
      
      Guidelines for scoring:
      - Excellent (90-100): All 4 criteria met
      - Good (75-89): 3 criteria met
      - Fair (60-74): 2 criteria met  
      - Poor (0-59): 0-1 criteria met

      IMPORTANT: Consider all available data sources in your analysis. Use contextual and historical insights to provide more nuanced recommendations. Make the recommendations specific and actionable. The encouragement message should be positive and motivating regardless of the score.
    `;
  }

  private formatContextData(contextData: any): string {
    if (!contextData || Object.keys(contextData).length === 0) {
      return 'No contextual data available';
    }

    let formatted = '';
    if (contextData.memberProfile) {
      formatted += `- Member Profile: ${contextData.memberProfile}\n`;
    }
    if (contextData.riskAssessment) {
      formatted += `- Risk Assessment: ${contextData.riskAssessment}\n`;
    }
    if (contextData.behaviorPatterns) {
      formatted += `- Behavior Patterns: ${contextData.behaviorPatterns.join(', ')}\n`;
    }

    return formatted || 'Contextual data structure not recognized';
  }

  private formatMemoryData(memoryData: any): string {
    if (!memoryData || Object.keys(memoryData).length === 0) {
      return 'No historical data available';
    }

    let formatted = '';
    if (memoryData.historicalTrends) {
      formatted += `- Historical Trends: ${memoryData.historicalTrends}\n`;
    }
    if (memoryData.patterns) {
      formatted += `- Patterns: ${memoryData.patterns.join(', ')}\n`;
    }
    if (memoryData.insights) {
      formatted += `- Insights: ${memoryData.insights.join(', ')}\n`;
    }

    return formatted || 'Memory data structure not recognized';
  }

  private formatServerResponses(serverResponses: any, serverErrors: any): string {
    let status = 'MCP Server Status:\n';
    
    if (serverResponses) {
      Object.keys(serverResponses).forEach(server => {
        status += `- ${server}: Connected and responding\n`;
      });
    }

    if (serverErrors && Object.keys(serverErrors).length > 0) {
      Object.entries(serverErrors).forEach(([server, error]) => {
        status += `- ${server}: Error - ${error}\n`;
      });
    }

    return status;
  }

  private parseAIResponse(responseText: string): AnalysisResult {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (this.validateResponseStructure(parsed)) {
          return parsed;
        }
      }
      
      console.warn('AI response structure invalid, using fallback');
      return this.createFallbackResponse();
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.createFallbackResponse();
    }
  }

  private validateResponseStructure(response: any): boolean {
    const requiredFields = ['exists-state', 'overallScore', 'scoreValue', 'criteria', 'recommendations', 'encouragementMessage'];
    const requiredCriteria = ['monthlyDeposits', 'nsfFees', 'balanceRatio', 'spendingRatio'];
    
    for (const field of requiredFields) {
      if (!(field in response)) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }
    
    if (typeof response.criteria !== 'object') return false;
    
    for (const criterion of requiredCriteria) {
      if (!(criterion in response.criteria)) {
        console.warn(`Missing required criterion: ${criterion}`);
        return false;
      }
      
      const criterionData = response.criteria[criterion];
      if (typeof criterionData.met !== 'boolean' || 
          typeof criterionData.value !== 'number' ||
          typeof criterionData.target !== 'number') {
        console.warn(`Invalid criterion structure: ${criterion}`);
        return false;
      }
    }
    
    if (!Array.isArray(response.recommendations) || response.recommendations.length === 0) {
      console.warn('Invalid recommendations structure');
      return false;
    }
    
    // Validate detailed explanations if present (optional field)
    if (response.detailedExplanations) {
      if (typeof response.detailedExplanations !== 'object') {
        console.warn('Invalid detailedExplanations structure');
        return false;
      }
      
      const explanationKeys = [...requiredCriteria, 'overallScore'];
      for (const key of explanationKeys) {
        if (response.detailedExplanations[key]) {
          const explanation = response.detailedExplanations[key];
          const requiredExplanationFields = ['calculation', 'reasoning', 'impact', 'improvement'];
          
          for (const field of requiredExplanationFields) {
            if (!(field in explanation) || typeof explanation[field] !== 'string') {
              console.warn(`Invalid explanation structure for ${key}: missing or invalid ${field}`);
              return false;
            }
          }
        }
      }
    }
    
    return true;
  }

  private createFallbackResponse(): AnalysisResult {
    return {
      "exists-state": true,
      overallScore: "Fair",
      scoreValue: 65,
      criteria: {
        monthlyDeposits: { 
          met: false, 
          value: 800, 
          target: 1200,
          description: "Minimum monthly deposits requirement"
        },
        nsfFees: { 
          met: true, 
          value: 2, 
          target: 3,
          description: "Maximum NSF fees in 6 months"
        },
        balanceRatio: { 
          met: false, 
          value: 0.15, 
          target: 0.20,
          description: "Average daily balance as percentage of income"
        },
        spendingRatio: { 
          met: true, 
          value: 0.96, 
          target: 0.95,
          description: "Spending efficiency relative to deposits"
        }
      },
      recommendations: [
        "Set up automatic transfers to increase monthly deposits to $1,200+",
        "Build an emergency fund to maintain higher daily account balances",
        "Consider additional income sources like freelancing or part-time work",
        "Review and optimize your spending categories to improve efficiency"
      ],
      encouragementMessage: "You're making solid progress on your financial journey! With 2 out of 4 criteria already met, you're well-positioned to achieve excellent financial health with some focused improvements.",
      aiModelInfo: this.strategy ? this.strategy.getModelInfo() : {
        provider: 'fallback',
        model: 'static-data',
        capabilities: { tier: 'fallback', strengths: ['Static analysis'] }
      }
    };
  }

  getModelInfo(): any {
    return this.strategy ? this.strategy.getModelInfo() : null;
  }

  getSupportedProviders(): any {
    return AIStrategyFactory.getSupportedProviders();
  }
}

export default AIService;
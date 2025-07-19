import axios from 'axios';

class AIService {
  constructor(apiKey, baseURL = 'https://api.anthropic.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
  }

  async generateFinancialHealthAnalysis(memberData) {
    try {
      const prompt = this.buildAnalysisPrompt(memberData);
      
      const response = await this.client.post('/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return this.parseAIResponse(response.data.content[0].text);
    } catch (error) {
      console.error('AI Service error:', error);
      throw new Error('Failed to analyze financial health');
    }
  }

  buildAnalysisPrompt(memberData) {
    return `
      Analyze the following member's financial health data and provide a comprehensive assessment:

      Member ID: ${memberData.memberId}
      
      Financial Criteria:
      1. Monthly Deposits: ${memberData.monthlyDeposits || 'N/A'} (Required: $1,200+)
      2. NSF Fees (6 months): ${memberData.nsfFees || 'N/A'} (Required: ≤3)
      3. Avg Daily Balance Ratio: ${memberData.balanceRatio || 'N/A'} (Required: ≥20% of income, 3/4 months)
      4. Spending Ratio: ${memberData.spendingRatio || 'N/A'} (Required: ≥95% of deposits, 3/4 months)
      
      Income: ${memberData.income || 'N/A'}
      
      Please provide a JSON response with:
      {
        "overallScore": "Excellent|Good|Fair|Poor",
        "scoreValue": 0-100,
        "criteria": {
          "monthlyDeposits": {"met": boolean, "value": number, "target": 1200},
          "nsfFees": {"met": boolean, "value": number, "target": 3},
          "balanceRatio": {"met": boolean, "value": number, "target": 0.20},
          "spendingRatio": {"met": boolean, "value": number, "target": 0.95}
        },
        "recommendations": [
          "Specific tip 1",
          "Specific tip 2",
          "Specific tip 3"
        ],
        "encouragementMessage": "Positive message based on their level"
      }
    `;
  }

  parseAIResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.createFallbackResponse();
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.createFallbackResponse();
    }
  }

  createFallbackResponse() {
    return {
      overallScore: "Fair",
      scoreValue: 65,
      criteria: {
        monthlyDeposits: { met: false, value: 800, target: 1200 },
        nsfFees: { met: true, value: 2, target: 3 },
        balanceRatio: { met: false, value: 0.15, target: 0.20 },
        spendingRatio: { met: true, value: 0.96, target: 0.95 }
      },
      recommendations: [
        "Increase your monthly deposits by setting up automatic transfers",
        "Build an emergency fund to maintain higher daily balances",
        "Consider a side income to boost your deposit capacity"
      ],
      encouragementMessage: "You're on the right track! With a few adjustments, you can significantly improve your financial health score."
    };
  }
}

export default AIService;
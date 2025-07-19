class MCPClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.isConnected = false;
  }

  async connect() {
    try {
      const response = await fetch(`${this.serverUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '1.0.0',
          clientInfo: {
            name: 'financial-health-dashboard',
            version: '1.0.0'
          }
        })
      });

      if (response.ok) {
        this.isConnected = true;
        return true;
      }
      throw new Error(`Connection failed: ${response.statusText}`);
    } catch (error) {
      console.error('MCP connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async queryFinancialData(memberId, aiPrompt) {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await fetch(`${this.serverUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          query: aiPrompt,
          criteria: {
            minimumMonthlyDeposits: 1200,
            maxNSFFees: 3,
            avgDailyBalanceRatio: 0.20,
            spendingRatio: 0.95,
            evaluationPeriodMonths: 6
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MCP query error:', error);
      throw error;
    }
  }

  async getMemberFinancialHealth(memberId) {
    const aiPrompt = `
      Analyze the financial health of member ${memberId} based on the following criteria:
      
      1. Minimum Monthly Deposits: $1,200
      2. NSF Fees: No more than 3 in the last 6 months
      3. Average Daily Balance: Must be >= 20% of income (3 out of 4 months)
      4. Spending Ratio: Must be >= 95% of deposits (3 out of 4 months)
      
      Please provide:
      - Current status for each criterion (met/not met)
      - Overall financial health score (Excellent/Good/Fair/Poor)
      - Specific numerical values for each metric
      - Personalized recommendations for improvement
    `;

    return await this.queryFinancialData(memberId, aiPrompt);
  }

  disconnect() {
    this.isConnected = false;
  }
}

export default MCPClient;
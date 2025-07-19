import axios, { AxiosResponse } from 'axios';

interface ConnectRequest {
  version: string;
  clientInfo: {
    name: string;
    version: string;
  };
}

interface ConnectResponse {
  sessionId?: string;
}

interface QueryRequest {
  query: string;
  criteria: {
    minimumMonthlyDeposits: number;
    maxNSFFees: number;
    avgDailyBalanceRatio: number;
    spendingRatio: number;
    evaluationPeriodMonths: number;
  };
  sessionId?: string;
}

interface FinancialData {
  memberId: string;
  monthlyDeposits: number;
  nsfFees: number;
  balanceRatio: number;
  spendingRatio: number;
  income: number;
  lastUpdated: string;
  dataSource: string;
}


class MCPService {
  private serverUrl: string;
  public lastError: string | null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.lastError = null;
  }


  async queryFinancialData(memberId: string, aiPrompt: string): Promise<any> {
    try {
      console.log(`Querying financial data for member: ${memberId}`);
      
      const requestBody: QueryRequest = {
        query: aiPrompt,
        criteria: {
          minimumMonthlyDeposits: 1200,
          maxNSFFees: 3,
          avgDailyBalanceRatio: 0.20,
          spendingRatio: 0.95,
          evaluationPeriodMonths: 6
        }
      };

      const response = await axios.post(this.serverUrl, requestBody, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Query failed with status: ${response.status} - ${response.statusText}`);
      }

      console.log('Successfully retrieved financial data from MCP server');
      return response.data;
    } catch (error: any) {
      console.error(`🔴 MCP Query Error Details for ${this.serverUrl}:`);
      console.error(`   Member ID: ${memberId}`);
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'N/A'}`);
      console.error(`   Error Stack: ${error.stack}`);
      
      if (error.response) {
        console.error(`   HTTP Status: ${error.response.status}`);
        console.error(`   HTTP Status Text: ${error.response.statusText}`);
        console.error(`   Response Headers:`, error.response.headers);
        console.error(`   Response Data:`, error.response.data);
      } else if (error.request) {
        console.error(`   Request Details:`, {
          url: error.request.path || this.serverUrl,
          method: error.request.method || 'POST',
          timeout: error.request.timeout
        });
      }
      
      throw new Error(`Failed to query MCP server: ${error.message}`);
    }
  }

  async getMemberFinancialHealth(memberId: string): Promise<FinancialData> {
    const data = await this.queryFinancialData(memberId, `Get financial data for member ${memberId}`);
    return this.normalizeFinancialData(data, memberId);
  }

  private normalizeFinancialData(rawData: any, memberId: string): FinancialData {
    return {
      memberId,
      monthlyDeposits: rawData.monthlyDeposits || rawData.avgMonthlyDeposits || 0,
      nsfFees: rawData.nsfFees || rawData.nsfCount || 0,
      balanceRatio: rawData.balanceRatio || rawData.avgDailyBalanceRatio || 0,
      spendingRatio: rawData.spendingRatio || rawData.spendingEfficiency || 0,
      income: rawData.income || rawData.monthlyIncome || 0,
      lastUpdated: rawData.lastUpdated || new Date().toISOString(),
      dataSource: 'mcp-server'
    };
  }
}

export default MCPService;
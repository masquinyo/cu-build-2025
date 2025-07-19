import AIService from './aiService';

interface QueryResult {
  results: Record<string, any>;
  errors: Record<string, string>;
}

interface MCPServerConfig {
  aiService: AIService;
  mcpServerUrl: string;
}

class MCPServerManager {
  private aiService: AIService;
  public mcpServerUrl: string;
  private isInitialized: boolean;

  constructor(config: MCPServerConfig) {
    this.aiService = config.aiService;
    this.mcpServerUrl = config.mcpServerUrl;
    this.isInitialized = false;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔄 Initializing MCP Server Manager...');
    console.log(`🔗 MCP Server URL: ${this.mcpServerUrl}`);

    try {
      // Test connection to MCP server
      //await this.testMCPConnection();
      this.isInitialized = true;
      console.log(`✅ MCP Server Manager initialized successfully`);
    } catch (error: any) {
      console.error(`❌ Failed to initialize MCP Server Manager:`);
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Name: ${error.name}`);
      console.error(`   Error Stack:`, error.stack);
      if (error.cause) console.error(`   Error Cause:`, error.cause);
      if (error.code) console.error(`   Error Code: ${error.code}`);
      console.error(`   Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error;
    }
  }



  async queryServer(serverName: string, accountId: string, _prompt?: string): Promise<any> {
    console.log(`📊 Processing query for account ${accountId} from server ${serverName}`);

    // Delegate to queryAllServers for real data processing
    const result = await this.queryAllServers(accountId);
    return result.results.aiService;
  }

  async queryAllServers(accountId: string): Promise<QueryResult> {
    console.log(`📊 Processing account-level financial analysis for account ${accountId} using AI with MCP tools`);

    const errors: Record<string, string> = {};
    let accountData: any = {
      accountId,
      mcpServerUrl: this.mcpServerUrl,
      contextData: {},
      memoryData: {},
      serverResponses: {},
      serverErrors: {}
    };

    try {
      // Let AI service handle the analysis with MCP tools
      console.log(`🤖 Using AI to analyze account ${accountId} with MCP server tools`);
      const analysisResult = await this.aiService.generateFinancialHealthAnalysis(accountData);
      
      console.log(`🔍 [TESTING] AI Analysis Result for account ${accountId}:`);
      console.log(JSON.stringify(analysisResult, null, 2));
      
      return { 
        results: { aiService: analysisResult }, 
        errors 
      };
    } catch (error: any) {
      console.error(`❌ Error in AI analysis for account ${accountId}:`);
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Name: ${error.name}`);
      console.error(`   Error Stack:`, error.stack);
      if (error.cause) console.error(`   Error Cause:`, error.cause);
      if (error.code) console.error(`   Error Code: ${error.code}`);
      console.error(`   Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      const detailedErrorMessage = `${error.message} | Name: ${error.name} | Code: ${error.code || 'N/A'}`;
      errors.aiService = detailedErrorMessage;
      
      // Return a default "not found" response
      const fallbackResult = {
        "exists-state": false,
        overallScore: "N/A",
        scoreValue: 0,
        criteria: {
          monthlyDeposits: { met: false, value: 0, target: 0, description: "Analysis failed" },
          nsfFees: { met: false, value: 0, target: 0, description: "Analysis failed" },
          balanceRatio: { met: false, value: 0, target: 0, description: "Analysis failed" },
          spendingRatio: { met: false, value: 0, target: 0, description: "Analysis failed" }
        },
        recommendations: [],
        encouragementMessage: "",
        aiModelInfo: this.aiService.getModelInfo()
      };
      
      return { 
        results: { aiService: fallbackResult }, 
        errors 
      };
    }
  }



  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down MCP Server Manager...');
    this.isInitialized = false;
    console.log('✅ MCP Server Manager shutdown complete');
  }

}


export default MCPServerManager;
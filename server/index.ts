import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import MCPServerManager from './services/mcpServerManager';
import AIService from './services/aiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '30') * 1000; // Default 30 seconds, configurable via env

const aiService = new AIService({
  provider: process.env.AI_PROVIDER || 'anthropic',
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_SERVICE_URL,
  model: process.env.AI_MODEL,
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000')
});

const mcpManager = new MCPServerManager(aiService);

interface FinancialHealthParams {
  memberId: string;
}

interface HealthResponse {
  status: string;
  mcpServers: any;
  aiConfigured: boolean;
  timestamp: string;
}

interface ConfigResponse {
  mcpServerUrl: string;
  context7Enabled: boolean;
  memoryEnabled: boolean;
  aiConfigured: boolean;
  aiModelInfo: any;
  supportedProviders: any;
}

app.post('/api/financial-health/:memberId', async (req: Request<FinancialHealthParams>, res: Response) => {
  const { memberId } = req.params;
  const cacheKey = `financial-health-${memberId}`;
  
  // Check if request is already in progress
  if (requestCache.has(cacheKey)) {
    console.log(`🔄 Returning cached result for member: ${memberId}`);
    const cachedResult = await requestCache.get(cacheKey);
    return res.json(cachedResult);
  }
  
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  // Create the request promise and cache it
  const requestPromise = processFinancialHealthRequest(memberId, requestId, startTime);
  requestCache.set(cacheKey, requestPromise);
  
  // Set cache expiration
  setTimeout(() => {
    requestCache.delete(cacheKey);
  }, CACHE_TTL);
  
  try {
    const result = await requestPromise;
    res.json(result);
  } catch (error: any) {
    requestCache.delete(cacheKey); // Remove from cache on error
    throw error;
  }
});


async function processFinancialHealthRequest(memberId: string, requestId: string, startTime: number) {
  try {
    console.log(`[${requestId}] 🔍 Financial health analysis initiated for member: ${memberId}`);
    
    if (!memberId) {
      console.log(`[${requestId}] ❌ Request failed: Missing member ID`);
      throw new Error('Member ID is required');
    }

    if (!process.env.AI_API_KEY) {
      console.log(`[${requestId}] ❌ Request failed: AI API key not configured`);
      throw new Error('AI API key not configured');
    }

    console.log(`[${requestId}] 📊 Querying MCP servers for member: ${memberId}`);

    console.log(`[${requestId}] 🤖 Generating AI analysis for member: ${memberId}`);
    const { results, errors } = await mcpManager.queryAllServers(memberId);
    
    // Extract the analysis result from the aiService response
    const analysisResult = results.aiService;

    analysisResult.mcpServerStatus = {
      servers: Object.keys(results),
      errors: errors,
      hasErrors: Object.keys(errors).length > 0,
      allServersConnected: Object.keys(errors).length === 0 && Object.keys(results).length > 0
    };

    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Financial health analysis completed successfully for member: ${memberId} (${processingTime}ms)`);
    console.log(`[${requestId}] 📈 Health score: ${analysisResult.scoreValue}/100 (${analysisResult.overallScore})`);

    return analysisResult;
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] ❌ Financial health analysis failed for member: ${memberId} (${processingTime}ms)`);
    console.log(`[${requestId}] 🔴 Error details: ${error.message}`);
    console.log(`[${requestId}] 🔍 Error stack: ${error.stack}`);
    
    console.log(`[${requestId}] ❌ Financial health analysis failed - no fallback data available`);
    throw error;
  }
}

app.get('/api/health', (req: Request, res: Response) => {
  const healthCheckId = `health_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  console.log(`[${healthCheckId}] 🏥 Health check requested`);
  
  try {
    const healthResponse: HealthResponse = { 
      status: 'healthy',
      mcpServers: { aiService: { status: 'active', modelInfo: aiService.getModelInfo() } },
      aiConfigured: !!process.env.AI_API_KEY,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[${healthCheckId}] ✅ Health check completed - Status: healthy, AI: ${healthResponse.aiConfigured ? 'configured' : 'not configured'}`);
    
    res.json(healthResponse);
  } catch (error: any) {
    console.log(`[${healthCheckId}] ❌ Health check failed: ${error.message}`);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/config', (req: Request, res: Response) => {
  const configId = `config_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  console.log(`[${configId}] ⚙️ Configuration requested`);
  
  try {
    const configResponse: ConfigResponse = {
      mcpServerUrl: process.env.MCP_SERVER_URL || 'https://dev.mcp.riseanalytics.io',
      context7Enabled: process.env.MCP_CONTEXT7_ENABLED === 'true',
      memoryEnabled: process.env.MCP_MEMORY_ENABLED === 'true',
      aiConfigured: !!process.env.AI_API_KEY,
      aiModelInfo: aiService.getModelInfo(),
      supportedProviders: aiService.getSupportedProviders()
    };
    
    console.log(`[${configId}] ✅ Configuration retrieved - AI: ${configResponse.aiConfigured ? 'configured' : 'not configured'}, Context7: ${configResponse.context7Enabled}, Memory: ${configResponse.memoryEnabled}`);
    
    res.json(configResponse);
  } catch (error: any) {
    console.log(`[${configId}] ❌ Configuration retrieval failed: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to retrieve configuration',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Financial Health Dashboard Server running on port ${PORT}`);
  console.log(`🤖 AI Service: ${process.env.AI_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`⏰ Cache TTL: ${CACHE_TTL / 1000} seconds`);
  
  try {
    await mcpManager.initialize();
  } catch (error: any) {
    console.error('❌ Failed to initialize MCP servers:', error.message);
  }
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down server...');
  await mcpManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down server...');
  await mcpManager.shutdown();
  process.exit(0);
});

export default app;
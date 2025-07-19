import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import MCPServerManager from './services/mcpServerManager';
import AIService from './services/aiService';
import ChatbotService from './services/chatbotService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

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

const mcpManager = new MCPServerManager({
  aiService,
  mcpServerUrl: process.env.MCP_SERVER_URL || 'https://dev.mcp.riseanalytics.io'
});

// Initialize Anthropic client for chatbot
const anthropicClient = new Anthropic({
  apiKey: process.env.AI_API_KEY!
});

const chatbotService = new ChatbotService({
  anthropicClient,
  mcpManager,
  model: process.env.AI_MODEL || 'claude-3-sonnet-20240229',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000')
});

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

interface ChatSessionRequest {
  accountNumbers?: string[];
}

interface ChatMessageRequest {
  message: string;
}

// Chat endpoints
app.post('/api/chat/session', async (req: Request<{}, {}, ChatSessionRequest>, res: Response) => {
  try {
    const { accountNumbers = ['16312'] } = req.body; // Default to test account
    const sessionId = await chatbotService.createSession(accountNumbers);
    
    console.log(`✅ Created chat session: ${sessionId} for accounts: ${accountNumbers.join(', ')}`);
    
    res.json({ 
      sessionId,
      accountNumbers,
      message: 'Chat session created successfully. You can now ask questions about your financial health!'
    });
  } catch (error: any) {
    console.error('❌ Failed to create chat session:', error.message);
    res.status(500).json({ 
      error: 'Failed to create chat session',
      details: error.message 
    });
  }
});

app.post('/api/chat/:sessionId/message', async (req: Request<{sessionId: string}, {}, ChatMessageRequest>, res: Response) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log(`💬 Streaming response for session ${sessionId}`);

    const messageStream = chatbotService.streamMessage(sessionId, message);
    
    for await (const chunk of messageStream) {
      res.write(chunk);
    }
    
    res.end();
    console.log(`✅ Completed streaming response for session ${sessionId}`);
    
  } catch (error: any) {
    console.error(`❌ Chat error for session ${sessionId}:`, error.message);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Chat processing failed',
        details: error.message 
      });
    } else {
      res.write(`\n\nI apologize, but I encountered an error: ${error.message}`);
      res.end();
    }
  }
});

app.get('/api/chat/:sessionId', async (req: Request<{sessionId: string}>, res: Response) => {
  const { sessionId } = req.params;
  
  try {
    const session = chatbotService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      sessionId: session.sessionId,
      accountNumbers: session.memberContext.accountNumbers,
      messageCount: session.conversationHistory.filter(msg => msg.role !== 'system').length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error: any) {
    console.error(`❌ Failed to get session ${sessionId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve session',
      details: error.message 
    });
  }
});

app.post('/api/chat/:sessionId/refresh', async (req: Request<{sessionId: string}>, res: Response) => {
  const { sessionId } = req.params;
  
  try {
    await chatbotService.refreshMemberData(sessionId);
    
    res.json({ 
      message: 'Member data refreshed successfully',
      sessionId 
    });
  } catch (error: any) {
    console.error(`❌ Failed to refresh session ${sessionId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to refresh member data',
      details: error.message 
    });
  }
});

app.delete('/api/chat/:sessionId', async (req: Request<{sessionId: string}>, res: Response) => {
  const { sessionId } = req.params;
  
  try {
    const deleted = chatbotService.deleteSession(sessionId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    console.error(`❌ Failed to delete session ${sessionId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to delete session',
      details: error.message 
    });
  }
});

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

app.get('/api/health', (_req: Request, res: Response) => {
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

app.get('/api/config', (_req: Request, res: Response) => {
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

app.get('/api/tools', async (_req: Request, res: Response) => {
  const toolsId = `tools_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  console.log(`[${toolsId}] 🔧 AI tools identification requested`);
  
  try {
    const toolsEndpoint = process.env.AI_TOOLS_ENDPOINT;
    
    if (!toolsEndpoint) {
      console.log(`[${toolsId}] ❌ Tools endpoint not configured`);
      return res.status(500).json({
        error: 'AI tools endpoint not configured',
        timestamp: new Date().toISOString()
      });
    }

    const response = await fetch(toolsEndpoint);
    
    if (!response.ok) {
      throw new Error(`Tools endpoint returned ${response.status}: ${response.statusText}`);
    }
    
    const tools = await response.json();
    
    console.log(`[${toolsId}] ✅ AI tools retrieved successfully from ${toolsEndpoint}`);
    
    res.json({
      tools,
      endpoint: toolsEndpoint,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.log(`[${toolsId}] ❌ Tools retrieval failed: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to retrieve AI tools',
      details: error.message,
      endpoint: process.env.AI_TOOLS_ENDPOINT,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Financial Health Dashboard & Chatbot Server running on port ${PORT}`);
  console.log(`🤖 AI Service: ${process.env.AI_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`💬 Chatbot Service: Enabled with streaming responses`);
  console.log(`⏰ Cache TTL: ${CACHE_TTL / 1000} seconds`);
  
  try {
    await mcpManager.initialize();
  } catch (error: any) {
    console.error('❌ Failed to initialize MCP servers:', error.message);
  }

  // Setup periodic cleanup of old chat sessions
  setInterval(() => {
    chatbotService.cleanupOldSessions();
  }, 60 * 60 * 1000); // Clean up every hour
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
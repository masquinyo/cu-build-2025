import { useState, useEffect, useRef } from 'react';
import ChatbotService from '../services/chatbotService';
import { ChatMetrics, ChatScoreDisplay, ChatRecommendations, TransactionPieChart, UnmetCriteriaCharts } from './ChatMetrics';

const Chatbot = ({ accountId }) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeSession();
  }, [accountId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filterTechnicalContent = (text) => {
    // FIRST: Remove all tool calls and technical operations completely
    text = text.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '');
    text = text.replace(/<tool_result>[\s\S]*?<\/tool_result>/gi, '');
    text = text.replace(/<invoke[^>]*>[\s\S]*?<\/invoke>/gi, '');
    text = text.replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/gi, '');
    
    // Remove any remaining XML-like tags
    text = text.replace(/<select>.*?<\/select>/gi, '');
    text = text.replace(/<tool_use>.*?<\/tool_use>/gi, '');
    
    // Remove all SQL and database content
    text = text.replace(/```(?:sql|javascript|js|python|py|typescript|ts|bash|shell|text)[\s\S]*?```/gi, '');
    text = text.replace(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|SHOW|DESCRIBE|EXPLAIN)\b[\s\S]*?(?:;|\n\n)/gi, '');
    
    // Remove database field patterns and technical identifiers
    text = text.replace(/\b(account_id|member_id|transaction_id|created_at|updated_at|table_name|schema|total_amount|transaction_count)\b[^\n]*/gi, '');
    text = text.replace(/\b(TR_ANALYTICS|Member_Snapshot|Account_Summary|Transaction_Details|Financial_Metrics|information_schema)\b[^\n]*/gi, '');
    
    // Remove technical descriptions and analysis phrases
    text = text.replace(/^.*?(Let me analyze|I'll analyze|analyzing|I've analyzed).*?(account data|data|database|your account).*?dashboard.*$/gmi, '');
    text = text.replace(/^.*?(TestConnection|ExecuteQuery|MCP|tool_call|tool_result|invoke|parameter).*$/gmi, '');
    
    // Remove ALL JSON blocks completely - we'll extract visualizations separately
    text = text.replace(/```json[\s\S]*?```/gi, '');
    
    // Remove technical status messages
    text = text.replace(/\b(Connection successful|Available tables|Schema discovered|Query results?).*?\n/gi, '');
    text = text.replace(/\b(Database connection|Tool response|Executing query).*?\n/gi, '');
    
    // Clean up any remaining technical language
    text = text.replace(/\b(Let me|I'll|I'm going to|Now I'll)\s+(use|execute|run|call|invoke|check|query|discover)\s+(the\s+)?(TestConnection|ExecuteQuery|MCP|database|connection|schema|tables?).*?\n/gi, '');
    
    // Clean up excessive whitespace from removals
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    text = text.replace(/^\s+|\s+$/g, '');
    
    return text;
  };

  const parseRichContent = (content) => {
    // Extract JSON visualizations BEFORE filtering content
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
    const matches = [...content.matchAll(jsonBlockRegex)];
    
    console.log('🔍 Parsing content, found', matches.length, 'JSON blocks');
    
    let richContent = {
      text: '',
      metrics: null,
      score: null,
      recommendations: null,
      transactionChart: null,
      unmetCriteriaCharts: null,
      hasRichContent: false
    };

    // Process JSON blocks for visualizations
    matches.forEach(match => {
      try {
        const jsonData = JSON.parse(match[1]);
        
        // Check if it's raw database data (arrays of objects with db-like fields)
        const isRawDatabaseData = Array.isArray(jsonData) && jsonData.length > 0 && 
                                 (jsonData[0].hasOwnProperty('id') || jsonData[0].hasOwnProperty('account_id') ||
                                  jsonData[0].hasOwnProperty('member_id') || jsonData[0].hasOwnProperty('transaction_id'));
        
        // Check if it contains database field names or technical structure
        const jsonString = JSON.stringify(jsonData);
        const hasDatabaseFields = /\b(account_id|member_id|transaction_id|created_at|updated_at|primary_key)\b/i.test(jsonString);
        
        // Only process JSON that contains our specific visualization data types
        const isVisualizationData = jsonData.criteria || jsonData.scoreValue !== undefined || 
                                   jsonData.recommendations || jsonData.transactionChart || 
                                   jsonData.unmetCriteriaCharts;
        
        if (isRawDatabaseData || hasDatabaseFields) {
          console.log('🗑️ Skipping raw database data JSON block');
          return;
        }
        
        if (!isVisualizationData) {
          console.log('🗑️ Skipping non-visualization JSON block');
          return;
        }
        
        console.log('✅ Processing visualization data:', Object.keys(jsonData));
        
        // Check if it looks like financial health data
        if (jsonData.criteria && typeof jsonData.criteria === 'object') {
          richContent.metrics = jsonData.criteria;
          richContent.hasRichContent = true;
          console.log('📊 Added metrics data');
        }
        
        if (jsonData.scoreValue !== undefined) {
          richContent.score = {
            value: jsonData.scoreValue,
            grade: jsonData.overallScore,
            label: 'Financial Health Score'
          };
          richContent.hasRichContent = true;
        }
        
        if (jsonData.recommendations && Array.isArray(jsonData.recommendations)) {
          richContent.recommendations = jsonData.recommendations;
          richContent.hasRichContent = true;
          console.log('💡 Added recommendations data');
        }

        // Check for transaction chart data
        if (jsonData.transactionChart && typeof jsonData.transactionChart === 'object') {
          richContent.transactionChart = jsonData.transactionChart;
          richContent.hasRichContent = true;
          console.log('🥧 Added transaction chart data');
        }

        // Check for unmet criteria charts
        if (jsonData.unmetCriteriaCharts && typeof jsonData.unmetCriteriaCharts === 'object') {
          richContent.unmetCriteriaCharts = jsonData.unmetCriteriaCharts;
          richContent.hasRichContent = true;
          console.log('📈 Added unmet criteria charts data');
        }
      } catch (e) {
        console.log('Skipped invalid JSON block:', e);
      }
    });

    // Now filter the content to remove ALL technical content and JSON
    richContent.text = filterTechnicalContent(content);
    
    return richContent;
  };

  const renderMessageContent = (message) => {
    if (message.role !== 'assistant') {
      return (
        <div className="message-text">
          {message.content}
          {message.isStreaming && <span className="typing-indicator">▋</span>}
        </div>
      );
    }

    const richContent = parseRichContent(message.content);
    
    if (!richContent.hasRichContent) {
      return (
        <div className="message-text">
          {message.content}
          {message.isStreaming && <span className="typing-indicator">▋</span>}
        </div>
      );
    }

    return (
      <div className="message-text rich-content">
        <div>
          {richContent.text.trim() && (
            <div dangerouslySetInnerHTML={{ 
              __html: richContent.text
                .replace(/\n/g, '<br/>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/🎯 \*\*What This Means For You:\*\*/g, '<div class="insights-section"><h3>🎯 What This Means For You:</h3>')
                .replace(/\*\*Your Next Steps:\*\*/g, '</div><div class="next-steps-section"><h3>Your Next Steps:</h3>')
                .replace(/Welcome to your Financial Health Dashboard! 💰/g, '<div class="dashboard-section"><h2>Welcome to your Financial Health Dashboard! 💰</h2></div>')
                .replace(/What specific area would you like to focus on improving first\?/g, 'What specific area would you like to focus on improving first?</div>')
            }} />
          )}
          
          {richContent.score && (
            <ChatScoreDisplay 
              score={richContent.score.value}
              label={richContent.score.label}
            />
          )}

          {richContent.transactionChart && (
            <TransactionPieChart 
              transactionChart={richContent.transactionChart}
            />
          )}

          {richContent.unmetCriteriaCharts && (
            <UnmetCriteriaCharts 
              unmetCriteriaCharts={richContent.unmetCriteriaCharts}
            />
          )}
          
          {richContent.metrics && (
            <ChatMetrics 
              metrics={richContent.metrics}
              title="Financial Health Criteria"
            />
          )}
          
          {richContent.recommendations && (
            <ChatRecommendations 
              recommendations={richContent.recommendations}
            />
          )}
          
          {message.isStreaming && <span className="typing-indicator">▋</span>}
        </div>
      </div>
    );
  };

  const initializeSession = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      // Handle single account or array of accounts
      let accountNumbers;
      if (Array.isArray(accountId)) {
        accountNumbers = accountId;
      } else if (accountId) {
        accountNumbers = [accountId];
      } else {
        accountNumbers = ['16312']; // Default test account
      }
      
      const response = await ChatbotService.createSession(accountNumbers);
      
      setSessionId(response.sessionId);
      setMessages([{
        role: 'assistant',
        content: `Hello! 👋 I'm your AI Financial Health Assistant!

I'm analyzing your account data now to show you a comprehensive dashboard with your transaction patterns and financial health metrics...

Let me start by gathering your account information and creating visualizations to show your financial behavior and any areas that need attention.`,
        timestamp: new Date()
      }]);
      
      console.log('Chat session initialized:', response.sessionId);
      
      // Automatically trigger dashboard generation
      setTimeout(() => {
        triggerInitialDashboard(response.sessionId);
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      setError('Failed to start chat session. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const triggerInitialDashboard = async (sessionId) => {
    if (!sessionId || isStreaming) return;
    
    console.log('🚀 Triggering initial dashboard generation...');
    setIsStreaming(true);

    // Add placeholder for assistant response (dashboard)
    const assistantMessageIndex = messages.length;
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      let assistantResponse = '';
      
      // Send initial trigger message to generate dashboard
      await ChatbotService.sendMessage(sessionId, "Please show me my financial health dashboard with account behavior charts, transaction breakdown, and analysis of any unmet criteria.", (chunk) => {
        assistantResponse += chunk;
        
        // Update the streaming message
        setMessages(prev => prev.map((msg, index) => 
          index === assistantMessageIndex 
            ? { ...msg, content: assistantResponse }
            : msg
        ));
      });

      // Mark streaming as complete
      setMessages(prev => prev.map((msg, index) => 
        index === assistantMessageIndex 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error('Failed to generate initial dashboard:', error);
      
      // Replace streaming message with error
      setMessages(prev => prev.map((msg, index) => 
        index === assistantMessageIndex 
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error generating your dashboard. Let me try again or you can ask me a specific question about your financial health.',
              isStreaming: false,
              isError: true
            }
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsStreaming(true);
    
    // Add user message immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    // Add placeholder for assistant response
    const assistantMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      let assistantResponse = '';
      
      await ChatbotService.sendMessage(sessionId, userMessage, (chunk) => {
        assistantResponse += chunk;
        
        // Update the streaming message
        setMessages(prev => prev.map((msg, index) => 
          index === assistantMessageIndex 
            ? { ...msg, content: assistantResponse }
            : msg
        ));
      });

      // Mark streaming as complete
      setMessages(prev => prev.map((msg, index) => 
        index === assistantMessageIndex 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Replace streaming message with error
      setMessages(prev => prev.map((msg, index) => 
        index === assistantMessageIndex 
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error processing your message. Please try again.',
              isStreaming: false,
              isError: true
            }
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const refreshData = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      await ChatbotService.refreshSession(sessionId);
      
      // Add system message about refresh
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Financial data has been refreshed with the latest information.',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="chatbot-container">
        <div className="chatbot-loading">
          <div className="loading-spinner"></div>
          <p>Initializing chat session...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionId) {
    return (
      <div className="chatbot-container">
        <div className="chatbot-error">
          <p>❌ {error}</p>
          <button onClick={initializeSession} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <h3>💬 Financial Health Assistant</h3>
          <p>Session: {sessionId?.slice(-8)}</p>
        </div>
        <button 
          onClick={refreshData} 
          className="refresh-button"
          disabled={isLoading}
          title="Refresh financial data"
        >
          {isLoading ? '🔄' : '↻'}
        </button>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              {message.role === 'system' && <div className="system-icon">ℹ️</div>}
              {message.role === 'user' && <div className="user-icon">👤</div>}
              {message.role === 'assistant' && <div className="assistant-icon">🤖</div>}
              {renderMessageContent(message)}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chatbot-error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your financial health, scores, or get personalized advice..."
            disabled={isStreaming || !sessionId}
            rows="2"
          />
          <button 
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isStreaming || !sessionId}
            className="send-button"
          >
            {isStreaming ? '⏳' : '➤'}
          </button>
        </div>
        <div className="input-hints">
          <span>Try asking: "What's my financial health score?" or "How can I improve my NSF fees?"</span>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
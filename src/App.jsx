import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accountId, setAccountId] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);

  // Check for account query parameter on component mount
  useEffect(() => {
    const accountFromQuery = searchParams.get('account');
    if (accountFromQuery) {
      setAccountId(accountFromQuery);
      setShowChatbot(true);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (accountId.trim()) {
      // Update URL with account parameter
      setSearchParams({ account: accountId.trim() });
      setShowChatbot(true);
    }
  };

  const handleReset = () => {
    setShowChatbot(false);
    setAccountId('');
    // Clear URL parameters
    setSearchParams({});
  };


  if (showChatbot) {
    return (
      <div className="app-container">
        <div className="app-header">
          <div className="header-content">
            <h1>🤖 Financial Health AI Assistant</h1>
            <p>Account: {accountId}</p>
          </div>
          <button onClick={handleReset} className="reset-button">
            🔄 New Session
          </button>
        </div>
        <Chatbot accountId={accountId} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="welcome-screen">
        <div className="welcome-header">
          <h1>🤖 Financial Health AI Assistant</h1>
          <p>Your personal AI advisor for financial health analysis and insights</p>
        </div>

        <div className="intro-section">
          <div className="intro-message">
            <h2>👋 Hello! I'm your Financial Health Assistant</h2>
            <p>I provide comprehensive analytics and can help you by:</p>
            <ul>
              <li>🏢 <strong>Financial analysis</strong> - Start with overall performance and metrics</li>
              <li>📊 <strong>Custom visualizations</strong> - Show exactly what you want to see</li>
              <li>👥 <strong>Member insights when needed</strong> - Access Member_Snapshot data as appropriate</li>
              <li>💡 <strong>Personalized advice</strong> - Tailored recommendations for your situation</li>
              <li>📈 <strong>Progress tracking</strong> - Monitor improvements over time</li>
              <li>❓ <strong>Answering your questions</strong> - Ask me anything about your finances</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="member-form">
          <div className="form-group">
            <label htmlFor="accountId">What's your Account ID?</label>
            <input
              type="text"
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Enter your account ID (e.g., 16312)"
              required
            />
            <small>I'll use this to access your financial data securely</small>
          </div>

          <button type="submit" className="start-chat-button">
            💬 Start Conversation
          </button>
        </form>

        <div className="quick-access-tip">
          <small>💡 <strong>Quick Access:</strong> You can also access an account directly via URL: <code>?account=16312</code></small>
        </div>

        <div className="capabilities-grid">
          <div className="capability-card">
            <div className="capability-icon">📊</div>
            <h3>Real-time Analysis</h3>
            <p>I query your live data to provide current insights and trends</p>
          </div>
          <div className="capability-card">
            <div className="capability-icon">🎨</div>
            <h3>Custom Visuals</h3>
            <p>Tell me what you want to see and I'll create the perfect visualization</p>
          </div>
          <div className="capability-card">
            <div className="capability-icon">🎯</div>
            <h3>Personalized Goals</h3>
            <p>Get specific recommendations based on your unique financial situation</p>
          </div>
          <div className="capability-card">
            <div className="capability-icon">💬</div>
            <h3>Natural Conversation</h3>
            <p>Ask questions in plain English - no complex forms or menus</p>
          </div>
        </div>

        <div className="example-questions">
          <h3>🗣️ Try asking me things like:</h3>
          <div className="question-examples">
            <div className="question-example">"Show me my financial health"</div>
            <div className="question-example">"What are the spending patterns?"</div>
            <div className="question-example">"What should I focus on improving?"</div>
            <div className="question-example">"Show me members in this account"</div>
            <div className="question-example">"Create a chart of NSF fees"</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
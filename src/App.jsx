import React, { useState } from 'react';
import FinancialHealthDashboard from './components/FinancialHealthDashboard';
import './App.css';

function App() {
  const [memberId, setMemberId] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (memberId.trim()) {
      setShowDashboard(true);
    }
  };

  const handleReset = () => {
    setShowDashboard(false);
    setMemberId('');
  };

  if (showDashboard) {
    return (
      <div className="container">
        <button onClick={handleReset} className="back-button">
          ← Back to Configuration
        </button>
        <FinancialHealthDashboard memberId={memberId} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="config-form">
        <div className="form-header">
          <h1>🏦 Financial Health Dashboard</h1>
          <p>Analyze member financial health using MCP server and AI insights</p>
        </div>

        <form onSubmit={handleSubmit} className="configuration-form">
          <div className="form-group">
            <label htmlFor="memberId">Member ID</label>
            <input
              type="text"
              id="memberId"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="Enter member ID to analyze"
              required
            />
            <small>Enter the member ID you want to analyze for financial health</small>
          </div>

          <button type="submit" className="analyze-button">
            🚀 Analyze Financial Health
          </button>
        </form>


        <div className="feature-preview">
          <h3>What you'll see:</h3>
          <div className="feature-list">
            <div className="feature-item">
              <span>📊</span>
              <div>
                <strong>Financial Health Score</strong>
                <p>Overall assessment based on 4 key criteria</p>
              </div>
            </div>
            <div className="feature-item">
              <span>💰</span>
              <div>
                <strong>Detailed Criteria Analysis</strong>
                <p>Monthly deposits, NSF fees, balance ratios, and spending efficiency</p>
              </div>
            </div>
            <div className="feature-item">
              <span>💡</span>
              <div>
                <strong>Personalized Tips</strong>
                <p>AI-generated recommendations for improvement</p>
              </div>
            </div>
            <div className="feature-item">
              <span>🎯</span>
              <div>
                <strong>Encouragement Message</strong>
                <p>Positive motivation based on current financial health level</p>
              </div>
            </div>
          </div>
        </div>

        <div className="criteria-info">
          <h3>Financial Health Criteria:</h3>
          <ul>
            <li><strong>Minimum Monthly Deposits:</strong> $1,200+</li>
            <li><strong>NSF Fees:</strong> ≤3 in last 6 months</li>
            <li><strong>Average Daily Balance:</strong> ≥20% of income (3 of 4 months)</li>
            <li><strong>Spending Efficiency:</strong> ≥95% of deposits (3 of 4 months)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
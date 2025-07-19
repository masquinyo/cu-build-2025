import React, { useState, useEffect } from 'react';
import FinancialCriteria from './FinancialCriteria';
import TipsSection from './TipsSection';
import EncouragementMessage from './EncouragementMessage';
import DetailedExplanations from './DetailedExplanations';
import FinancialHealthService from '../services/financialHealthService';

const FinancialHealthDashboard = ({ memberId }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    if (memberId) {
      fetchFinancialHealth();
      checkServerStatus();
    }
  }, [memberId]);

  const checkServerStatus = async () => {
    try {
      const status = await FinancialHealthService.getServerHealth();
      setServerStatus(status);
    } catch (err) {
      console.error('Failed to check server status:', err);
      setServerStatus({ status: 'unhealthy', error: err.message });
    }
  };

  const fetchFinancialHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const analysisResult = await FinancialHealthService.analyzeFinancialHealth(memberId);
      
      // Check if this is a "no data" response
      if (analysisResult.hasData === false || analysisResult.error === "No Financial Health found") {
        setHealthData(analysisResult);
        return;
      }
      
      setHealthData(analysisResult);
    } catch (err) {
      console.error('Failed to fetch financial health:', err);
      setError(err.message);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };

  const getScoreBadge = (overallScore) => {
    const badges = {
      'Excellent': '🏆',
      'Good': '👍',
      'Fair': '📈',
      'Poor': '⚠️'
    };
    return badges[overallScore] || '📊';
  };

  if (loading) {
    return (
      <div className="loading">
        <div>🔄 Analyzing your financial health...</div>
        <p>Connecting to MCP server and processing data</p>
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <div className="error">
        <h3>Unable to load financial health data</h3>
        <p>Error: {error}</p>
        <button onClick={fetchFinancialHealth} className="retry-button">
          Retry Analysis
        </button>
      </div>
    );
  }

  // Handle "no data" case
  if (healthData && (healthData.hasData === false || healthData.error === "No Financial Health found")) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Financial Health Dashboard</h1>
          <p>Member ID: {memberId}</p>
        </header>

        <div className="no-data-container">
          <div className="no-data-message">
            <div className="no-data-icon">📊</div>
            <h2>No Financial Health Data Found</h2>
            <p>We couldn't find any financial data for member <strong>{memberId}</strong>.</p>
            <div className="no-data-details">
              <p>This could happen if:</p>
              <ul>
                <li>The member ID doesn't exist in our system</li>
                <li>No financial transactions have been recorded</li>
                <li>The member account is new or inactive</li>
              </ul>
            </div>
            <button onClick={fetchFinancialHealth} className="retry-button">
              🔄 Try Again
            </button>
          </div>
        </div>

        {healthData?.mcpServerStatus && (
          <div className="server-status">
            <div className="status-section">
              <h4>🔧 System Status</h4>
              <div className="mcp-status">
                <small>
                  MCP Servers: {healthData.mcpServerStatus.servers?.length || 0} connected
                  {healthData.mcpServerStatus.hasErrors && (
                    <span className="error-indicator"> (⚠️ Some servers have errors)</span>
                  )}
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Financial Health Dashboard</h1>
        <p>Member ID: {memberId}</p>
      </header>

      <div className="health-score">
        <div className={`score-circle ${getScoreColor(healthData.scoreValue)}`}>
          <div>
            <div className="score-badge">{getScoreBadge(healthData.overallScore)}</div>
            <div className="score-number">{healthData.scoreValue}</div>
            <div className="score-label">{healthData.overallScore}</div>
          </div>
        </div>
        <h2>Your Financial Health Score</h2>
      </div>

      <FinancialCriteria criteria={healthData.criteria} />
      
      <DetailedExplanations 
        explanations={healthData.detailedExplanations} 
        criteria={healthData.criteria} 
      />
      
      <TipsSection recommendations={healthData.recommendations} />
      
      <EncouragementMessage 
        message={healthData.encouragementMessage} 
        level={healthData.overallScore}
      />

      {error && (
        <div className="error-notice">
          <small>⚠️ Using demo data due to connection issues: {error}</small>
        </div>
      )}

      {(serverStatus || healthData?.mcpServerStatus) && (
        <div className="server-status">
          <div className="status-section">
            <h4>🔧 System Status</h4>
            
            {serverStatus && (
              <div className={`status-indicator ${serverStatus.status}`}>
                <span className="status-dot"></span>
                <small>
                  API Server: {serverStatus.status} | 
                  AI: {serverStatus.aiConfigured ? '✅ Configured' : '❌ Not configured'}
                </small>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialHealthDashboard;
import React, { useState } from 'react';

const DetailedExplanations = ({ explanations, criteria }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('monthlyDeposits');

  if (!explanations) {
    return null;
  }

  const criteriaLabels = {
    monthlyDeposits: 'Monthly Deposits',
    nsfFees: 'NSF Fees',
    balanceRatio: 'Balance Ratio',
    spendingRatio: 'Spending Ratio',
    overallScore: 'Overall Score'
  };

  const criteriaIcons = {
    monthlyDeposits: '💰',
    nsfFees: '⚠️',
    balanceRatio: '📊',
    spendingRatio: '💳',
    overallScore: '🎯'
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const renderExplanationContent = (key, explanation) => {
    return (
      <div className="explanation-content">
        <div className="explanation-section">
          <h5>🧮 Calculation Method</h5>
          <p>{explanation.calculation}</p>
        </div>
        
        <div className="explanation-section">
          <h5>🤔 Analysis & Reasoning</h5>
          <p>{explanation.reasoning}</p>
        </div>
        
        <div className="explanation-section">
          <h5>📈 Impact on Financial Health</h5>
          <p>{explanation.impact}</p>
        </div>
        
        <div className="explanation-section">
          <h5>🚀 Improvement Strategies</h5>
          <p>{explanation.improvement}</p>
        </div>

        {criteria && criteria[key] && (
          <div className="explanation-section current-metrics">
            <h5>📋 Current Metrics</h5>
            <div className="metrics-summary">
              <div className="metric-item">
                <span className="metric-label">Current Value:</span>
                <span className="metric-value">{criteria[key].value}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Target:</span>
                <span className="metric-value">{criteria[key].target}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Status:</span>
                <span className={`metric-status ${criteria[key].met ? 'met' : 'not-met'}`}>
                  {criteria[key].met ? '✅ Met' : '❌ Not Met'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="detailed-explanations">
      <div className="explanation-header" onClick={toggleExpanded}>
        <h3>
          <span className="expand-icon">{isExpanded ? '📖' : '📚'}</span>
          Detailed Analysis & Explanations
        </h3>
        <button className="toggle-button">
          {isExpanded ? '🔼 Hide Details' : '🔽 Show Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="explanation-panel">
          <div className="explanation-tabs">
            {Object.keys(explanations).map(key => (
              <button
                key={key}
                className={`tab-button ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <span className="tab-icon">{criteriaIcons[key]}</span>
                <span className="tab-label">{criteriaLabels[key]}</span>
              </button>
            ))}
          </div>

          <div className="explanation-body">
            <div className="explanation-header-info">
              <h4>
                {criteriaIcons[activeTab]} {criteriaLabels[activeTab]} - Detailed Analysis
              </h4>
              <p className="explanation-subtitle">
                Understanding how this metric affects your financial health
              </p>
            </div>

            {explanations[activeTab] && renderExplanationContent(activeTab, explanations[activeTab])}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedExplanations;
import React from 'react';

const ChatMetrics = ({ metrics, title }) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    return null;
  }

  const renderMetricCard = (key, data) => {
    const getStatusColor = (met) => {
      return met ? '#4CAF50' : '#f44336';
    };

    const getStatusIcon = (met) => {
      return met ? '✅' : '❌';
    };

    const formatValue = (value, key) => {
      if (key === 'monthlyDeposits' || key.includes('deposit') || key.includes('income')) {
        return `$${value?.toLocaleString() || 0}`;
      }
      if (key.includes('ratio') || key.includes('Ratio')) {
        return `${(value * 100)?.toFixed(1) || 0}%`;
      }
      if (key.includes('fees') || key.includes('Fees')) {
        return `${value || 0} fees`;
      }
      return value?.toString() || 'N/A';
    };

    return (
      <div key={key} className="metric-card">
        <div className="metric-header">
          <span className="metric-icon">{getStatusIcon(data.met)}</span>
          <div className="metric-title">
            {data.description || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </div>
        </div>
        <div className="metric-values">
          <div className="metric-current">
            <span className="metric-label">Current:</span>
            <span className="metric-value" style={{ color: getStatusColor(data.met) }}>
              {formatValue(data.value, key)}
            </span>
          </div>
          {data.target && (
            <div className="metric-target">
              <span className="metric-label">Target:</span>
              <span className="metric-value">
                {formatValue(data.target, key)}
              </span>
            </div>
          )}
        </div>
        <div className="metric-status">
          <span className={`status-badge ${data.met ? 'met' : 'not-met'}`}>
            {data.met ? 'MEETS CRITERIA' : 'NEEDS IMPROVEMENT'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-metrics">
      {title && <h4 className="metrics-title">{title}</h4>}
      <div className="metrics-grid">
        {Object.entries(metrics).map(([key, data]) => 
          typeof data === 'object' && data !== null && 'value' in data
            ? renderMetricCard(key, data)
            : null
        )}
      </div>
    </div>
  );
};

const ChatScoreDisplay = ({ score, label }) => {
  if (score === undefined || score === null) return null;

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#8BC34A';
    if (score >= 60) return '#FF9800';
    return '#f44336';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="chat-score-display">
      <div className="score-container">
        <div 
          className="score-circle"
          style={{ borderColor: getScoreColor(score) }}
        >
          <div className="score-number" style={{ color: getScoreColor(score) }}>
            {score}
          </div>
          <div className="score-total">/100</div>
        </div>
        <div className="score-details">
          <div className="score-grade" style={{ color: getScoreColor(score) }}>
            {getScoreGrade(score)}
          </div>
          {label && <div className="score-label">{label}</div>}
        </div>
      </div>
    </div>
  );
};

const ChatRecommendations = ({ recommendations }) => {
  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="chat-recommendations">
      <h4 className="recommendations-title">💡 Recommendations</h4>
      <ul className="recommendations-list">
        {recommendations.map((rec, index) => (
          <li key={index} className="recommendation-item">
            <span className="recommendation-bullet">•</span>
            <span className="recommendation-text">{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TransactionPieChart = ({ transactionChart }) => {
  if (!transactionChart || !transactionChart.data || !Array.isArray(transactionChart.data)) {
    return null;
  }

  const totalAmount = transactionChart.data.reduce((sum, item) => sum + item.amount, 0);
  
  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#f44336', '#9C27B0', '#795548', '#607D8B'];

  return (
    <div className="transaction-pie-chart">
      <h4 className="chart-title">{transactionChart.title || 'Transaction Breakdown'}</h4>
      <div className="pie-chart-container">
        <div className="pie-chart">
          {transactionChart.data.map((item, index) => {
            const percentage = (item.amount / totalAmount) * 100;
            const color = colors[index % colors.length];
            
            return (
              <div
                key={index}
                className="pie-slice"
                style={{
                  '--percentage': `${percentage}%`,
                  '--color': color,
                  '--start-angle': `${transactionChart.data
                    .slice(0, index)
                    .reduce((sum, prev) => sum + (prev.amount / totalAmount) * 360, 0)}deg`
                }}
                title={`${item.category}: $${item.amount.toLocaleString()}`}
              />
            );
          })}
        </div>
        <div className="pie-legend">
          {transactionChart.data.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="legend-label">{item.category}</span>
              <span className="legend-amount">${item.amount.toLocaleString()}</span>
              <span className="legend-count">({item.count} transactions)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UnmetCriteriaCharts = ({ unmetCriteriaCharts }) => {
  if (!unmetCriteriaCharts || Object.keys(unmetCriteriaCharts).length === 0) {
    return null;
  }

  const renderCriteriaChart = (criteriaName, data) => {
    const isUnmet = data.current < data.target || (criteriaName === 'nsfFees' && data.current > data.target);
    
    return (
      <div key={criteriaName} className="criteria-chart">
        <h5 className="criteria-title">
          {criteriaName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          {isUnmet && <span className="unmet-indicator">⚠️ Needs Improvement</span>}
        </h5>
        
        <div className="criteria-progress">
          <div className="progress-bar">
            <div 
              className={`progress-fill ${isUnmet ? 'unmet' : 'met'}`}
              style={{ 
                width: criteriaName === 'nsfFees' 
                  ? `${Math.min((data.target / data.current) * 100, 100)}%`
                  : `${Math.min((data.current / data.target) * 100, 100)}%`
              }}
            />
          </div>
          <div className="progress-labels">
            <span>Current: {
              criteriaName.includes('ratio') || criteriaName.includes('Ratio')
                ? `${(data.current * 100).toFixed(1)}%`
                : criteriaName.includes('deposit') || criteriaName.includes('Deposit')
                ? `$${data.current.toLocaleString()}`
                : data.current
            }</span>
            <span>Target: {
              criteriaName.includes('ratio') || criteriaName.includes('Ratio')
                ? `${(data.target * 100).toFixed(1)}%`
                : criteriaName.includes('deposit') || criteriaName.includes('Deposit')
                ? `$${data.target.toLocaleString()}`
                : data.target
            }</span>
          </div>
        </div>

        {data.trend && data.months && (
          <div className="trend-chart">
            <div className="trend-bars">
              {data.trend.map((value, index) => {
                const maxValue = Math.max(...data.trend, data.target);
                const height = (value / maxValue) * 60;
                
                return (
                  <div key={index} className="trend-bar-container">
                    <div 
                      className="trend-bar"
                      style={{ 
                        height: `${height}px`,
                        backgroundColor: value >= data.target ? '#4CAF50' : '#f44336'
                      }}
                      title={`${data.months[index]}: ${value}`}
                    />
                    <span className="trend-month">{data.months[index]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.fees && data.months && (
          <div className="fees-chart">
            <div className="fees-bars">
              {data.fees.map((value, index) => {
                const maxValue = Math.max(...data.fees, 5);
                const height = (value / maxValue) * 60;
                
                return (
                  <div key={index} className="fees-bar-container">
                    <div 
                      className="fees-bar"
                      style={{ 
                        height: `${height}px`,
                        backgroundColor: value <= data.target ? '#4CAF50' : '#f44336'
                      }}
                      title={`${data.months[index]}: ${value} fees`}
                    />
                    <span className="fees-month">{data.months[index]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="unmet-criteria-charts">
      <h4 className="charts-title">📊 Performance Analysis</h4>
      <div className="criteria-charts-grid">
        {Object.entries(unmetCriteriaCharts).map(([criteriaName, data]) => 
          renderCriteriaChart(criteriaName, data)
        )}
      </div>
    </div>
  );
};

export { ChatMetrics, ChatScoreDisplay, ChatRecommendations, TransactionPieChart, UnmetCriteriaCharts };
export default ChatMetrics;
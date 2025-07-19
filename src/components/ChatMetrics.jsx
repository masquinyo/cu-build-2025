import React from 'react';

const ChatMetrics = ({ metrics, title }) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    return null;
  }

  const evaluateCriteria = (key, data) => {
    // Force specific criteria results as requested:
    // Only balanceRatio should be "Needs Improvement", rest should "Meet Criteria"
    switch (key) {
      case 'balanceRatio':
        return false; // Always show as "Needs Improvement"
      case 'monthlyDeposits':
      case 'nsfFees':
      case 'spendingRatio':
      case 'spendingEfficiency':
      case 'averageBalance':
      case 'depositFrequency':
      case 'overdraftFees':
      case 'minimumBalance':
        return true; // Always show as "Meets Criteria"
      default:
        // For any other criteria, use the provided met value or evaluate
        if (typeof data.met === 'boolean') {
          return data.met;
        }
        
        // Fallback evaluation logic
        if (data.value !== undefined && data.target !== undefined) {
          if (key.includes('fee') || key.includes('Fee')) {
            return data.value <= data.target;
          }
          return data.value >= data.target;
        }
        
        // Default to true (meets criteria) for unknown criteria
        return true;
    }
  };

  const renderMetricCard = (key, data) => {
    // Evaluate if criteria is met
    const criteriaMet = evaluateCriteria(key, data);
    
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

    const getMetricDescription = (key, data) => {
      // Use provided description first, then fall back to our enhanced descriptions
      if (data.description && !data.description.includes(key)) {
        return data.description;
      }
      
      const descriptions = {
        monthlyDeposits: 'Monthly Deposits Required',
        nsfFees: 'NSF Fees (Last 6 Months)',
        balanceRatio: 'Average Daily Balance Ratio',
        spendingRatio: 'Spending Efficiency Ratio',
        spendingEfficiency: 'Spending Efficiency',
        averageBalance: 'Average Account Balance',
        depositFrequency: 'Deposit Frequency',
        overdraftFees: 'Overdraft Fees',
        minimumBalance: 'Minimum Balance Maintained'
      };
      
      return descriptions[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };


    return (
      <div key={key} className="metric-card">
        <div className="metric-header">
          <span className="metric-icon">{getStatusIcon(criteriaMet)}</span>
          <div className="metric-title">
            {getMetricDescription(key, data)}
          </div>
        </div>
        <div className="metric-values">
          <div className="metric-current">
            <span className="metric-label">Current:</span>
            <span className="metric-value" style={{ color: getStatusColor(criteriaMet) }}>
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
          <span className={`status-badge ${criteriaMet ? 'met' : 'not-met'}`}>
            {criteriaMet ? 'MEETS CRITERIA' : 'NEEDS IMPROVEMENT'}
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
  
  const formatCategoryName = (category) => {
    const categoryMappings = {
      'ATM': 'ATM Withdrawals',
      'ONLINE_TRANSFER': 'Online Transfers',
      'BILL_PAY': 'Bill Payments',
      'MERCHANT': 'Merchant Purchases',
      'CHECK_DEP': 'Check Deposits',
      'DIRECT_DEP': 'Direct Deposits',
      'DEBIT_CARD': 'Debit Card Purchases',
      'WIRE_TRANSFER': 'Wire Transfers',
      'OVERDRAFT': 'Overdraft Fees',
      'MAINTENANCE': 'Account Maintenance',
      'INTEREST': 'Interest Earnings'
    };
    
    // If exact match found, use it
    if (categoryMappings[category]) {
      return categoryMappings[category];
    }
    
    // If partial match found, use it
    const upperCategory = category.toUpperCase();
    for (const [key, value] of Object.entries(categoryMappings)) {
      if (upperCategory.includes(key) || key.includes(upperCategory)) {
        return value;
      }
    }
    
    // Otherwise format the original category name
    return category
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="transaction-pie-chart">
      <h4 className="chart-title">{transactionChart.title || 'Transaction Breakdown'}</h4>
      <div className="pie-chart-container">
        <div 
          className="pie-chart"
          style={{ 
            background: (() => {
              let currentAngle = 0;
              const gradientStops = [];
              
              transactionChart.data.forEach((item, index) => {
                const percentage = (item.amount / totalAmount) * 100;
                const angle = (percentage / 100) * 360;
                const color = colors[index % colors.length];
                
                gradientStops.push(`${color} ${currentAngle}deg ${currentAngle + angle}deg`);
                currentAngle += angle;
              });
              
              return `conic-gradient(from 0deg, ${gradientStops.join(', ')})`;
            })()
          }}
        >
        </div>
        <div className="pie-legend">
          {transactionChart.data.map((item, index) => {
            const percentage = ((item.amount / totalAmount) * 100).toFixed(1);
            return (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <div className="legend-details">
                  <span className="legend-label">{formatCategoryName(item.category)}</span>
                  <span className="legend-value">
                    ${item.amount.toLocaleString()} ({percentage}%)
                  </span>
                  <span className="legend-count">({item.count} transactions)</span>
                </div>
              </div>
            );
          })}
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
import React from 'react';

const FinancialCriteria = ({ criteria }) => {
  const criteriaConfig = [
    {
      key: 'monthlyDeposits',
      title: 'Monthly Deposits',
      description: 'Minimum $1,200 monthly deposits required',
      format: (value) => `$${value?.toLocaleString() || 0}`,
      target: '$1,200+'
    },
    {
      key: 'nsfFees',
      title: 'NSF Fees',
      description: 'No more than 3 NSF fees in last 6 months',
      format: (value) => `${value || 0} fees`,
      target: '≤ 3 fees'
    },
    {
      key: 'balanceRatio',
      title: 'Daily Balance Ratio',
      description: 'Average daily balance ≥ 20% of income (3 of 4 months)',
      format: (value) => `${((value || 0) * 100).toFixed(1)}%`,
      target: '≥ 20%'
    },
    {
      key: 'spendingRatio',
      title: 'Spending Efficiency',
      description: 'Spending ≥ 95% of deposits (3 of 4 months)',
      format: (value) => `${((value || 0) * 100).toFixed(1)}%`,
      target: '≥ 95%'
    }
  ];

  const getStatusIcon = (met) => {
    return met ? '✅' : '❌';
  };

  const getStatusText = (met) => {
    return met ? 'Met' : 'Not Met';
  };

  return (
    <div className="criteria-section">
      <h2>Financial Health Criteria</h2>
      <div className="criteria-grid">
        {criteriaConfig.map((config) => {
          const criterionData = criteria?.[config.key] || {};
          const isMet = criterionData.met || false;
          const value = criterionData.value;

          return (
            <div 
              key={config.key} 
              className={`criteria-card ${isMet ? 'met' : 'not-met'}`}
            >
              <div className="criteria-header">
                <h3>{config.title}</h3>
                <span className="status-badge">
                  {getStatusIcon(isMet)} {getStatusText(isMet)}
                </span>
              </div>
              
              <div className="criteria-content">
                <div className="current-value">
                  <strong>Current: {config.format(value)}</strong>
                </div>
                <div className="target-value">
                  Target: {config.target}
                </div>
                <p className="description">{config.description}</p>
              </div>

              <div className="progress-indicator">
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${isMet ? 'success' : 'warning'}`}
                    style={{ 
                      width: isMet ? '100%' : '60%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialCriteria;
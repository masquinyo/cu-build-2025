import React from 'react';

const TipsSection = ({ recommendations }) => {
  const defaultTips = [
    {
      title: "Automate Your Savings",
      description: "Set up automatic transfers to ensure consistent monthly deposits",
      icon: "🏦"
    },
    {
      title: "Build Emergency Buffer",
      description: "Maintain 3-6 months of expenses to improve daily balance ratios",
      icon: "🛡️"
    },
    {
      title: "Monitor NSF Fees",
      description: "Set up account alerts to avoid overdraft and NSF charges",
      icon: "🔔"
    },
    {
      title: "Optimize Spending",
      description: "Review and adjust spending patterns to meet efficiency targets",
      icon: "📊"
    },
    {
      title: "Income Diversification",
      description: "Consider additional income streams to boost deposit capacity",
      icon: "💼"
    },
    {
      title: "Budget Tracking",
      description: "Use budgeting tools to monitor and control your expenses",
      icon: "📱"
    }
  ];

  const generateTipCards = () => {
    if (recommendations && recommendations.length > 0) {
      return recommendations.map((tip, index) => ({
        title: `Recommendation ${index + 1}`,
        description: tip,
        icon: "💡"
      }));
    }
    return defaultTips;
  };

  const tipCards = generateTipCards();

  return (
    <div className="tips-section">
      <h2>💡 Tips for Improving Your Financial Health Score</h2>
      <p>Follow these personalized recommendations to enhance your financial wellness:</p>
      
      <div className="tips-grid">
        {tipCards.map((tip, index) => (
          <div key={index} className="tip-card">
            <div className="tip-icon">{tip.icon}</div>
            <h3>{tip.title}</h3>
            <p>{tip.description}</p>
          </div>
        ))}
      </div>

      <div className="additional-resources">
        <h3>📚 Additional Resources</h3>
        <div className="resource-links">
          <div className="resource-item">
            <span>🎯</span>
            <div>
              <strong>Goal Setting</strong>
              <p>Set specific, measurable financial targets for each criterion</p>
            </div>
          </div>
          <div className="resource-item">
            <span>📈</span>
            <div>
              <strong>Progress Tracking</strong>
              <p>Monitor your improvements monthly to stay on track</p>
            </div>
          </div>
          <div className="resource-item">
            <span>🤝</span>
            <div>
              <strong>Financial Counseling</strong>
              <p>Consider speaking with a financial advisor for personalized guidance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipsSection;
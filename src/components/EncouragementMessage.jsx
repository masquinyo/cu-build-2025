import React from 'react';

const EncouragementMessage = ({ message, level }) => {
  const getLevelConfig = (level) => {
    const configs = {
      'Excellent': {
        icon: '🏆',
        color: 'excellent',
        title: 'Outstanding Financial Health!',
        subtitle: 'You\'re a financial superstar!'
      },
      'Good': {
        icon: '🌟',
        color: 'good',
        title: 'Great Financial Health!',
        subtitle: 'You\'re doing really well!'
      },
      'Fair': {
        icon: '📈',
        color: 'fair',
        title: 'Good Progress!',
        subtitle: 'You\'re on the right path!'
      },
      'Poor': {
        icon: '🚀',
        color: 'poor',
        title: 'Ready for Growth!',
        subtitle: 'Every expert was once a beginner!'
      }
    };
    
    return configs[level] || configs['Fair'];
  };

  const getMotivationalQuote = (level) => {
    const quotes = {
      'Excellent': "Keep up the excellent work! You're setting a great example of financial responsibility.",
      'Good': "You're making smart financial decisions! A few small improvements will take you to the next level.",
      'Fair': "You're building good financial habits! Stay consistent and you'll see great results.",
      'Poor': "Every financial journey starts with a single step! You have the power to improve your situation."
    };
    
    return quotes[level] || quotes['Fair'];
  };

  const config = getLevelConfig(level);
  const motivationalQuote = getMotivationalQuote(level);

  return (
    <div className={`encouragement ${config.color}`}>
      <div className="encouragement-header">
        <div className="level-icon">{config.icon}</div>
        <div>
          <h2>{config.title}</h2>
          <p className="subtitle">{config.subtitle}</p>
        </div>
      </div>
      
      <div className="message-content">
        <p className="main-message">{message}</p>
        <p className="motivational-quote">"{motivationalQuote}"</p>
      </div>

      <div className="achievement-badges">
        <div className="badge-grid">
          <div className="achievement-badge">
            <span>💪</span>
            <small>Financial Warrior</small>
          </div>
          <div className="achievement-badge">
            <span>🎯</span>
            <small>Goal Focused</small>
          </div>
          <div className="achievement-badge">
            <span>📊</span>
            <small>Data Driven</small>
          </div>
          <div className="achievement-badge">
            <span>🌱</span>
            <small>Always Growing</small>
          </div>
        </div>
      </div>

      <div className="next-steps">
        <h3>What's Next?</h3>
        <div className="steps-list">
          <div className="step-item">
            <span className="step-number">1</span>
            <span>Review your criteria results above</span>
          </div>
          <div className="step-item">
            <span className="step-number">2</span>
            <span>Implement the recommended tips</span>
          </div>
          <div className="step-item">
            <span className="step-number">3</span>
            <span>Check back next month to track progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncouragementMessage;
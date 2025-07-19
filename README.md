# Financial Health Dashboard

A full-stack application with React frontend and Node.js backend that connects to an MCP server to analyze member financial health using AI-powered insights.

## Architecture

- **Frontend**: React application (Vite)
- **Backend**: Node.js/Express server
- **MCP Server Integration**: Server-side connection to https://dev.mcp.riseanalytics.io
- **AI Processing**: Server-side Claude API integration for enhanced security

## Features

- **Secure Server-Side Processing**: AI API keys and MCP connections handled server-side
- **MCP Server Integration**: Connects to configurable MCP server URL
- **AI-Powered Analysis**: Uses Claude API for intelligent financial health assessment
- **Comprehensive Criteria Evaluation**:
  - Minimum Monthly Deposits ($1,200)
  - NSF Fees (≤3 in last 6 months)
  - Average Daily Balance (≥20% of income, 3 of 4 months)
  - Spending Efficiency (≥95% of deposits, 3 of 4 months)
- **Personalized Tips**: AI-generated recommendations for improvement
- **Positive Encouragement**: Motivational messages based on financial health level
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Server Status**: Monitor server health and configuration

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Anthropic Claude API key:
   ```
   AI_API_KEY=your_anthropic_api_key_here
   MCP_SERVER_URL=https://dev.mcp.riseanalytics.io
   ```

3. **Start Development (Both Client and Server)**:
   ```bash
   npm run dev
   ```

   Or start them separately:
   ```bash
   # Terminal 1 - Start server
   npm run server
   
   # Terminal 2 - Start client  
   npm run client
   ```

4. **Usage**:
   - Enter a Member ID to analyze
   - Click "Analyze Financial Health"
   - Server handles all MCP and AI processing securely

## Project Structure

```
├── src/                              # React frontend
│   ├── components/
│   │   ├── FinancialHealthDashboard.jsx  # Main dashboard component
│   │   ├── FinancialCriteria.jsx         # Criteria evaluation display
│   │   ├── TipsSection.jsx               # Improvement recommendations
│   │   └── EncouragementMessage.jsx      # Positive motivation component
│   ├── services/
│   │   └── financialHealthService.js     # API client for backend
│   ├── App.jsx                           # Main application component
│   ├── App.css                           # Additional styles
│   ├── main.jsx                          # React entry point
│   └── index.css                         # Global styles
├── server/                           # Node.js backend
│   ├── services/
│   │   ├── mcpService.js                 # MCP server integration
│   │   └── aiService.js                  # AI API integration
│   └── index.js                          # Express server
├── .env                              # Environment configuration
└── package.json                      # Dependencies and scripts
```

## Server Configuration

The server requires environment variables in `.env`:

- **AI_API_KEY**: Anthropic Claude API key for AI analysis
- **MCP_SERVER_URL**: MCP server URL (default: https://dev.mcp.riseanalytics.io)
- **PORT**: Server port (default: 4002)

## Financial Health Scoring

The application evaluates members on four key criteria:

1. **Monthly Deposits**: Must meet minimum $1,200 threshold
2. **NSF Fees**: No more than 3 fees in the last 6 months
3. **Balance Ratio**: Average daily balance ≥ 20% of income (3 out of 4 months)
4. **Spending Ratio**: Spending ≥ 95% of deposits (3 out of 4 months)

## Build for Production

```bash
npm run build
```

## Technologies Used

- React 18
- Vite (build tool)
- Axios (HTTP client)
- Anthropic Claude API
- Model Context Protocol (MCP)

## Note

The application includes fallback demo data for testing when the MCP server is unavailable.
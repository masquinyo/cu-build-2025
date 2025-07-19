import axios from 'axios';

class FinancialHealthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4002/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async analyzeFinancialHealth(memberId) {
    try {
      if (!memberId) {
        throw new Error('Member ID is required');
      }

      console.log(`Requesting financial health analysis for member: ${memberId}`);
      
      const response = await this.client.post(`/financial-health/${memberId}`);
      
      if (response.status !== 200) {
        throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
      }

      const data = response.data;
      
      // Check if this is a "no data" response
      if (data.hasData === false || data.error === "No Financial Health found") {
        console.log('No financial data available for member');
        return data; // Return as-is for "no data" case
      }
      
      // Validate normal response structure
      if (!this.validateResponseStructure(data)) {
        throw new Error('Invalid response structure from server');
      }

      console.log('Successfully received financial health analysis');
      return data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to server. Please make sure the server is running.');
      } else if (error.response) {
        throw new Error(`Server error (${error.response.status}): ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async getServerHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error.message);
      throw new Error('Server health check failed');
    }
  }

  async getServerConfig() {
    try {
      const response = await this.client.get('/config');
      return response.data;
    } catch (error) {
      console.error('Config check failed:', error.message);
      throw new Error('Unable to retrieve server configuration');
    }
  }

  validateResponseStructure(data) {
    const requiredFields = ['overallScore', 'scoreValue', 'criteria', 'recommendations', 'encouragementMessage'];
    const requiredCriteria = ['monthlyDeposits', 'nsfFees', 'balanceRatio', 'spendingRatio'];
    
    // Check main fields
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Check criteria structure
    if (typeof data.criteria !== 'object') {
      console.warn('Invalid criteria structure');
      return false;
    }
    
    for (const criterion of requiredCriteria) {
      if (!(criterion in data.criteria)) {
        console.warn(`Missing required criterion: ${criterion}`);
        return false;
      }
      
      const criterionData = data.criteria[criterion];
      if (typeof criterionData.met !== 'boolean' || 
          typeof criterionData.value !== 'number' ||
          typeof criterionData.target !== 'number') {
        console.warn(`Invalid criterion structure: ${criterion}`);
        return false;
      }
    }
    
    // Check recommendations array
    if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
      console.warn('Invalid recommendations structure');
      return false;
    }
    
    return true;
  }
}

// Export a singleton instance
const financialHealthService = new FinancialHealthService();
export default financialHealthService;
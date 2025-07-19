const axios = require('axios');

async function testFinancialHealthAPI() {
  const memberId = '484877878';
  const apiUrl = `http://localhost:4002/api/financial-health/${memberId}`;
  
  console.log(`🧪 Testing API endpoint: ${apiUrl}`);
  console.log(`📋 Member ID: ${memberId}`);
  console.log('⏱️  Starting test...\n');

  try {
    const startTime = Date.now();
    
    console.log('📤 Making POST request to financial health endpoint...');
    const response = await axios.post(apiUrl, {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Request completed in ${duration}ms`);
    console.log(`📊 Status Code: ${response.status}`);
    console.log(`📋 Response Headers:`, response.headers);
    console.log('\n📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    const data = response.data;
    console.log('\n🔍 Validating response structure...');
    
    if (data.overallScore) {
      console.log(`✅ Overall Score: ${data.overallScore} (${data.scoreValue}/100)`);
    }
    
    if (data.criteria) {
      console.log('✅ Criteria found:');
      Object.entries(data.criteria).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value.met ? '✅' : '❌'} (${value.value}/${value.target})`);
      });
    }
    
    if (data.recommendations && Array.isArray(data.recommendations)) {
      console.log(`✅ Recommendations: ${data.recommendations.length} items`);
    }
    
    if (data.aiModelInfo) {
      console.log(`✅ AI Model: ${data.aiModelInfo.provider} - ${data.aiModelInfo.model}`);
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('🔴 Error details:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Request error:', error.message);
    }
    
    console.error('\nFull error:', error);
  }
}

// Also test health endpoint
async function testHealthAPI() {
  console.log('\n🏥 Testing health endpoint...');
  
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Health check passed');
    console.log('📊 Health data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting API tests for Financial Health Dashboard\n');
  
  await testHealthAPI();
  await testFinancialHealthAPI();
  
  console.log('\n✨ All tests completed!');
}

runAllTests();
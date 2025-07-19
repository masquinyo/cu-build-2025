// Use node-fetch for older Node.js versions
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE_URL = 'http://localhost:4002/api';

async function testChatbot() {
  try {
    console.log('🧪 Testing chatbot functionality...');
    
    // Test server health first
    console.log('1. Testing server health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const health = await healthResponse.json();
    console.log('✅ Server health:', health.status);
    
    // Test session creation
    console.log('2. Creating chat session...');
    const sessionResponse = await fetch(`${API_BASE_URL}/chat/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumbers: ['16312'] })
    });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Session creation failed: ${sessionResponse.status} - ${errorText}`);
    }
    
    const sessionData = await sessionResponse.json();
    console.log('✅ Session created:', sessionData.sessionId);
    
    // Test sending a message
    console.log('3. Testing message sending...');
    const messageResponse = await fetch(`${API_BASE_URL}/chat/${sessionData.sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is my financial health score?' })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Message failed: ${messageResponse.status} - ${errorText}`);
    }
    
    console.log('✅ Message sent, reading response...');
    const responseText = await messageResponse.text();
    console.log('📝 Response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    console.log('🎉 Chatbot test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Wait a bit for server to start, then test
setTimeout(testChatbot, 2000);
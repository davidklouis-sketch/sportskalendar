// Test script to debug football API
const axios = require('axios');

async function testFootballAPI() {
  console.log('🔍 Testing Football API for Bundesliga (league 78)...');
  
  try {
    // Test with debug parameter to see what's happening
    const response = await axios.get('http://localhost:3001/api/calendar?sport=football&leagues=78&debug=1');
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.debug) {
      console.log('🐛 Debug Logs:', response.data.debug);
    }
    
    if (response.data.items) {
      console.log('🎯 Found', response.data.items.length, 'events');
      response.data.items.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.startsAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3001/api/calendar?sport=football&leagues=78');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server not running or error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Football API Test...');
  
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testFootballAPI();
  } else {
    console.log('💡 Start the server first with: docker-compose up');
  }
}

main().catch(console.error);

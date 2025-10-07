#!/usr/bin/env node

// Simple test script to verify backend endpoints
const https = require('https');
const http = require('http');

const testEndpoints = [
  'https://api.sportskalendar.de/api/health',
  'https://api.sportskalendar.de/api/debug/users',
  'https://api.sportskalendar.de/api/user/profile'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Backend-Test/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        error: err.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        error: 'Timeout'
      });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Backend Endpoints...\n');
  
  for (const url of testEndpoints) {
    console.log(`Testing: ${url}`);
    const result = await testEndpoint(url);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}\n`);
    } else {
      console.log(`✅ Status: ${result.status}`);
      console.log(`📄 Response: ${result.data}\n`);
    }
  }
}

runTests().catch(console.error);

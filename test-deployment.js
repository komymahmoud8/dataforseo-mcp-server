#!/usr/bin/env node

/**
 * Simple deployment test script
 * Tests the health endpoint and basic MCP functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const USERNAME = process.env.DATAFORSEO_USERNAME || 'test_user';
const PASSWORD = process.env.DATAFORSEO_PASSWORD || 'test_pass';

console.log('🧪 Testing DataForSEO MCP Server Deployment');
console.log('=' .repeat(50));
console.log(`Base URL: ${BASE_URL}`);

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Service: ${response.data.service}`);
      return true;
    } else {
      console.log(`❌ Health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
    return false;
  }
}

async function testMCPEndpoint() {
  console.log('\n🔧 Testing MCP Endpoint...');
  
  try {
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    
    const response = await makeRequest(`${BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1
      })
    });
    
    if (response.status === 200 && response.data.result) {
      console.log('✅ MCP endpoint accessible');
      console.log(`   Available tools: ${response.data.result.tools?.length || 0}`);
      return true;
    } else if (response.status === 401) {
      console.log('⚠️  MCP endpoint requires authentication (expected)');
      console.log('   Set DATAFORSEO_USERNAME and DATAFORSEO_PASSWORD to test fully');
      return true; // This is expected behavior
    } else {
      console.log(`❌ MCP endpoint failed with status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ MCP endpoint error: ${error.message}`);
    return false;
  }
}

async function testInvalidEndpoint() {
  console.log('\n🚫 Testing Invalid Endpoint...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/invalid-endpoint`);
    
    if (response.status === 404) {
      console.log('✅ Invalid endpoint correctly returns 404');
      return true;
    } else {
      console.log(`❌ Invalid endpoint returned unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Invalid endpoint test error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\nStarting deployment tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'MCP Endpoint', fn: testMCPEndpoint },
    { name: 'Invalid Endpoint', fn: testInvalidEndpoint }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) passed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Deployment is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the deployment configuration.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node test-deployment.js [options]

Options:
  --help, -h          Show this help message
  
Environment Variables:
  TEST_URL            Base URL to test (default: http://localhost:3000)
  DATAFORSEO_USERNAME DataForSEO username for authentication tests
  DATAFORSEO_PASSWORD DataForSEO password for authentication tests

Examples:
  # Test local deployment
  node test-deployment.js
  
  # Test Railway deployment
  TEST_URL=https://your-app.railway.app node test-deployment.js
  
  # Test with credentials
  TEST_URL=https://your-app.railway.app \\
  DATAFORSEO_USERNAME=your_user \\
  DATAFORSEO_PASSWORD=your_pass \\
  node test-deployment.js
`);
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
}); 
#!/usr/bin/env node

/**
 * Production Debugging Script for Web Crawler
 * 
 * This script tests various production URLs to identify deployment issues
 */

const axios = require('axios');

// Common Vercel deployment URLs to test
const POSSIBLE_PRODUCTION_URLS = [
  'https://webcrawler-proj.vercel.app',
  'https://webcrawler.vercel.app', 
  'https://webcrawler-mikeyautorino2.vercel.app',
  'https://webcrawler-mikeyautorino.vercel.app',
  'https://link-analyzer.vercel.app',
  'https://web-crawler.vercel.app'
];

async function testEndpoint(baseUrl, endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${baseUrl}${endpoint}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ProductionDebugger/1.0)'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      data: error.response?.data || null,
      code: error.code
    };
  }
}

async function testProductionDeployment(baseUrl) {
  console.log(`\n🔍 Testing: ${baseUrl}`);
  console.log('='.repeat(60));
  
  // Test health endpoint
  const healthResult = await testEndpoint(baseUrl, '/health');
  console.log('🏥 Health Check:', healthResult.success ? '✅ PASS' : '❌ FAIL');
  if (healthResult.success) {
    console.log('   Status:', healthResult.status);
    console.log('   Response:', JSON.stringify(healthResult.data, null, 2));
  } else {
    console.log('   Error:', healthResult.error);
    console.log('   Status:', healthResult.status);
  }
  
  // Test debug endpoint
  const debugResult = await testEndpoint(baseUrl, '/api/debug');
  console.log('🐛 Debug Endpoint:', debugResult.success ? '✅ PASS' : '❌ FAIL');
  if (debugResult.success) {
    console.log('   Environment:', debugResult.data.environment);
    console.log('   Node Version:', debugResult.data.server?.nodeVersion);
  } else {
    console.log('   Error:', debugResult.error);
  }
  
  // Test analysis endpoint
  const analysisResult = await testEndpoint(baseUrl, '/api/analyze', 'POST', {
    url: 'https://example.com'
  });
  console.log('🔗 Analysis Endpoint:', analysisResult.success ? '✅ PASS' : '❌ FAIL');
  if (analysisResult.success) {
    console.log('   Response:', analysisResult.data.title || 'No title');
  } else {
    console.log('   Error:', analysisResult.error);
    console.log('   Status:', analysisResult.status);
    if (analysisResult.data) {
      console.log('   Server Response:', analysisResult.data);
    }
  }
  
  // Test history endpoint
  const historyResult = await testEndpoint(baseUrl, '/api/analyze');
  console.log('📚 History Endpoint:', historyResult.success ? '✅ PASS' : '❌ FAIL');
  if (historyResult.success) {
    console.log('   History Count:', Array.isArray(historyResult.data) ? historyResult.data.length : 'Invalid response');
  } else {
    console.log('   Error:', historyResult.error);
  }
  
  return {
    baseUrl,
    working: healthResult.success && analysisResult.success,
    results: {
      health: healthResult,
      debug: debugResult,
      analysis: analysisResult,
      history: historyResult
    }
  };
}

async function main() {
  console.log('🚀 Web Crawler Production Debugging Script');
  console.log('Testing common Vercel deployment URLs...\n');
  
  const results = [];
  
  for (const url of POSSIBLE_PRODUCTION_URLS) {
    const result = await testProductionDeployment(url);
    results.push(result);
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(60));
  
  const workingUrls = results.filter(r => r.working);
  const partialUrls = results.filter(r => !r.working && r.results.health.success);
  
  if (workingUrls.length > 0) {
    console.log('✅ Working Production URLs:');
    workingUrls.forEach(r => console.log(`   - ${r.baseUrl}`));
  } else {
    console.log('❌ No fully working production URLs found');
  }
  
  if (partialUrls.length > 0) {
    console.log('\n⚠️  Partially Working URLs (health OK, analysis failing):');
    partialUrls.forEach(r => console.log(`   - ${r.baseUrl}`));
  }
  
  console.log('\n🔧 DEBUGGING RECOMMENDATIONS:');
  
  if (workingUrls.length === 0) {
    console.log('1. No working production deployment found');
    console.log('2. Check Vercel deployment status');
    console.log('3. Verify build and deploy logs');
    console.log('4. Check environment variables in Vercel dashboard');
  } else if (partialUrls.length > 0) {
    console.log('1. Frontend deployment exists but API is failing');
    console.log('2. Check database connection in production');
    console.log('3. Verify environment variables (DATABASE_URL, etc.)');
    console.log('4. Check serverless function logs in Vercel');
  } else {
    console.log('1. All endpoints working! Issue might be frontend-specific');
    console.log('2. Check browser console for JavaScript errors');
    console.log('3. Verify CORS configuration for your domain');
  }
  
  console.log('\n📖 NEXT STEPS:');
  console.log('1. Open browser dev tools and test the working URL');
  console.log('2. Check Network tab for failed requests');
  console.log('3. Look for console errors in browser');
  console.log('4. Verify the React app is using the correct API base URL');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProductionDeployment, testEndpoint };
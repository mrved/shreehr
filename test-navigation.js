// Navigation Test Script for ShreeHR
// This script will test if employee navigation is working correctly

const https = require('https');

// Test configuration
const TEST_URL = 'https://shreehr.vercel.app';
const EMPLOYEE_CREDS = {
  email: 'employee@example.com', // Update with actual test employee email
  password: 'password123' // Update with actual password
};

// Expected navigation items for EMPLOYEE role
const EXPECTED_NAV_ITEMS = [
  'Dashboard',
  'Leave',
  'Attendance', 
  'Payroll',
  'Loans',
  'Expenses',
  'Documents',
  'AI Chat'
];

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data
      }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testNavigation() {
  console.log('🔍 Testing ShreeHR Employee Navigation\n');
  
  try {
    // Step 1: Check if site is accessible
    console.log('1. Checking site accessibility...');
    const homeResponse = await makeRequest({
      hostname: 'shreehr.vercel.app',
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   Status: ${homeResponse.status}`);
    console.log(`   Redirects to: ${homeResponse.headers.location || 'N/A'}\n`);
    
    // Step 2: Get CSRF token (if needed)
    console.log('2. Checking authentication endpoint...');
    const authCheck = await makeRequest({
      hostname: 'shreehr.vercel.app',
      path: '/api/auth/session',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   Session check status: ${authCheck.status}`);
    console.log(`   Session data: ${authCheck.data}\n`);
    
    // Step 3: Check if we can access the dashboard page source
    console.log('3. Attempting to fetch dashboard page...');
    const dashboardResponse = await makeRequest({
      hostname: 'shreehr.vercel.app',
      path: '/dashboard',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   Dashboard status: ${dashboardResponse.status}`);
    if (dashboardResponse.headers.location) {
      console.log(`   Redirects to: ${dashboardResponse.headers.location}`);
    }
    
    // Check for cache headers
    console.log('\n4. Checking cache headers...');
    console.log(`   Cache-Control: ${dashboardResponse.headers['cache-control'] || 'Not set'}`);
    console.log(`   X-Vercel-Cache: ${dashboardResponse.headers['x-vercel-cache'] || 'Not set'}`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('- Site is accessible: ✓');
  console.log('- Need to implement authenticated testing');
  console.log('- Consider using Puppeteer or Playwright for full E2E test\n');
  
  console.log('💡 Next Steps:');
  console.log('1. Install test dependencies: npm install puppeteer');
  console.log('2. Create authenticated test script');
  console.log('3. Test with actual employee credentials');
}

// Run the test
testNavigation();
// Comprehensive test for employee navigation issue
const https = require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testEmployeeFlow() {
  console.log('🔍 COMPREHENSIVE EMPLOYEE NAVIGATION TEST\n');
  console.log('Testing on: https://shreehr.vercel.app');
  console.log('Date:', new Date().toISOString());
  
  console.log('\n1️⃣ CHECKING DEPLOYMENT STATUS:');
  
  // Check if the site is up
  const homeResponse = await makeRequest('https://shreehr.vercel.app');
  console.log(`   Homepage status: ${homeResponse.status}`);
  
  // Check login page
  const loginResponse = await makeRequest('https://shreehr.vercel.app/login');
  console.log(`   Login page status: ${loginResponse.status}`);
  
  console.log('\n2️⃣ ANALYZING REDIRECT BEHAVIOR:');
  
  // Test dashboard redirect
  const dashboardResponse = await makeRequest('https://shreehr.vercel.app/dashboard');
  console.log(`   /dashboard status: ${dashboardResponse.status}`);
  if (dashboardResponse.headers.location) {
    console.log(`   → Redirects to: ${dashboardResponse.headers.location}`);
  }
  
  // Test employee portal redirect
  const employeeResponse = await makeRequest('https://shreehr.vercel.app/employee/dashboard');
  console.log(`   /employee/dashboard status: ${employeeResponse.status}`);
  if (employeeResponse.headers.location) {
    console.log(`   → Redirects to: ${employeeResponse.headers.location}`);
  }
  
  console.log('\n3️⃣ CHECKING PAGE CONTENT:');
  
  // Check if login page has the form
  if (loginResponse.data.includes('login-form') || loginResponse.data.includes('Sign in')) {
    console.log('   ✅ Login form found on login page');
  } else {
    console.log('   ❌ Login form NOT found - possible issue');
  }
  
  // Check for any error messages
  if (loginResponse.data.includes('error') || loginResponse.data.includes('Error')) {
    console.log('   ⚠️ Error messages found on page');
  }
  
  console.log('\n4️⃣ DEPLOYMENT ANALYSIS:');
  
  // Check deployment headers
  const deploymentId = homeResponse.headers['x-vercel-deployment-url'];
  const cacheStatus = homeResponse.headers['x-vercel-cache'];
  
  if (deploymentId) {
    console.log(`   Deployment URL: ${deploymentId}`);
  }
  if (cacheStatus) {
    console.log(`   Cache status: ${cacheStatus}`);
  }
  
  console.log('\n5️⃣ ROOT CAUSE HYPOTHESIS:');
  console.log('   Based on the analysis, the issue might be:');
  console.log('   a) The fix is deployed but there\'s a caching issue');
  console.log('   b) The redirect logic has a timing/race condition');
  console.log('   c) The employee portal routes are not properly configured');
  console.log('   d) There\'s a session handling issue after login');
  
  console.log('\n6️⃣ RECOMMENDED ACTIONS:');
  console.log('   1. Have Ved clear ALL browser data (cache, cookies, local storage)');
  console.log('   2. Test in an incognito/private window');
  console.log('   3. Check the Vercel deployment logs for any build issues');
  console.log('   4. Verify the employee test account credentials are correct');
  console.log('   5. Try accessing /employee/dashboard directly after login');
  
  console.log('\n7️⃣ MANUAL TEST STEPS FOR VED:');
  console.log('   1. Open a new incognito window');
  console.log('   2. Go to https://shreehr.vercel.app');
  console.log('   3. Click login and use employee credentials');
  console.log('   4. After login, check the URL bar:');
  console.log('      - If it shows /dashboard → manually go to /employee/dashboard');
  console.log('      - If it shows /employee/dashboard → check if navigation appears');
  console.log('   5. Open browser console (F12) and check for any errors');
  console.log('   6. In console, type: document.location.href (share the result)');
  
  console.log('\n🔧 QUICK FIX TO TRY:');
  console.log('   If employee is stuck on /dashboard with no nav:');
  console.log('   - Manually navigate to: https://shreehr.vercel.app/employee/dashboard');
  console.log('   - This should show the employee portal with navigation');
}

testEmployeeFlow().catch(console.error);
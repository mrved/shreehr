// Test script to debug employee navigation

async function testEmployeeLogin() {
  const baseUrl = 'https://shreehr.vercel.app';
  
  console.log('🔍 Testing Employee Navigation Issue\n');
  console.log('Base URL:', baseUrl);
  
  // Test URLs
  const urls = [
    '/dashboard',
    '/employee/dashboard',
    '/api/auth/session'
  ];
  
  console.log('\n📡 Checking endpoint accessibility:');
  
  for (const url of urls) {
    try {
      const response = await fetch(baseUrl + url, {
        redirect: 'manual'
      });
      console.log(`${url} - Status: ${response.status}`);
      
      if (response.status === 307 || response.status === 302 || response.status === 303) {
        console.log(`  → Redirects to: ${response.headers.get('location')}`);
      }
    } catch (error) {
      console.log(`${url} - Error: ${error.message}`);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('- /dashboard should redirect employees to /employee/dashboard');
  console.log('- Employee portal should be accessible at /employee/*');
  console.log('- Check if redirects are working properly');
  
  console.log('\n🔧 Debug Steps:');
  console.log('1. Clear browser cache completely');
  console.log('2. Login with employee credentials');
  console.log('3. Check the final URL after login');
  console.log('4. Check browser console for any errors');
  console.log('5. Try directly accessing /employee/dashboard after login');
}

testEmployeeLogin();
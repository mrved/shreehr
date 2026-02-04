// ShreeHR Endpoint Tester v3 - with fixes
import http from 'http';
import https from 'https';
import { URL } from 'url';

const BASE_URL = 'http://localhost:3000';
let sessionCookie = '';
let csrfToken = '';
let actualEmployeeId = null; // Will store real CUID employee ID

// Results tracking
const results = [];

function log(status, endpoint, code, message) {
  const icon = status === 'ok' ? '✅' : '❌';
  const line = `${icon} ${endpoint} - ${code} - ${message}`;
  console.log(line);
  results.push({ status, endpoint, code, message });
}

// Simple HTTP request wrapper
function request(method, urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const headers = {
      'Accept': 'application/json',
      ...options.headers
    };
    
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }
    
    if (options.json) {
      headers['Content-Type'] = 'application/json';
    }
    
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers
    };
    
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      
      // Capture cookies
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        const cookies = setCookie.map(c => c.split(';')[0]).join('; ');
        if (cookies.includes('next-auth') || cookies.includes('authjs')) {
          sessionCookie = cookies;
        } else if (sessionCookie) {
          sessionCookie = sessionCookie + '; ' + cookies;
        } else {
          sessionCookie = cookies;
        }
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(method, endpoint, options = {}) {
  try {
    const res = await request(method, endpoint, options);
    const statusOk = res.status >= 200 && res.status < 300;
    const summary = typeof res.data === 'object' 
      ? JSON.stringify(res.data).slice(0, 200) 
      : String(res.data).slice(0, 200);
    
    if (statusOk) {
      log('ok', `${method} ${endpoint}`, res.status, summary);
    } else {
      log('error', `${method} ${endpoint}`, res.status, summary);
    }
    return res;
  } catch (err) {
    log('error', `${method} ${endpoint}`, 'ERR', err.message);
    return null;
  }
}

async function authenticate() {
  console.log('\n=== AUTHENTICATION ===\n');
  
  // Step 1: Get CSRF token
  const csrfRes = await request('GET', '/api/auth/csrf');
  if (csrfRes.status !== 200 || !csrfRes.data?.csrfToken) {
    log('error', 'GET /api/auth/csrf', csrfRes.status, 'Failed to get CSRF token');
    console.log('CSRF Response:', csrfRes.data);
    return false;
  }
  csrfToken = csrfRes.data.csrfToken;
  log('ok', 'GET /api/auth/csrf', 200, `Got token: ${csrfToken.slice(0, 20)}...`);
  
  // Step 2: Login with credentials
  const loginBody = new URLSearchParams({
    csrfToken,
    email: 'admin@shreehr.local',
    password: 'admin123',
    redirect: 'false',
    callbackUrl: BASE_URL,
    json: 'true'
  }).toString();
  
  const loginRes = await request('POST', '/api/auth/callback/credentials', {
    body: loginBody,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  if (loginRes.status >= 400) {
    log('error', 'POST /api/auth/callback/credentials', loginRes.status, JSON.stringify(loginRes.data));
    return false;
  }
  
  log('ok', 'POST /api/auth/callback/credentials', loginRes.status, 'Login redirect/success');
  
  // Step 3: Get session to verify
  const sessionRes = await request('GET', '/api/auth/session');
  if (!sessionRes.data?.user) {
    log('error', 'GET /api/auth/session', sessionRes.status, 'No user in session');
    console.log('Session:', sessionRes.data);
    return false;
  }
  
  log('ok', 'GET /api/auth/session', 200, `Logged in as: ${sessionRes.data.user.email}, role: ${sessionRes.data.user.role}`);
  console.log('Session user:', JSON.stringify(sessionRes.data.user, null, 2));
  return sessionRes.data.user;
}

async function testEmployees() {
  console.log('\n=== EMPLOYEES ===\n');
  
  // GET all employees - capture real employee ID
  const listRes = await testEndpoint('GET', '/api/employees');
  
  if (listRes?.data?.employees?.length > 0) {
    // Get a real employee ID (CUID format)
    actualEmployeeId = listRes.data.employees[0].id;
    console.log(`  Found employee ID: ${actualEmployeeId}`);
  }
  
  // POST create employee - with correct schema fields
  const newEmployee = {
    employeeCode: 'TEST-' + Date.now(),
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-15',
    gender: 'MALE',
    personalPhone: '9876543210',
    addressLine1: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    dateOfJoining: '2024-01-01',
    departmentId: 'cml7iskdf0000wovt5jlie2t6',
    designationId: 'des1',
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE'
  };
  
  const createRes = await testEndpoint('POST', '/api/employees', {
    json: true,
    body: JSON.stringify(newEmployee),
    headers: { 'Content-Type': 'application/json' }
  });
  
  // GET single employee
  await testEndpoint('GET', '/api/employees/emp1');
}

async function testDocuments() {
  console.log('\n=== DOCUMENTS ===\n');
  
  // GET all documents
  await testEndpoint('GET', '/api/documents');
  
  // POST upload document - use PDF mime type
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  
  // Minimal valid PDF content
  const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n109\n%%EOF';
  
  const parts = [];
  
  // employeeId field
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="employeeId"\r\n\r\n${actualEmployeeId || 'emp1'}`);
  
  // type field - must match DocumentType enum: ID_PROOF, PAN_CARD, AADHAAR_CARD, etc.
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\nID_PROOF`);
  
  // description field
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nTest document upload`);
  
  // file field - using PDF
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test-doc.pdf"\r\nContent-Type: application/pdf\r\n\r\n${pdfContent}`);
  
  // End boundary
  parts.push(`--${boundary}--`);
  
  const body = parts.join('\r\n') + '\r\n';
  
  const uploadRes = await testEndpoint('POST', '/api/documents', {
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    }
  });
  
  // Try to download if we have documents
  const docsRes = await request('GET', '/api/documents');
  if (docsRes.data?.length > 0) {
    await testEndpoint('GET', `/api/documents/${docsRes.data[0].id}/download`);
  } else {
    console.log('  (No documents to download)');
  }
}

async function testLeave() {
  console.log('\n=== LEAVE ===\n');
  
  // GET leave types
  const typesRes = await testEndpoint('GET', '/api/leave-types');
  
  // GET leave requests
  await testEndpoint('GET', '/api/leave-requests');
  
  // POST create leave request - requires session.user.employeeId
  const leaveTypeId = Array.isArray(typesRes?.data) && typesRes.data.length > 0 
    ? typesRes.data[0].id 
    : 'cml7iyelo0000govtc58wup5j';
  
  const leaveRequest = {
    leaveTypeId: leaveTypeId,
    startDate: '2024-03-10',
    endDate: '2024-03-11',
    reason: 'Test leave request from endpoint tester',
    isHalfDay: false
  };
  
  console.log('  Note: POST /api/leave-requests requires user to have employeeId');
  await testEndpoint('POST', '/api/leave-requests', {
    json: true,
    body: JSON.stringify(leaveRequest),
    headers: { 'Content-Type': 'application/json' }
  });
  
  // Test GET /api/leave-balances/{employeeId}
  await testEndpoint('GET', `/api/leave-balances/${actualEmployeeId || 'emp1'}`);
}

async function testAttendance() {
  console.log('\n=== ATTENDANCE ===\n');
  
  // GET attendance - with specific employee filter
  console.log('  Testing with employeeId filter...');
  await testEndpoint('GET', `/api/attendance?employeeId=${actualEmployeeId || 'emp1'}`);
  
  // GET attendance - without filters
  console.log('  Testing without filters (Admin gets all)...');
  const noFilterRes = await request('GET', '/api/attendance');
  if (noFilterRes.status === 200) {
    log('ok', 'GET /api/attendance', noFilterRes.status, JSON.stringify(noFilterRes.data).slice(0, 150));
  } else {
    log('error', 'GET /api/attendance', noFilterRes.status, JSON.stringify(noFilterRes.data).slice(0, 300));
    // Print full error for debugging
    console.log('  Full attendance error:', noFilterRes.data);
  }
  
  // POST check-in - requires session.user.employeeId
  console.log('  Note: POST check-in/check-out requires user to have employeeId');
  await testEndpoint('POST', '/api/attendance/check-in', {
    json: true,
    body: JSON.stringify({ remarks: 'Test check-in' }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  // POST check-out
  await testEndpoint('POST', '/api/attendance/check-out', {
    json: true,
    body: JSON.stringify({ remarks: 'Test check-out' }),
    headers: { 'Content-Type': 'application/json' }
  });
}

async function testPayroll() {
  console.log('\n=== PAYROLL / SALARY STRUCTURES ===\n');
  
  // GET salary structures
  await testEndpoint('GET', '/api/salary-structures');
  
  // POST create salary structure - use actual employee ID
  if (!actualEmployeeId) {
    console.log('  Skipping POST salary-structures (no valid employee ID found)');
  } else {
    // Amounts are in paise (1 rupee = 100 paise)
    // Must follow 50% basic rule
    const salaryStructure = {
      employee_id: actualEmployeeId,
      effective_from: '2024-01-01',
      basic_paise: 5000000,           // Rs.50,000 (50% of gross)
      hra_paise: 2000000,             // Rs.20,000
      special_allowance_paise: 2000000, // Rs.20,000
      lta_paise: 500000,              // Rs.5,000
      medical_paise: 250000,          // Rs.2,500
      conveyance_paise: 250000,       // Rs.2,500
      other_allowances_paise: 0,
      tax_regime: 'NEW'
    };
    
    console.log(`  Creating salary structure for employee: ${actualEmployeeId}`);
    const createRes = await testEndpoint('POST', '/api/salary-structures', {
      json: true,
      body: JSON.stringify(salaryStructure),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (createRes?.status >= 400) {
      console.log('  Full error:', JSON.stringify(createRes.data, null, 2));
    }
  }
  
  // Also test payroll runs
  await testEndpoint('GET', '/api/payroll/runs');
}

async function testOtherEndpoints() {
  console.log('\n=== OTHER ENDPOINTS ===\n');
  
  // Departments
  await testEndpoint('GET', '/api/departments');
  
  // Designations
  await testEndpoint('GET', '/api/designations');
  
  // Dashboard (for ADMIN)
  await testEndpoint('GET', '/api/dashboard/statutory');
  
  // Expenses
  await testEndpoint('GET', '/api/expenses');
  
  // Loans
  await testEndpoint('GET', '/api/loans');
  
  // Profile
  await testEndpoint('GET', '/api/profile/update-requests');
  
  // Policies
  await testEndpoint('GET', '/api/policies');
}

async function main() {
  console.log('ShreeHR Endpoint Tester v3');
  console.log('===========================\n');
  console.log('Base URL:', BASE_URL);
  
  // First check if server is running
  try {
    const healthCheck = await request('GET', '/');
    console.log('Server is running (status:', healthCheck.status, ')\n');
  } catch (err) {
    console.error('❌ Server not reachable:', err.message);
    console.error('Make sure the app is running at', BASE_URL);
    process.exit(1);
  }
  
  // Authenticate
  const user = await authenticate();
  if (!user) {
    console.error('\n❌ Authentication failed. Cannot proceed with tests.');
    process.exit(1);
  }
  
  // Note about employeeId
  if (!user.employeeId) {
    console.log('\n⚠️  Admin user does not have an employeeId. Some employee-specific endpoints will fail.\n');
  }
  
  // Run all tests
  await testEmployees();
  await testDocuments();
  await testLeave();
  await testAttendance();
  await testPayroll();
  await testOtherEndpoints();
  
  // Summary
  console.log('\n=== SUMMARY ===\n');
  const passed = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'error').length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\nFailed endpoints:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`  - ${r.endpoint}: ${r.code} - ${r.message.slice(0, 100)}`);
    });
  }
  
  // Categorize failures
  console.log('\n=== FAILURE ANALYSIS ===\n');
  const expectedFailures = results.filter(r => 
    r.status === 'error' && 
    (r.message.includes('employeeId') || r.message.includes('employee profile') || r.message.includes('Unauthorized'))
  );
  const unexpectedFailures = results.filter(r => 
    r.status === 'error' && 
    !r.message.includes('employeeId') && 
    !r.message.includes('employee profile') &&
    !r.message.includes('Unauthorized')
  );
  
  if (expectedFailures.length > 0) {
    console.log(`⚠️  Expected failures (admin has no employeeId): ${expectedFailures.length}`);
    expectedFailures.forEach(r => console.log(`    - ${r.endpoint}`));
  }
  
  if (unexpectedFailures.length > 0) {
    console.log(`🔴 Unexpected failures (bugs to fix): ${unexpectedFailures.length}`);
    unexpectedFailures.forEach(r => console.log(`    - ${r.endpoint}: ${r.message.slice(0, 80)}`));
  }
}

main().catch(console.error);

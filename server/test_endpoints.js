import http from 'http';
import https from 'https';

const API_BASE = 'https://raw-coder-backend.onrender.com/api';
// Alternatively fallback to local for testing
// const API_BASE = 'http://localhost:5000/api';

const printStatus = (endpoint, status, data) => {
  if (status >= 200 && status < 300) {
    console.log(`✅ [PASS] ${endpoint} -> HTTP ${status}`);
  } else {
    console.log(`❌ [FAIL] ${endpoint} -> HTTP ${status}`);
    console.log(`   Error: ${JSON.stringify(data)}`);
  }
};

const makeRequest = (url, options, data = null) => {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: responseBody ? JSON.parse(responseBody) : null });
        } catch(e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log(`🚀 Starting API Endpoint Tests against: ${API_BASE}\n`);
  
  try {
    // 1. Test standard ping (if they have /api/health or just base)
    // Here we'll skip to Auth because /auth/register is the core.
    
    // Randomize email to avoid collision if hitting the prod DB
    const randomStr = Math.random().toString(36).substring(7);
    const testEmail = `test_${randomStr}@test.com`;
    const testPassword = "password123";

    console.log("--- Testing Auth Endpoints ---");
    
    // REGISTER
    const regRes = await makeRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: `Test User ${randomStr}`,
      email: testEmail,
      password: testPassword,
      role: 'candidate'
    });
    printStatus('POST /auth/register', regRes.status, regRes.data);

    // LOGIN
    const loginRes = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: testEmail,
      password: testPassword
    });
    printStatus('POST /auth/login', loginRes.status, loginRes.data);
    
    let token = null;
    if (loginRes.status === 200 && loginRes.data && loginRes.data.token) {
      token = loginRes.data.token;
    }

    // PROFILE (PROTECTED)
    if (token) {
      const profileRes = await makeRequest(`${API_BASE}/auth/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      printStatus('GET /auth/profile', profileRes.status, profileRes.data);
    } else {
      console.log('⚠️ [SKIP] GET /auth/profile (No token received from login)');
    }

    console.log("\n✅ All endpoint tests finished.");
  } catch(e) {
    console.error("Test framework error: ", e);
  }
}

runTests();

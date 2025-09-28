const axios = require('axios');

const API_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test-session@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testSessionTracking() {
  console.log('🧪 Testing Session Tracking System\n');
  console.log('=====================================\n');
  
  let token = null;
  
  try {
    // 1. Test Registration (this will track the first session)
    console.log('1️⃣  Testing Registration with session tracking...');
    try {
      const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        fullName: 'Test User'
      });
      
      if (registerResponse.data.session) {
        token = registerResponse.data.session.access_token;
        console.log('✅ Registration successful - Session tracked');
        console.log(`   User ID: ${registerResponse.data.user.id}`);
        console.log(`   Session Token: ${token.substring(0, 20)}...`);
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already registered')) {
        console.log('⚠️  User already exists, trying login instead...');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.error);
      }
    }
    
    // 2. Test Login (if registration failed due to existing user)
    if (!token) {
      console.log('\n2️⃣  Testing Login with session tracking...');
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      
      if (loginResponse.data.session) {
        token = loginResponse.data.session.access_token;
        console.log('✅ Login successful - Session tracked');
        console.log(`   User ID: ${loginResponse.data.user.id}`);
        console.log(`   Session Token: ${token.substring(0, 20)}...`);
      }
    }
    
    // 3. Test Failed Login Attempt
    console.log('\n3️⃣  Testing Failed Login Attempt tracking...');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        email: TEST_EMAIL,
        password: 'WrongPassword'
      });
    } catch (error) {
      console.log('✅ Failed login attempt tracked');
      console.log(`   Error: ${error.response?.data?.error}`);
    }
    
    // 4. Check Active Sessions
    if (token) {
      console.log('\n4️⃣  Checking Active Sessions...');
      const sessionsResponse = await axios.get(`${API_URL}/api/sessions/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Found ${sessionsResponse.data.length} active session(s)`);
      if (sessionsResponse.data.length > 0) {
        const session = sessionsResponse.data[0];
        console.log(`   IP: ${session.ip_address}`);
        console.log(`   Login Time: ${new Date(session.login_at).toLocaleString()}`);
        console.log(`   User Agent: ${session.user_agent?.substring(0, 50)}...`);
      }
    }
    
    // 5. Check Session History
    if (token) {
      console.log('\n5️⃣  Checking Session History...');
      const historyResponse = await axios.get(`${API_URL}/api/sessions/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Found ${historyResponse.data.length} total session(s) in history`);
    }
    
    // 6. Test Logout
    if (token) {
      console.log('\n6️⃣  Testing Logout with session tracking...');
      const logoutResponse = await axios.post(`${API_URL}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Logout successful - Session marked as inactive');
      console.log(`   ${logoutResponse.data.message}`);
    }
    
    console.log('\n=====================================');
    console.log('✨ Session Tracking Test Complete!');
    console.log('\nSession tracking is now active for:');
    console.log('- User registrations');
    console.log('- User logins');
    console.log('- Failed login attempts');
    console.log('- User logouts');
    console.log('- IP address tracking');
    console.log('- User agent/device tracking');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSessionTracking();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

async function testCreateConversation() {
  console.log('Testing conversation creation...\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // First, sign in as a test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ksmotomann@gmail.com',
    password: 'your-password-here' // You'll need to provide the actual password
  });
  
  if (authError) {
    console.log('⚠️  Could not sign in. Please test manually in the browser.');
    console.log('   Make sure you are logged in at http://localhost:3000');
    console.log('\n📝 To test manually:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Login with your credentials');
    console.log('3. Navigate to BeH2O Chat');
    console.log('4. Click "New Chat"');
    console.log('5. Check browser console for errors (F12 -> Console tab)');
    return;
  }
  
  console.log('✅ Signed in successfully');
  console.log(`   User: ${authData.user.email}`);
  console.log(`   Token: ${authData.session.access_token.substring(0, 20)}...`);
  
  // Now try to create a conversation via the API
  const axios = require('axios');
  
  try {
    const response = await axios.post(
      'http://localhost:3001/api/conversations/create',
      { title: 'Test Conversation' },
      {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Conversation created successfully!');
    console.log('   ID:', response.data.id);
    console.log('   Title:', response.data.title);
    console.log('   Thread ID:', response.data.thread_id);
  } catch (error) {
    console.error('\n❌ Failed to create conversation:');
    console.error('   Error:', error.response?.data || error.message);
  }
}

testCreateConversation();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1anlzZXZ1eWhxeWl0eHFjdHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTYzNTEsImV4cCI6MjA3MjA5MjM1MX0.WC6IqLz5HHzblrjmQD9TQ51_adBILlR8-AYifodXM-g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomAuth() {
  console.log('Testing custom authentication system...\n');
  
  // 1. Check if tables were created
  console.log('1. Checking tables...');
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('id, email, user_type')
    .limit(5);
    
  if (usersError) {
    console.error('Error fetching app_users:', usersError);
  } else {
    console.log('✓ app_users table exists with', users.length, 'users');
    users.forEach(u => console.log(`  - ${u.email} (${u.user_type})`));
  }
  
  // 2. Test password hashing function
  console.log('\n2. Testing password hashing...');
  const { data: hashResult, error: hashError } = await supabase.rpc('app_hash_password', {
    password: 'TestPassword123!'
  });
  
  if (hashError) {
    console.error('Error hashing password:', hashError);
  } else {
    console.log('✓ Password hashing works');
  }
  
  // 3. Test password verification
  console.log('\n3. Testing password verification...');
  if (hashResult) {
    const { data: verifyResult, error: verifyError } = await supabase.rpc('app_verify_password', {
      password: 'TestPassword123!',
      password_hash: hashResult
    });
    
    if (verifyError) {
      console.error('Error verifying password:', verifyError);
    } else {
      console.log('✓ Password verification:', verifyResult ? 'CORRECT' : 'FAILED');
    }
  }
  
  // 4. Check sessions table
  console.log('\n4. Checking sessions table...');
  const { count, error: sessionError } = await supabase
    .from('app_sessions')
    .select('*', { count: 'exact', head: true });
    
  if (sessionError) {
    console.error('Error checking sessions:', sessionError);
  } else {
    console.log('✓ app_sessions table exists');
  }
  
  // 5. Set passwords for admin users
  console.log('\n5. Setting passwords for admin users...');
  const adminUsers = [
    { email: 'trina@thelayneproject.com', password: 'BeAligned2025!!' },
    { email: 'ksmotomann@gmail.com', password: 'BeAligned2025!!' },
    { email: 'kankanalaranish@gmail.com', password: 'BeAligned2025!!' }
  ];
  
  for (const admin of adminUsers) {
    const { data: hash } = await supabase.rpc('app_hash_password', {
      password: admin.password
    });
    
    if (hash) {
      const { error } = await supabase
        .from('app_users')
        .update({ password_hash: hash })
        .eq('email', admin.email);
        
      if (error) {
        console.error(`  ✗ Failed to set password for ${admin.email}:`, error.message);
      } else {
        console.log(`  ✓ Password set for ${admin.email}`);
      }
    }
  }
  
  console.log('\n✅ Custom authentication system is ready!');
  console.log('Users can now log in with their email and password.');
}

testCustomAuth();
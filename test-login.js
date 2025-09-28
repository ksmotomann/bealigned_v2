const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1anlzZXZ1eWhxeWl0eHFjdHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTYzNTEsImV4cCI6MjA3MjA5MjM1MX0.WC6IqLz5HHzblrjmQD9TQ51_adBILlR8-AYifodXM-g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('Testing login with custom auth...\n');
  
  const email = 'trina@thelayneproject.com';
  const password = 'BeAligned2025!!';
  
  // 1. Get user
  console.log('1. Fetching user...');
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (userError) {
    console.error('Error fetching user:', userError);
    return;
  }
  
  console.log('✓ User found:', user.email, '(' + user.user_type + ')');
  
  // 2. Verify password
  console.log('\n2. Verifying password...');
  const { data: isValid, error: verifyError } = await supabase.rpc('app_verify_password', {
    password: password,
    password_hash: user.password_hash
  });
  
  if (verifyError) {
    console.error('Error verifying password:', verifyError);
    return;
  }
  
  console.log('✓ Password verification:', isValid ? 'SUCCESS' : 'FAILED');
  
  if (isValid) {
    // 3. Create session
    console.log('\n3. Creating session...');
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const { data: session, error: sessionError } = await supabase
      .from('app_sessions')
      .insert({
        user_id: user.id,
        token_hash: Buffer.from(sessionToken).toString('base64'),
        refresh_token_hash: Buffer.from(sessionToken + '_refresh').toString('base64'),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        refresh_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
      
    if (sessionError) {
      console.error('Error creating session:', sessionError);
    } else {
      console.log('✓ Session created successfully');
      console.log('  Session ID:', session.id);
      console.log('  Expires at:', session.expires_at);
    }
    
    console.log('\n✅ Login successful!');
    console.log('The custom authentication system is working.');
  }
}

testLogin();
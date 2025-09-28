const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Use the same client as the frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log('Testing authentication flow...\n');
  
  // Check current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    return;
  }
  
  if (!session) {
    console.log('❌ No active session found');
    console.log('You need to be logged in through the frontend first');
    return;
  }
  
  console.log('✅ Active session found');
  console.log(`User: ${session.user.email}`);
  console.log(`User ID: ${session.user.id}`);
  
  // Try to get profile using the same query as frontend
  console.log('\nTesting profile loading...');
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, user_type, is_active')
    .eq('id', session.user.id)
    .single();
    
  if (profileError) {
    console.error('❌ Profile loading error:', profileError);
    return;
  }
  
  if (!profile) {
    console.log('❌ No profile found');
    return;
  }
  
  console.log('✅ Profile loaded successfully:');
  console.log(`  Email: ${profile.email}`);
  console.log(`  First Name: ${profile.first_name || 'Not set'}`);
  console.log(`  Last Name: ${profile.last_name || 'Not set'}`);
  console.log(`  User Type: ${profile.user_type || 'Not set'}`);
  console.log(`  Is Active: ${profile.is_active !== false}`);
  
  // Test the frontend logic
  const userRole = profile.user_type || 'user';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isExpert = userRole === 'expert' || userRole === 'admin' || userRole === 'super_admin';
  
  console.log('\nFrontend Logic Results:');
  console.log(`  User Role: ${userRole}`);
  console.log(`  Is Admin: ${isAdmin}`);
  console.log(`  Is Super Admin: ${isSuperAdmin}`);
  console.log(`  Is Expert: ${isExpert}`);
  
  if (isAdmin || isExpert) {
    console.log('\n✅ Admin menu should be visible!');
  } else {
    console.log('\n❌ Admin menu should NOT be visible');
  }
  
  console.log('\nTroubleshooting:');
  console.log('1. Try refreshing the browser page');
  console.log('2. Check browser console for any errors');
  console.log('3. Try logging out and back in');
  console.log('4. Clear browser cache and cookies');
}

testAuthFlow();

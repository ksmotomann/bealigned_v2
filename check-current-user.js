const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkCurrentUser() {
  console.log('Checking current user session...\n');
  
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Error getting session:', sessionError);
    return;
  }
  
  if (!session) {
    console.log('❌ No active session found. Please log in first.');
    return;
  }
  
  const user = session.user;
  console.log(`Current user: ${user.email} (ID: ${user.id})`);
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }
  
  if (!profile) {
    console.log('❌ No profile found for this user');
    return;
  }
  
  console.log('\nProfile details:');
  console.log(`  Email: ${profile.email}`);
  console.log(`  User Type: ${profile.user_type || 'not set'}`);
  console.log(`  Is Admin: ${profile.is_admin || false}`);
  console.log(`  Is Super Admin: ${profile.is_super_admin || false}`);
  console.log(`  Is Active: ${profile.is_active !== false}`);
  
  // Check admin status
  const isAdmin = profile.is_admin || profile.user_type === 'admin' || profile.user_type === 'super_admin';
  const isSuperAdmin = profile.is_super_admin || profile.user_type === 'super_admin';
  
  console.log('\nAdmin Status:');
  console.log(`  Is Admin: ${isAdmin}`);
  console.log(`  Is Super Admin: ${isSuperAdmin}`);
  
  if (!isAdmin) {
    console.log('\n❌ This user does not have admin privileges');
    console.log('To make this user an admin, run: node make-admin.js');
  } else {
    console.log('\n✅ This user has admin privileges');
  }
}

checkCurrentUser();

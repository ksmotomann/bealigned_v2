const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugAdminAccess() {
  console.log('Debugging admin access for ksmotomann@gmail.com...\n');
  
  // Get the user by email
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  const targetUser = users.find(u => u.email === 'ksmotomann@gmail.com');
  
  if (!targetUser) {
    console.log('❌ User ksmotomann@gmail.com not found in auth.users');
    return;
  }
  
  console.log(`✅ Found user: ${targetUser.email} (ID: ${targetUser.id})`);
  console.log(`   Email confirmed: ${targetUser.email_confirmed_at ? 'Yes' : 'No'}`);
  console.log(`   Last sign in: ${targetUser.last_sign_in_at}`);
  
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUser.id)
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
  console.log(`  User Type: ${profile.user_type || 'NULL'}`);
  console.log(`  Is Active: ${profile.is_active !== false}`);
  console.log(`  First Name: ${profile.first_name || 'Not set'}`);
  console.log(`  Last Name: ${profile.last_name || 'Not set'}`);
  
  // Check admin status
  const isAdmin = profile.user_type === 'admin' || profile.user_type === 'super_admin';
  const isSuperAdmin = profile.user_type === 'super_admin';
  
  console.log('\nAdmin Status:');
  console.log(`  Is Admin: ${isAdmin}`);
  console.log(`  Is Super Admin: ${isSuperAdmin}`);
  
  if (!isAdmin) {
    console.log('\n❌ This user does not have admin privileges');
    console.log('Current user_type:', profile.user_type);
    return;
  }
  
  console.log('\n✅ User has admin privileges');
  
  // Test the frontend logic
  console.log('\nFrontend Logic Test:');
  console.log('Based on AuthContext.tsx logic:');
  console.log(`  userRole = ${profile.user_type}`);
  console.log(`  isAdmin = userRole === 'admin' || userRole === 'super_admin' = ${isAdmin}`);
  console.log(`  isSuperAdmin = userRole === 'super_admin' = ${isSuperAdmin}`);
  console.log(`  isExpert = userRole === 'expert' || userRole === 'admin' || userRole === 'super_admin' = ${profile.user_type === 'expert' || isAdmin}`);
  
  // Test Navigation component logic
  console.log('\nNavigation Component Test:');
  console.log('Admin menu items should show if:');
  console.log(`  isAdmin || isExpert = ${isAdmin || profile.user_type === 'expert'}`);
  
  if (isAdmin || profile.user_type === 'expert') {
    console.log('✅ Admin menu should be visible');
  } else {
    console.log('❌ Admin menu should NOT be visible');
  }
  
  // Check for any potential issues
  console.log('\nPotential Issues:');
  
  if (!profile.user_type) {
    console.log('❌ user_type is NULL - this will cause issues');
  }
  
  if (profile.is_active === false) {
    console.log('❌ User is inactive - this might affect access');
  }
  
  if (!targetUser.email_confirmed_at) {
    console.log('⚠️  Email not confirmed - might affect some features');
  }
  
  console.log('\nNext Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Log in with ksmotomann@gmail.com');
  console.log('3. Check browser console for any errors');
  console.log('4. Look for admin menu in the navigation dropdown');
}

debugAdminAccess();

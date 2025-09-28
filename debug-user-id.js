const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugUserId() {
  console.log('Debugging user ID issue...\n');
  
  // Get all users from auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  console.log('Auth users:');
  users.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id})`);
  });
  
  // Get all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');
    
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }
  
  console.log('\nProfiles:');
  profiles.forEach(profile => {
    console.log(`  - ${profile.email} (ID: ${profile.id})`);
  });
  
  // Check for mismatches
  console.log('\nChecking for ID mismatches...');
  
  const targetEmail = 'ksmotomann@gmail.com';
  const authUser = users.find(u => u.email === targetEmail);
  const profileUser = profiles.find(p => p.email === targetEmail);
  
  if (authUser && profileUser) {
    console.log(`Auth user ID: ${authUser.id}`);
    console.log(`Profile user ID: ${profileUser.id}`);
    
    if (authUser.id === profileUser.id) {
      console.log('✅ IDs match!');
    } else {
      console.log('❌ IDs do not match! This is the problem.');
      console.log('The frontend is looking for profile with auth user ID, but profile has different ID.');
    }
  } else {
    console.log('❌ User not found in one or both tables');
    console.log(`Auth user found: ${!!authUser}`);
    console.log(`Profile user found: ${!!profileUser}`);
  }
}

debugUserId();

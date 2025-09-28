const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkRLSPolicies() {
  console.log('Checking RLS policies for profiles table...\n');
  
  // Check if RLS is enabled
  const { data: rlsEnabled, error: rlsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'profiles' AND schemaname = 'public';
    `
  });
  
  if (rlsError) {
    console.log('Note: Cannot check RLS status via RPC');
  } else {
    console.log('RLS Status:', rlsEnabled);
  }
  
  // Check policies
  const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'profiles' AND schemaname = 'public';
    `
  });
  
  if (policiesError) {
    console.log('Note: Cannot check policies via RPC');
  } else {
    console.log('Policies:', policies);
  }
  
  // Test direct profile access with service role
  console.log('\nTesting direct profile access...');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
    
  if (profilesError) {
    console.error('Error accessing profiles:', profilesError);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(profile => {
      console.log(`  - ${profile.email}: ${profile.user_type}`);
    });
  }
  
  // Test specific user profile
  console.log('\nTesting specific user profile...');
  
  const { data: specificProfile, error: specificError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'ksmotomann@gmail.com')
    .single();
    
  if (specificError) {
    console.error('Error accessing specific profile:', specificError);
  } else {
    console.log('Specific profile found:', {
      email: specificProfile.email,
      user_type: specificProfile.user_type,
      first_name: specificProfile.first_name,
      last_name: specificProfile.last_name
    });
  }
}

checkRLSPolicies();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkProfiles() {
  console.log('Checking profiles and users...\n');
  
  // Check auth users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  console.log(`Found ${users.length} auth users:`);
  users.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id})`);
  });
  
  // Check profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');
    
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }
  
  console.log(`\nFound ${profiles.length} profiles:`);
  profiles.forEach(profile => {
    console.log(`  - ${profile.email} (ID: ${profile.id}, Admin: ${profile.is_admin})`);
  });
  
  // Check for missing profiles
  console.log('\nChecking for missing profiles...');
  const missingProfiles = users.filter(user => 
    !profiles.find(profile => profile.id === user.id)
  );
  
  if (missingProfiles.length > 0) {
    console.log(`\n⚠️  Found ${missingProfiles.length} users without profiles:`);
    
    for (const user of missingProfiles) {
      console.log(`  Creating profile for ${user.email}...`);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          is_admin: false
        });
        
      if (insertError) {
        console.error(`    Failed: ${insertError.message}`);
      } else {
        console.log(`    ✅ Profile created`);
      }
    }
  } else {
    console.log('✅ All users have profiles');
  }
  
  // Check conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*');
    
  console.log(`\n📊 Conversations: ${conversations?.length || 0}`);
}

checkProfiles();
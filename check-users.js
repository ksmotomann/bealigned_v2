const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://qujysevuyhqyitxqctxg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('Please add it to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  console.log('🔍 Checking Supabase users...\n');

  try {
    // Check auth.users table (requires service role key)
    console.log('📋 AUTH USERS TABLE:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
    } else {
      console.log(`Found ${authUsers.users.length} users in auth.users:`);
      authUsers.users.forEach((user, index) => {
        const metadata = user.user_metadata || {};
        console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`     Name: ${metadata.first_name || 'N/A'} ${metadata.last_name || 'N/A'}`);
        console.log(`     Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`     Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}`);
        console.log('');
      });
    }

    // Check profiles table
    console.log('\n📋 PROFILES TABLE:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`Found ${profiles.length} users in profiles table:`);
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.email} (${profile.first_name} ${profile.last_name})`);
        console.log(`     ID: ${profile.id}`);
        console.log(`     Admin: ${profile.is_admin}, Super Admin: ${profile.is_super_admin}`);
        console.log(`     Created: ${new Date(profile.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }

    // Look for specific users
    console.log('\n🔍 SEARCHING FOR TRINA AND ANISH:');
    
    // Search auth users
    const trinaAuthUser = authUsers?.users?.find(u => 
      u.email?.toLowerCase().includes('trina') || 
      u.user_metadata?.first_name?.toLowerCase().includes('trina')
    );
    
    const anishAuthUser = authUsers?.users?.find(u => 
      u.email?.toLowerCase().includes('anish') || 
      u.user_metadata?.first_name?.toLowerCase().includes('anish')
    );
    
    // Search profiles
    const trinaProfile = profiles?.find(p => 
      p.email?.toLowerCase().includes('trina') || 
      p.first_name?.toLowerCase().includes('trina')
    );
    
    const anishProfile = profiles?.find(p => 
      p.email?.toLowerCase().includes('anish') || 
      p.first_name?.toLowerCase().includes('anish')
    );
    
    console.log('Trina in auth.users:', trinaAuthUser ? `✅ ${trinaAuthUser.email}` : '❌ NOT FOUND');
    console.log('Trina in profiles:', trinaProfile ? `✅ ${trinaProfile.email}` : '❌ NOT FOUND');
    console.log('Anish in auth.users:', anishAuthUser ? `✅ ${anishAuthUser.email}` : '❌ NOT FOUND');
    console.log('Anish in profiles:', anishProfile ? `✅ ${anishProfile.email}` : '❌ NOT FOUND');

    // Check for users in auth but not in profiles
    console.log('\n⚠️  USERS IN AUTH BUT MISSING PROFILES:');
    if (authUsers?.users) {
      const authUserIds = new Set(authUsers.users.map(u => u.id));
      const profileUserIds = new Set(profiles?.map(p => p.id) || []);
      
      const missingProfiles = authUsers.users.filter(u => !profileUserIds.has(u.id));
      
      if (missingProfiles.length > 0) {
        console.log(`Found ${missingProfiles.length} users without profiles:`);
        missingProfiles.forEach(user => {
          const metadata = user.user_metadata || {};
          console.log(`  - ${user.email} (${metadata.first_name || 'N/A'} ${metadata.last_name || 'N/A'})`);
        });
      } else {
        console.log('✅ All auth users have corresponding profiles');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();

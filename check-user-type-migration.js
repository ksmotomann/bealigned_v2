const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkUserTypeMigration() {
  console.log('Checking user_type migration status...\n');
  
  // Check all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
    
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log(`Found ${profiles.length} profiles:\n`);
  
  profiles.forEach(profile => {
    console.log(`Email: ${profile.email}`);
    console.log(`  User Type: ${profile.user_type || 'NULL'}`);
    console.log(`  Is Admin (legacy): ${profile.is_admin || false}`);
    console.log(`  Is Super Admin (legacy): ${profile.is_super_admin || false}`);
    console.log(`  Is Active: ${profile.is_active !== false}`);
    console.log('');
  });
  
  // Check if boolean columns still exist
  console.log('Migration Status:');
  
  const hasUserType = profiles.every(p => p.user_type !== null && p.user_type !== undefined);
  const hasLegacyFlags = profiles.some(p => p.hasOwnProperty('is_admin') || p.hasOwnProperty('is_super_admin'));
  
  console.log(`  ✅ user_type column: ${hasUserType ? 'Present' : 'Missing'}`);
  console.log(`  🔄 Legacy boolean flags: ${hasLegacyFlags ? 'Still present' : 'Removed'}`);
  
  if (hasUserType && !hasLegacyFlags) {
    console.log('\n✅ Migration complete! Using user_type model.');
  } else if (hasUserType && hasLegacyFlags) {
    console.log('\n⚠️  Migration in progress. Both user_type and legacy flags present.');
  } else {
    console.log('\n❌ Migration not complete. user_type missing.');
  }
  
  // Check for any inconsistencies
  const inconsistentProfiles = profiles.filter(p => {
    const legacyAdmin = p.is_admin || p.is_super_admin;
    const newAdmin = p.user_type === 'admin' || p.user_type === 'super_admin';
    return legacyAdmin !== newAdmin;
  });
  
  if (inconsistentProfiles.length > 0) {
    console.log('\n⚠️  Found profiles with inconsistent admin status:');
    inconsistentProfiles.forEach(p => {
      console.log(`  - ${p.email}: legacy=${p.is_admin || p.is_super_admin}, new=${p.user_type}`);
    });
  }
}

checkUserTypeMigration();

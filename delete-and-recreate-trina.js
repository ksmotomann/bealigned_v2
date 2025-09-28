const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1anlzZXZ1eWhxeWl0eHFjdHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxNjM1MSwiZXhwIjoyMDcyMDkyMzUxfQ.ThAAPcCLUdG0nyHMT3fAZDtzNzg-Jmj_DQOlUQyHBJA';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function recreateTrina() {
  console.log('Attempting to delete and recreate Trina\'s account...\n');
  
  // First, delete from profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', '607c6710-3793-4619-8f85-c801d8a4de0a');
    
  if (profileError) {
    console.log('Profile deletion error (may not exist):', profileError.message);
  } else {
    console.log('✓ Profile deleted');
  }
  
  // Try to delete the user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    '607c6710-3793-4619-8f85-c801d8a4de0a'
  );
  
  if (deleteError) {
    console.error('Error deleting user:', deleteError);
    console.log('\nTrying alternate approach...');
  } else {
    console.log('✓ User deleted successfully');
  }
  
  // Create new user
  console.log('\nCreating new user for Trina...');
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'trina@thelayneproject.com',
    password: 'BeAligned2025!!',
    email_confirm: true,
    user_metadata: {
      first_name: 'Trina',
      last_name: '',
      full_name: 'Trina',
      user_type: 'super_admin',
      is_admin: true,
      is_super_admin: true
    }
  });
  
  if (createError) {
    console.error('Error creating user:', createError);
  } else {
    console.log('✓ User created successfully');
    console.log('New user ID:', newUser.user.id);
    
    // Update the profile to ensure super admin status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: 'super_admin',
        is_admin: true,
        is_super_admin: true,
        is_active: true
      })
      .eq('id', newUser.user.id);
      
    if (updateError) {
      console.error('Error updating profile:', updateError);
    } else {
      console.log('✓ Profile updated to super admin');
    }
  }
}

recreateTrina();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function updateProfile(email, firstName, lastName) {
  console.log(`Updating profile for ${email}...`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      first_name: firstName,
      last_name: lastName
    })
    .eq('email', email);
    
  if (error) {
    console.error('Error updating profile:', error);
    return;
  }
  
  console.log(`✅ Profile updated for ${email}`);
  
  // Verify the update
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
    
  if (fetchError) {
    console.error('Error fetching updated profile:', fetchError);
    return;
  }
  
  console.log('Updated profile:', {
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    user_type: profile.user_type
  });
}

// Update Robert Mann's profile
updateProfile('ksmotomann@gmail.com', 'Robert', 'Mann');

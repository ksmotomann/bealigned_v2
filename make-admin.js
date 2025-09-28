const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function makeUserAdmin(email) {
  console.log(`Making user ${email} an admin...`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      user_type: 'super_admin'
    })
    .eq('email', email);
    
  if (error) {
    console.error('Error updating user:', error);
    return;
  }
  
  console.log(`✅ User ${email} is now an admin`);
  
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
  
  console.log('Updated profile:', profile);
}

// Replace with your email
const userEmail = 'ksmotomann@gmail.com'; // Change this to your email

makeUserAdmin(userEmail);

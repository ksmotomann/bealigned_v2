const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const email = 'trina@thelayneproject.com';
  const newPassword = 'BeAligned2025!!';
  
  console.log('Resetting password for', email, '...\n');
  
  // Hash the new password
  const { data: hashedPassword, error: hashError } = await supabase.rpc('app_hash_password', {
    password: newPassword
  });
  
  if (hashError) {
    console.error('Error hashing password:', hashError);
    return;
  }
  
  // Update the user's password
  const { data, error } = await supabase
    .from('app_users')
    .update({ 
      password_hash: hashedPassword,
      updated_at: new Date().toISOString()
    })
    .eq('email', email)
    .select();
    
  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('✓ Password successfully reset for', email);
    console.log('New password: BeAligned2025!!');
    
    // Verify the new password works
    const { data: user } = await supabase
      .from('app_users')
      .select('password_hash')
      .eq('email', email)
      .single();
      
    const { data: isValid } = await supabase.rpc('app_verify_password', {
      password: newPassword,
      password_hash: user.password_hash
    });
    
    console.log('Password verification:', isValid ? '✓ WORKING' : '✗ FAILED');
  }
}

resetPassword();

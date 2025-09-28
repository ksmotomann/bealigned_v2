const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1anlzZXZ1eWhxeWl0eHFjdHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTYzNTEsImV4cCI6MjA3MjA5MjM1MX0.WC6IqLz5HHzblrjmQD9TQ51_adBILlR8-AYifodXM-g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const email = 'ksmotomann@gmail.com';
  const newPassword = '1Lived4Him!';
  
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
    console.log('New password: 1Lived4Him!');
    
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

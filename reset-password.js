const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Service key present:', !!supabaseServiceKey);

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
  try {
    console.log('🔍 Finding user ksmotomann@gmail.com...');
    
    // Get user ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'ksmotomann@gmail.com')
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }
    
    if (!profile) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('✅ Found user:', profile.email, 'ID:', profile.id);
    
    // Reset password directly using admin API
    console.log('🔍 Resetting password...');
    const { data, error } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: '1Lived4Him!' }
    );
    
    if (error) {
      console.error('❌ Password reset failed:', error);
    } else {
      console.log('✅ Password reset successfully!');
      console.log('📧 Email: ksmotomann@gmail.com');
      console.log('🔑 New password: 1Lived4Him!');
      console.log('🎯 You can now login with these credentials');
    }
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

resetPassword();

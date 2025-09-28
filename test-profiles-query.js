const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfilesQuery() {
  console.log('Testing profiles table query...\n');
  
  // First, try to sign in as Trina
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'trina@thelayneproject.com',
    password: 'BeAligned2025!!'
  });
  
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log('✓ Signed in successfully');
  console.log('User ID:', authData.user.id);
  
  // Now try to query the profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, user_type, is_active')
    .eq('id', authData.user.id)
    .single();
    
  if (error) {
    console.error('\n❌ Error querying profiles:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  } else {
    console.log('\n✓ Profile query successful:');
    console.log(data);
  }
  
  await supabase.auth.signOut();
}

testProfilesQuery();

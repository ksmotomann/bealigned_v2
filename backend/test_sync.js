const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncIssues() {
  // Sign in as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'robertkennethmann@gmail.com',
    password: 'Alpha9Tango!'
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  console.log('Signed in successfully');
  const token = authData.session?.access_token;

  // Call sync endpoint
  const response = await fetch('http://localhost:3001/api/github-sync/sync-to-github', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();
  console.log('Sync result:', result);

  // Get sync status
  const statusResponse = await fetch('http://localhost:3001/api/github-sync/sync-status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const status = await statusResponse.json();
  console.log('Sync status:', status);
}

syncIssues().catch(console.error);

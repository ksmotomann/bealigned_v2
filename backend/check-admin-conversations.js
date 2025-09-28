require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConversations() {
  // Get all conversations with user info (admin view)
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at, user_id, profiles!conversations_user_id_fkey(email, first_name, last_name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return;
  }
  
  console.log(`Found ${conversations?.length || 0} conversations:\n`);
  
  conversations?.forEach((conv, i) => {
    console.log(`${i + 1}. ${conv.title || 'Untitled'}`);
    console.log(`   ID: ${conv.id}`);
    console.log(`   User: ${conv.profiles?.email || 'Unknown'}`);
    console.log(`   Created: ${new Date(conv.created_at).toLocaleString()}`);
    console.log('');
  });
}

checkConversations().catch(console.error);
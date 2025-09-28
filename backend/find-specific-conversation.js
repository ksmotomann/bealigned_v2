require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findConversation() {
  // Find conversations from around 12:09 PM on Aug 30
  const startTime = new Date('2025-08-30T12:00:00');
  const endTime = new Date('2025-08-30T12:20:00');
  
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at, messages(id, role, content, created_at)')
    .gte('created_at', startTime.toISOString())
    .lte('created_at', endTime.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${conversations?.length || 0} conversations from that time period:\n`);
  
  conversations?.forEach(conv => {
    console.log(`ID: ${conv.id}`);
    console.log(`Title: ${conv.title}`);
    console.log(`Created: ${new Date(conv.created_at).toLocaleString()}`);
    console.log(`Updated: ${new Date(conv.updated_at).toLocaleString()}`);
    console.log(`Messages: ${conv.messages?.length || 0}`);
    
    if (conv.messages && conv.messages.length > 0) {
      // Show first few messages
      const sortedMessages = conv.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ).slice(0, 3);
      
      sortedMessages.forEach((msg, i) => {
        console.log(`\n  Message ${i + 1} (${msg.role}):`);
        console.log(`  ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}`);
      });
    }
    console.log('\n-------------------\n');
  });
}

findConversation().catch(console.error);
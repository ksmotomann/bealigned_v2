require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function viewConversation() {
  const conversationId = '73364147-85aa-47f3-8101-009bd8bb13bb';
  
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at, messages(id, role, content, created_at)')
    .eq('id', conversationId)
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Conversation: ${conversation.title}`);
  console.log(`ID: ${conversation.id}`);
  console.log(`Created: ${new Date(conversation.created_at).toLocaleString()}`);
  console.log(`\n=== Messages (${conversation.messages?.length || 0}) ===\n`);
  
  if (conversation.messages) {
    const sortedMessages = conversation.messages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    sortedMessages.forEach((msg, i) => {
      console.log(`[${i + 1}] ${msg.role.toUpperCase()} (${new Date(msg.created_at).toLocaleTimeString()}):`);
      console.log(msg.content);
      console.log('\n---\n');
    });
  }
}

viewConversation().catch(console.error);
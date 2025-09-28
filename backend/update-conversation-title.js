require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateTitle() {
  const conversationId = '73364147-85aa-47f3-8101-009bd8bb13bb';
  // Based on the conversation about communication issues with a friend and feeling disrespected
  const newTitle = 'Friend Respect Issues';
  
  const { error } = await supabase
    .from('conversations')
    .update({ title: newTitle })
    .eq('id', conversationId);
  
  if (error) {
    console.error('Error updating title:', error);
  } else {
    console.log(`✓ Updated conversation title to: "${newTitle}"`);
  }
}

updateTitle().catch(console.error);
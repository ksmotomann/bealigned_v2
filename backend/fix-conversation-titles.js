require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateTitle(messages) {
  if (!messages || messages.length === 0) return null;
  
  // Get first user message and assistant response
  const userMessage = messages.find(m => m.role === 'user');
  const assistantMessage = messages.find(m => m.role === 'assistant');
  
  if (!userMessage) return null;
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate a brief, descriptive title (max 4-5 words) that captures the main issue or topic being discussed. Focus on the problem or challenge mentioned. Return only the title, no quotes or punctuation. Examples: "Co-parent Schedule Conflicts", "Work Life Balance", "Teen Communication Issues"'
        },
        {
          role: 'user',
          content: `User: ${userMessage.content.substring(0, 300)}${assistantMessage ? '\nAssistant: ' + assistantMessage.content.substring(0, 300) : ''}`
        }
      ],
      max_tokens: 20,
      temperature: 0.7
    });
    
    return completion.choices[0].message.content?.trim() || null;
  } catch (error) {
    console.error('Failed to generate title:', error);
    return null;
  }
}

async function fixConversationTitles() {
  console.log('Fetching conversations with "New Conversation" title...');
  
  // Get all conversations with "New Conversation" title that have messages
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title, messages(id, role, content, created_at)')
    .eq('title', 'New Conversation')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return;
  }
  
  console.log(`Found ${conversations.length} conversations to process`);
  
  for (const conversation of conversations) {
    if (!conversation.messages || conversation.messages.length === 0) {
      console.log(`Skipping conversation ${conversation.id} - no messages`);
      continue;
    }
    
    // Sort messages by created_at to ensure correct order
    const sortedMessages = conversation.messages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    console.log(`Processing conversation ${conversation.id} with ${sortedMessages.length} messages`);
    
    const newTitle = await generateTitle(sortedMessages);
    
    if (newTitle) {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversation.id);
      
      if (updateError) {
        console.error(`Failed to update conversation ${conversation.id}:`, updateError);
      } else {
        console.log(`✓ Updated conversation ${conversation.id}: "${newTitle}"`);
      }
    } else {
      console.log(`Could not generate title for conversation ${conversation.id}`);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('Done!');
}

fixConversationTitles().catch(console.error);
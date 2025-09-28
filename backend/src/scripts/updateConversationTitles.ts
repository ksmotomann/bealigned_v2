import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateTitle(messages: any[]): Promise<string> {
  // Get first user and assistant messages
  const userMessage = messages.find(m => m.role === 'user');
  const assistantMessage = messages.find(m => m.role === 'assistant');
  
  if (!userMessage) {
    return 'Conversation';
  }

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
    
    return completion.choices[0].message.content?.trim() || userMessage.content.substring(0, 50);
  } catch (error) {
    console.error('Failed to generate title:', error);
    return userMessage.content.substring(0, 50);
  }
}

async function updateConversationTitles() {
  console.log('Fetching conversations with "New Conversation" title...');
  
  // Get all conversations with default title
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title, messages(*)')
    .eq('title', 'New Conversation')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return;
  }

  console.log(`Found ${conversations?.length || 0} conversations to update`);

  if (!conversations || conversations.length === 0) {
    console.log('No conversations need updating');
    return;
  }

  // Update each conversation
  for (const conversation of conversations) {
    if (conversation.messages && conversation.messages.length > 0) {
      console.log(`Processing conversation ${conversation.id}...`);
      
      // Sort messages by created_at
      const sortedMessages = conversation.messages.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Generate new title
      const newTitle = await generateTitle(sortedMessages);
      
      // Update the conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversation.id);
      
      if (updateError) {
        console.error(`Failed to update conversation ${conversation.id}:`, updateError);
      } else {
        console.log(`Updated conversation ${conversation.id}: "${newTitle}"`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('Finished updating conversation titles');
}

// Run the script
updateConversationTitles().catch(console.error);
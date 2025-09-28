import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { openaiChatService } from '../services/openaiChat';
import { createSupabaseClient, supabaseAdmin } from '../services/supabase';
import { emailService } from '../services/email';
// import { RAGRetrieval, RAGSettings } from '../services/ragRetrieval';

const router = Router();

router.use(authenticate);

// Helper function to get RAG settings from AdminTuner settings
async function getRAGSettings(userId: string): Promise<any> {
  const defaultSettings = {
    enabled: false,
    k: 8,
    minScore: 0.30,
    hybridWeight: 0.5,
    maxPerDoc: 3,
    rerankTopN: 50,
    maxTokens: 2000,
    enforceACL: true
  };

  try {
    // Check if user has admin tuner settings stored
    const { data: settings, error } = await supabaseAdmin
      .from('admin_tuner_settings')
      .select('settings')
      .eq('created_by', userId)
      .eq('is_active', true)
      .single();

    if (error || !settings?.settings?.retrieval) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...settings.settings.retrieval
    };
  } catch (error) {
    console.error('Error getting RAG settings:', error);
    return defaultSettings;
  }
}

// Get all conversations for the current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    const { data, error } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('user_id', req.userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create a new conversation
router.post('/create', async (req: AuthRequest, res) => {
  const { title, timezone } = req.body;

  try {
    console.log('Creating conversation for user:', req.userId);
    
    // Get user's first name for personalized greeting
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name')
      .eq('id', req.userId)
      .single();
    
    const firstName = profile?.first_name;
    console.log('User first name:', firstName);

    // Create conversation in database (no thread_id needed anymore)
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: req.userId,
        title: title || 'New Conversation',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (convError) throw convError;
    console.log('Created conversation:', conversation.id);

    // Generate initial greeting
    const greeting = await openaiChatService.getInitialGreeting(timezone, firstName);
    console.log('Generated greeting');

    // Store the greeting as the first message
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: greeting,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (msgError) throw msgError;

    res.json({
      ...conversation,
      messages: [message]
    });
  } catch (error: any) {
    console.error('Failed to create conversation:', error);
    res.status(500).json({ 
      error: 'Failed to create conversation',
      details: error.message 
    });
  }
});

// Get messages for a conversation
router.get('/:conversationId/messages', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    
    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message to a conversation
router.post('/:conversationId/messages', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { content, temperature } = req.body;  // Changed from 'message' to 'content'

  try {
    console.log('Sending message to conversation:', conversationId);
    
    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get existing messages for context
    const { data: existingMessages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Store user message
    const { data: userMessage, error: userMsgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: content,  // Changed from 'message' to 'content'
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Build conversation history for ChatGPT
    const messageHistory = existingMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
    
    // Add the new user message
    messageHistory.push({
      role: 'user',
      content: content  // Changed from 'message' to 'content'
    });

    // RAG functionality temporarily disabled during compilation
    // const ragSettings = await getRAGSettings(req.userId!);
    let enhancedMessageHistory = messageHistory;

    // Get AI response using chat completion
    const aiResponse = await openaiChatService.sendMessage(
      enhancedMessageHistory,
      conversationId,
      temperature
    );

    // Store AI response
    const { data: assistantMessage, error: assistantMsgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assistantMsgError) throw assistantMsgError;

    // Update conversation title if this is one of the first messages
    if (existingMessages.length <= 2) {
      const title = await openaiChatService.generateConversationTitle(messageHistory);
      
      await supabaseAdmin
        .from('conversations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      assistantMessage.conversationTitle = title;
    }

    // Check if we should refine the title (at message counts 5, 10, 15)
    const messageCount = existingMessages.length + 2; // +2 for the new user and assistant messages
    if ([5, 10, 15].includes(messageCount)) {
      const currentMessages = [...messageHistory, { role: 'assistant' as const, content: aiResponse }];
      const newTitle = await openaiChatService.generateConversationTitle(currentMessages);
      
      if (newTitle !== conversation.title) {
        await supabaseAdmin
          .from('conversations')
          .update({ 
            title: newTitle,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
        
        assistantMessage.conversationTitle = newTitle;
        console.log(`Refined title at ${messageCount} messages: ${newTitle}`);
      }
    }

    res.json(assistantMessage);
  } catch (error: any) {
    console.error('Failed to send message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
});

// Archive a conversation
router.post('/:conversationId/archive', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ 
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// Mark conversation as complete
router.post('/:conversationId/complete', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { phase_completed } = req.body;
    
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ 
        is_completed: true,
        phase_completed: phase_completed || 7,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark conversation as complete' });
  }
});

// Send conversation transcript via email
router.post('/:conversationId/send-transcript', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { recipientEmail, format } = req.body;

    // Get conversation with messages
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*, messages(*)')
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get user email if not provided
    let email = recipientEmail;
    if (!email) {
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', req.userId)
        .single();
      email = user?.email;
    }

    // Send email with transcript
    await emailService.sendTranscript(
      conversationId,
      email,
      req.userId!
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to send transcript:', error);
    res.status(500).json({ 
      error: 'Failed to send transcript',
      details: error.message 
    });
  }
});

export default router;
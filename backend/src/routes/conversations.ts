import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { openaiService } from '../services/openai';
import { createSupabaseClient, supabaseAdmin } from '../services/supabase';
import { emailService } from '../services/email';

const router = Router();

router.use(authenticate);

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

router.post('/create', async (req: AuthRequest, res) => {
  const { title, timezone } = req.body;

  try {
    console.log('Creating conversation for user:', req.userId);
    
    // Create OpenAI thread
    let threadId;
    try {
      threadId = await openaiService.createThread();
      console.log('Created OpenAI thread:', threadId);
    } catch (openaiError: any) {
      console.error('OpenAI error:', openaiError.message);
      return res.status(500).json({ 
        error: 'Failed to create OpenAI thread', 
        details: openaiError.message 
      });
    }
    
    // Get user's first name for personalized greeting
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name')
      .eq('id', req.userId)
      .single();

    // Send initial greeting to get assistant's welcome message
    let initialGreeting;
    try {
      initialGreeting = await openaiService.getInitialGreeting(
        threadId, 
        timezone,
        profile?.first_name || undefined
      );
      console.log('Got initial greeting from assistant');
    } catch (greetingError: any) {
      console.error('Failed to get greeting:', greetingError);
      // Continue without greeting if it fails
    }
    
    // Create conversation in database
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: req.userId,
        thread_id: threadId,
        title: title || 'New Conversation'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    console.log('Created conversation:', data.id);
    
    // Save initial greeting message if we got one
    let greetingMessage = null;
    if (initialGreeting && data) {
      const { data: msgData } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          role: 'assistant',
          content: initialGreeting
        })
        .select()
        .single();
      greetingMessage = msgData;
    }
    
    res.json({ ...data, initialMessage: greetingMessage });
  } catch (error: any) {
    console.error('Failed to create conversation:', error);
    res.status(500).json({ 
      error: 'Failed to create conversation',
      details: error.message 
    });
  }
});

router.post('/:conversationId/messages', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { content } = req.body;

  console.log(`Processing message for conversation ${conversationId}`);
  console.log(`User: ${req.userId}, Content: ${content}`);

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    // Get conversation with current phase
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('thread_id, current_phase, phase_summaries')
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .is('archived_at', null)
      .single();

    if (convError) {
      console.error('Conversation lookup error:', convError);
      return res.status(404).json({ error: 'Conversation not found', details: convError.message });
    }

    if (!conversation) {
      console.error('Conversation not found for ID:', conversationId);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log('Found conversation with thread_id:', conversation.thread_id);

    // Save user message with current phase
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content,
        phase_number: conversation.current_phase || 1
      });

    if (userMsgError) {
      console.error('Failed to save user message:', userMsgError);
      throw userMsgError;
    }

    console.log('User message saved, sending to OpenAI...');

    // Get assistant response with refinements context
    let assistantResponse;
    try {
      assistantResponse = await openaiService.sendMessage(conversation.thread_id, content, conversationId);
      console.log('Received response from OpenAI');
    } catch (openaiError: any) {
      console.error('OpenAI error:', openaiError);
      return res.status(500).json({ 
        error: 'Failed to get AI response', 
        details: openaiError.message 
      });
    }

    // Detect phase from assistant response
    const phaseRegex = /\[Phase (\d+):\s*([^\]]+)\]/i;
    const phaseMatch = assistantResponse.match(phaseRegex);
    let detectedPhase = conversation.current_phase || 1;
    let isPhaseTransition = false;
    
    if (phaseMatch) {
      const newPhase = parseInt(phaseMatch[1]);
      if (newPhase !== conversation.current_phase && newPhase >= 1 && newPhase <= 7) {
        detectedPhase = newPhase;
        isPhaseTransition = true;
        
        // Update conversation's current phase
        await supabase
          .from('conversations')
          .update({ 
            current_phase: newPhase,
            phase_summaries: {
              ...conversation.phase_summaries,
              [`phase_${conversation.current_phase}`]: `Phase ${conversation.current_phase} completed`
            }
          })
          .eq('id', conversationId);
      }
    }
    
    // Save assistant message with phase info
    const { data: assistantMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantResponse,
        phase_number: detectedPhase,
        is_phase_transition: isPhaseTransition
      })
      .select()
      .single();

    if (msgError) {
      console.error('Failed to save assistant message:', msgError);
      throw msgError;
    }

    // Update conversation timestamp and potentially refine title
    const { data: convData } = await supabase
      .from('conversations')
      .select('title, messages:messages(id, role, content)')
      .eq('id', conversationId)
      .single();
    
    let updateData: any = { updated_at: new Date().toISOString() };
    let newTitle = null;
    
    // Generate or refine title based on conversation progress
    const messageCount = convData?.messages?.length || 0;
    const currentTitle = convData?.title || 'New Conversation';
    
    // Count user messages (excluding the one we just saved)
    const userMessageCount = convData?.messages?.filter((m: any) => m.role === 'user').length || 0;
    
    // Generate initial title on first user message (userMessageCount will be 1 after we just saved the first user message)
    if (currentTitle === 'New Conversation' && userMessageCount <= 1) {
      const title = await openaiService.generateConversationTitle(content, assistantResponse);
      updateData.title = title;
      newTitle = title;
      console.log(`Generated title for conversation ${conversationId}: "${title}"`);
    }
    // Refine title after 5, 10, or 15 messages if the conversation has evolved
    else if ((messageCount === 5 || messageCount === 10 || messageCount === 15) && currentTitle !== 'New Conversation') {
      // Get last few messages to understand conversation context
      const recentMessages = convData?.messages?.slice(-6) || [];
      const conversationContext = recentMessages.map((m: any) => 
        `${m.role}: ${m.content.substring(0, 200)}`
      ).join('\n');
      
      // Check if title should be refined
      const shouldRefine = await openaiService.shouldRefineTitle(currentTitle, conversationContext);
      
      if (shouldRefine) {
        const refinedTitle = await openaiService.generateConversationTitle(content, assistantResponse, conversationContext);
        updateData.title = refinedTitle;
        newTitle = refinedTitle;
        console.log(`Title refined from "${currentTitle}" to "${refinedTitle}" after ${messageCount} messages`);
      }
    }
    
    await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    console.log('Message processed successfully');
    
    // Include the new title in the response if it was updated
    const response = newTitle 
      ? { ...assistantMessage, conversationTitle: newTitle }
      : assistantMessage;
    
    res.json(response);
  } catch (error: any) {
    console.error('Failed to send message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
});

router.get('/:conversationId/messages', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .is('archived_at', null)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { data, error } = await supabase
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

// Mark conversation as completed
router.put('/:conversationId/complete', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { completionStep } = req.body;

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    // Get conversation start time to calculate duration
    const { data: conversation } = await supabase
      .from('conversations')
      .select('created_at')
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Calculate session duration in minutes
    const startTime = new Date(conversation.created_at);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        is_completed: true,
        completion_step: completionStep || 7,
        completed_at: endTime.toISOString(),
        session_duration_minutes: durationMinutes,
        updated_at: endTime.toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Failed to mark conversation as complete:', error);
    res.status(500).json({ error: 'Failed to mark conversation as complete' });
  }
});

// Uncomplete conversation (admin only)
router.put('/:conversationId/uncomplete', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;

  try {
    // Check if user is admin or super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, is_super_admin')
      .eq('id', req.userId)
      .single();

    if (!profile?.is_admin && !profile?.is_super_admin) {
      return res.status(403).json({ error: 'Only admins can uncomplete conversations' });
    }

    // Verify the conversation exists and is completed
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id, is_completed')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.is_completed) {
      return res.status(400).json({ error: 'Conversation is not completed' });
    }

    // Uncomplete the conversation
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({ 
        is_completed: false,
        completion_step: null,
        completed_at: null,
        session_duration_minutes: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`Conversation ${conversationId} uncompleted by super admin ${req.userId}`);
    res.json({ message: 'Conversation uncompleted successfully', data });
  } catch (error) {
    console.error('Failed to uncomplete conversation:', error);
    res.status(500).json({ error: 'Failed to uncomplete conversation' });
  }
});

// Archive conversation (replaces the old delete functionality)
router.put('/:conversationId/archive', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { archived } = req.body;

  try {
    // Verify the conversation exists and belongs to the user
    const { data: conversation, error: verifyError } = await supabaseAdmin
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (verifyError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if conversation belongs to the requesting user
    if (conversation.user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to archive this conversation' });
    }

    // Archive/unarchive conversation
    const updateData = {
      archived: archived === true,
      archived_at: archived === true ? new Date().toISOString() : null,
      archived_by: archived === true ? req.userId : null
    };
    
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('Archive error:', error);
      throw error;
    }
    
    res.json({ message: `Conversation ${archived ? 'archived' : 'unarchived'} successfully`, data });
  } catch (error) {
    console.error('Failed to archive conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// Update conversation phase
router.put('/:conversationId/phase', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { phase, summary } = req.body;

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, current_phase, phase_summaries')
      .eq('id', conversationId)
      .eq('user_id', req.userId)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Update phase and summaries
    const updatedSummaries = {
      ...conversation.phase_summaries,
      [`phase_${phase}`]: summary || `Phase ${phase} in progress`
    };

    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        current_phase: phase,
        phase_summaries: updatedSummaries,
        phase_updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Failed to update conversation phase:', error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

// Email transcript endpoint
router.post('/:conversationId/email-transcript', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { email } = req.body;

  try {
    // Send the transcript email
    const result = await emailService.sendTranscript(conversationId, email, req.userId!);
    
    res.json({ 
      message: 'Transcript sent successfully',
      email,
      conversationId,
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Failed to email transcript:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('Email service not configured')) {
      res.status(503).json({ 
        error: 'Email service is currently unavailable. Please try downloading the transcript instead.' 
      });
    } else if (error.message?.includes('Conversation not found')) {
      res.status(404).json({ error: 'Conversation not found' });
    } else {
      res.status(500).json({ 
        error: 'Failed to send transcript. Please try again or download instead.' 
      });
    }
  }
});

// Permanent delete conversation (super admin only)
router.delete('/:conversationId', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;

  try {
    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', req.userId)
      .single();

    if (!profile?.is_super_admin) {
      return res.status(403).json({ error: 'Only super admins can permanently delete conversations' });
    }

    // Verify the conversation exists
    const { data: conversation, error: verifyError } = await supabaseAdmin
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (verifyError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Permanently delete conversation (this will cascade delete messages)
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Permanent delete error:', error);
      throw error;
    }
    
    res.json({ message: 'Conversation permanently deleted successfully' });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
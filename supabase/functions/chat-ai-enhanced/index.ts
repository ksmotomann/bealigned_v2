import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Default system prompt (fallback if no admin tuner settings)
const DEFAULT_SYSTEM_PROMPT = `You are BeH2O®, a compassionate AI co-parenting coach developed by BeAligned. 
You help separated or divorced parents navigate co-parenting challenges with empathy and practical solutions.
Focus on the best interests of the children while supporting the emotional well-being of the parent.`

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get custom auth token from header
    const authToken = req.headers.get('x-auth-token')
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'No auth token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify token in app_sessions table
    const tokenHash = btoa(authToken) // Simple hash for demo
    const { data: session, error: sessionError } = await supabase
      .from('app_sessions')
      .select('*, user:users(*)')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user = session.user
    const { conversationId, content, includeHistory = true, chatSettings } = await req.json()

    // Store user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: content,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userMsgError) {
      throw new Error(`Failed to store user message: ${userMsgError.message}`)
    }

    // Get active admin tuner settings
    const { data: adminTunerSettings } = await supabase
      .from('admin_tuner_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    // Parse the settings JSON
    let tunerSettings: any = {}
    if (adminTunerSettings?.settings) {
      try {
        tunerSettings = JSON.parse(adminTunerSettings.settings)
        console.log('Using Admin Tuner settings:', {
          hasSystemInstructions: !!tunerSettings?.systemInstructions,
          hasModel: !!tunerSettings?.model,
          hasPhases: !!tunerSettings?.systemInstructions?.reflectionPhases
        })
      } catch (e) {
        console.error('Failed to parse admin tuner settings:', e)
      }
    }

    // Build system prompt with Admin Tuner settings
    let systemPrompt = tunerSettings?.systemInstructions?.mainPrompt || DEFAULT_SYSTEM_PROMPT
    
    // Add phase guidelines if present
    if (tunerSettings?.systemInstructions?.reflectionPhases) {
      const phases = tunerSettings.systemInstructions.reflectionPhases
      const phaseText = Object.entries(phases)
        .map(([key, desc]) => `- ${desc}`)
        .join('\n')
      systemPrompt += `\n\nPhase Guidelines:\n${phaseText}`
    }
    
    // Add response and safety guidelines
    if (tunerSettings?.systemInstructions?.responseGuidelines) {
      systemPrompt += `\n\nResponse Guidelines:\n${tunerSettings.systemInstructions.responseGuidelines}`
    }
    if (tunerSettings?.systemInstructions?.safetyGuidelines) {
      systemPrompt += `\n\nSafety Guidelines:\n${tunerSettings.systemInstructions.safetyGuidelines}`
    }

    // Use admin tuner model settings with ChatTuner overrides
    const model = chatSettings?.model || tunerSettings?.model?.name || 'gpt-4-turbo-preview'
    const temperature = chatSettings?.temperature ?? tunerSettings?.model?.temperature ?? 0.7
    const maxTokens = chatSettings?.maxTokens || tunerSettings?.model?.max_output_tokens || 1500
    const topP = chatSettings?.top_p ?? tunerSettings?.model?.top_p ?? 1.0
    const frequencyPenalty = chatSettings?.frequency_penalty ?? 0.1
    const presencePenalty = chatSettings?.presence_penalty ?? 0.1
    
    console.log('AI Configuration:', {
      model,
      temperature,
      maxTokens,
      systemPromptLength: systemPrompt.length,
      hasChatSettings: !!chatSettings
    })

    // Get conversation history (last 20 messages for context)
    const { data: recentMessages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (msgError) {
      throw new Error(`Failed to get message history: ${msgError.message}`)
    }

    // Get refinements for assistant messages
    const assistantMessageIds = recentMessages
      .filter(m => m.role === 'assistant')
      .map(m => m.id)

    let refinementsMap: Record<string, any> = {}
    if (assistantMessageIds.length > 0) {
      const { data: refinements } = await supabase
        .from('refinements')
        .select('*')
        .in('message_id', assistantMessageIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (refinements) {
        refinements.forEach(r => {
          // Use the most recent active refinement for each message
          if (!refinementsMap[r.message_id]) {
            refinementsMap[r.message_id] = r
          }
        })
      }
    }

    // Build message history with refinements applied
    const messageHistory = recentMessages.reverse().map(msg => {
      let content = msg.content
      
      // Apply refinement if exists and is for assistant message
      if (msg.role === 'assistant' && refinementsMap[msg.id]) {
        const refinement = refinementsMap[msg.id]
        content = refinement.refined_content
        
        // Add refinement note as context if it exists
        if (refinement.notes) {
          content += `\n\n[Context: ${refinement.notes}]`
        }
      }
      
      return {
        role: msg.role,
        content: content
      }
    })

    // Add user's conversation history context if enabled
    let userContext = ''
    if (includeHistory) {
      // Get user's recent conversations for context (last 5 conversations, 3 messages each)
      const { data: userConversations } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('user_id', user.id)
        .neq('id', conversationId)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (userConversations && userConversations.length > 0) {
        const conversationSummaries = []
        
        for (const conv of userConversations) {
          const { data: convMessages } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(3)
          
          if (convMessages && convMessages.length > 0) {
            const summary = convMessages.reverse()
              .map(m => `${m.role}: ${m.content.substring(0, 100)}...`)
              .join('\n')
            conversationSummaries.push(`[Previous conversation: ${conv.title}]\n${summary}`)
          }
        }
        
        if (conversationSummaries.length > 0) {
          userContext = `\n\nContext from user's recent conversations:\n${conversationSummaries.join('\n\n')}`
        }
      }
    }

    // Build the system prompt with user context
    let enhancedSystemPrompt = systemPrompt + userContext

    // Fetch relevant document chunks for context enhancement
    let documentContext = '';
    try {
      // Get all processed documents (admin view - all documents available)
      const { data: documents } = await supabase
        .from('documents')
        .select('id, original_name')
        .eq('processing_status', 'completed')
        .limit(10)

      if (documents && documents.length > 0) {
        // Get chunks from all available documents for BeH2O chat context
        const documentIds = documents.map(d => d.id)
        const { data: chunks } = await supabase
          .from('document_chunks')
          .select('content, chunk_index, document_id')
          .in('document_id', documentIds)
          .order('chunk_index', { ascending: true })
          .limit(12) // More chunks for main chat system

        if (chunks && chunks.length > 0) {
          // Create comprehensive document context for BeH2O
          const contextChunks = chunks.map((chunk, index) => {
            const doc = documents.find(d => d.id === chunk.document_id)
            const docName = doc?.original_name || 'Reference Material'
            return `[${docName} - Section ${chunk.chunk_index + 1}]\n${chunk.content}`
          }).join('\n\n---\n\n')

          documentContext = `\n\nBeAligned Reference Materials & Guidelines:\n${contextChunks}\n\n`
        }
      }
    } catch (docError) {
      console.error('Error fetching document context for chat:', docError)
      // Continue without document context if there's an error
    }

    // Add document context to enhanced system prompt
    enhancedSystemPrompt += documentContext

    // Get any admin refinement patterns to include
    const { data: refinementPatterns } = await supabase
      .from('refinements')
      .select('notes, refinement_type')
      .eq('is_active', true)
      .eq('refinement_type', 'guidance')
      .limit(5)

    let guidanceNotes = ''
    if (refinementPatterns && refinementPatterns.length > 0) {
      const patterns = refinementPatterns
        .map(p => p.notes)
        .filter(n => n)
        .join('\n- ')
      if (patterns) {
        guidanceNotes = `\n\nAdmin guidance for responses:\n- ${patterns}`
      }
    }

    // Call OpenAI Chat Completion
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: enhancedSystemPrompt + guidanceNotes },
          ...messageHistory
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      
      // Fallback to phase-based template responses if OpenAI fails
      let aiResponse = ''
      const messageCount = messageHistory.filter(m => m.role === 'user').length
      
      // Determine which phase we're in based on message count and content
      if (messageCount === 1 && content.toLowerCase().match(/^(hi|hello|hey)/)) {
        // Initial greeting response
        aiResponse = "Hello! I'm here to support you through your co-parenting journey. I understand that navigating co-parenting can bring up many emotions and challenges. What's the situation that's been sticking with you lately? I'm here to listen and help you work through it, step by step."
      } else if (messageCount <= 2) {
        // Phase 1: Name It
        aiResponse = "Thank you for sharing that with me. I can hear that this situation is weighing on you. Let's take a moment to really understand what's happening here. Can you tell me a bit more about what specifically about this situation is most challenging for you right now?"
      } else if (messageCount <= 4) {
        // Phase 2: What's Beneath That
        aiResponse = "I appreciate you opening up about this. It sounds like there are some strong feelings coming up around this situation. What emotions do you notice when you think about what's happening? Sometimes what we feel on the surface - like frustration or anger - can be covering deeper feelings like hurt, fear, or disappointment. What might be underneath for you?"
      } else if (messageCount <= 6) {
        // Phase 3: Your Why
        aiResponse = "That's really insightful. These feelings you're experiencing tell us something important about what matters to you. What is it about this situation that feels so important? What are you hoping for - for your child, for yourself, or for the co-parenting relationship?"
      } else if (messageCount <= 8) {
        // Phase 4: Co-parent's Perspective
        aiResponse = "You've done great work identifying what's important to you. Now, let's try something that might feel challenging but can be really valuable. If your co-parent were describing this same situation, how do you think they might see it? Even if you don't agree with their perspective, what do you imagine they might be feeling or needing?"
      } else if (messageCount <= 10) {
        // Phase 5: Child's Perspective
        aiResponse = "That takes real strength to consider their perspective. Now let's bring in the most important perspective - your child's. What do you think your child might be noticing about this situation? How might they be experiencing this, and what do you think they need right now - not from either parent specifically, but just in general?"
      } else if (messageCount <= 12) {
        // Phase 6: Explore Options
        aiResponse = "You've done amazing work exploring all these different perspectives. Given everything we've talked about - your needs, your co-parent's possible needs, and most importantly your child's needs - what ideas come to mind for how to move forward? Let's brainstorm 2-3 possibilities that could honor what everyone needs."
      } else {
        // Phase 7: Choose & Communicate
        aiResponse = "Looking at the options you've identified, which one feels most aligned with everyone's needs? Once you've chosen your path forward, I can help you craft a message to your co-parent that reflects shared purpose and clear communication. What feels like the right next step for you?"
      }
      
      // Store the fallback response
      const { data: assistantMessage, error: assistantMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
          created_at: new Date().toISOString(),
          metadata: {
            model: 'fallback',
            fallback_reason: 'OpenAI API error',
            phase: Math.min(Math.ceil(messageCount / 2), 7)
          }
        })
        .select()
        .single()

      if (assistantMsgError) {
        throw new Error(`Failed to store assistant message: ${assistantMsgError.message}`)
      }

      return new Response(JSON.stringify({
        assistantMessage,
        fallbackUsed: true,
        phase: Math.min(Math.ceil(messageCount / 2), 7)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const completion = await openaiResponse.json()
    const aiResponse = completion.choices[0].message.content

    // Store AI response
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString(),
        metadata: {
          model: model,
          temperature: temperature,
          used_refinements: Object.keys(refinementsMap).length > 0,
          included_history: includeHistory
        }
      })
      .select()
      .single()

    if (assistantMsgError) {
      throw new Error(`Failed to store assistant message: ${assistantMsgError.message}`)
    }

    // Update conversation's updated_at timestamp and generate title if needed
    const { data: conversation } = await supabase
      .from('conversations')
      .select('title, created_at')
      .eq('id', conversationId)
      .single()

    // Generate or refine title based on conversation progress
    let newTitle = null
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    // Check if we should generate or update the title
    // Title generation happens when:
    // 1. User has named their issue (Phase 1 complete) - usually around message 3-4
    // 2. Conversation evolves significantly (at message milestones)
    
    // Check if this message contains Phase 1 completion (naming the issue)
    const hasNamedIssue = aiResponse.includes('[Phase 2:') || // AI is moving to Phase 2
                          aiResponse.toLowerCase().includes('beneath') || // Moving to feelings exploration
                          (content.length > 20 && // User message is substantial enough
                           !['good evening', 'good morning', 'good afternoon', 'hello', 'hi', 'hey', 'how are you']
                             .some(g => content.toLowerCase().trim().startsWith(g)));
    
    // Generate initial title when Phase 1 is complete (user has named their issue)
    if (conversation && conversation.title === 'New Conversation' && hasNamedIssue) {
      // Get all user messages to understand what issue was named
      const { data: userMessages } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conversationId)
        .eq('role', 'user')
        .order('created_at', { ascending: true })
      
      if (userMessages && userMessages.length > 0) {
        // Combine user messages to understand the issue (skip greetings)
        const userContent = userMessages
          .map(m => m.content)
          .filter(c => c.length > 10) // Skip very short messages
          .join(' | ')
          .substring(0, 300);
        
        const titlePrompt = `The user is discussing a co-parenting issue. Based on what they've shared:
"${userContent}"

Generate a concise, descriptive title (3-6 words max) that captures their main concern.
Examples: "Custody Schedule Conflict", "Medical Decision Disagreement", "Communication Breakdown"
Return only the title, no quotes or punctuation.`
        
        const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'user', content: titlePrompt }
            ],
            temperature: 0.7,
            max_tokens: 20
          })
        })

        if (titleResponse.ok) {
          const titleCompletion = await titleResponse.json()
          newTitle = titleCompletion.choices[0].message.content.trim()
          
          // Ensure title fits in navigation (max 30 chars)
          if (newTitle && newTitle.length > 30) {
            newTitle = newTitle.substring(0, 27) + '...'
          }
        }
      }
    } 
    // Progressively refine title as conversation develops (at key milestones)
    else if (conversation && conversation.title !== 'New Conversation' && 
             (messageCount === 8 || messageCount === 15 || messageCount === 25)) {
      // Get recent USER messages to understand conversation evolution (ignore AI responses)
      const { data: recentMsgs } = await supabase
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversationId)
        .eq('role', 'user') // Only look at user messages for title generation
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentMsgs && recentMsgs.length > 0) {
        // Only use user messages for context
        const userStatements = recentMsgs.map(m => m.content.substring(0, 150)).join(' | ')
        const refineTitlePrompt = `Current title: "${conversation.title}"
User's recent statements about their co-parenting issue:
${userStatements}

Based ONLY on what the user has said (not AI responses), generate a concise title (3-6 words max).
If the current title still accurately represents the user's issue, return it unchanged.
Return only the title, no quotes or explanation.`

        const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'user', content: refineTitlePrompt }
            ],
            temperature: 0.5,
            max_tokens: 20
          })
        })

        if (titleResponse.ok) {
          const titleCompletion = await titleResponse.json()
          const refinedTitle = titleCompletion.choices[0].message.content.trim()
          // Only update if title actually changed
          if (refinedTitle !== conversation.title) {
            newTitle = refinedTitle
            // Ensure title fits in navigation
            if (newTitle.length > 30) {
              newTitle = newTitle.substring(0, 27) + '...'
            }
          }
        }
      }
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        ...(newTitle && { title: newTitle })
      })
      .eq('id', conversationId)

    // Log AI assistant usage
    await supabase
      .from('ai_assistant_logs')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        message_id: assistantMessage.id,
        model_used: model,
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
        response_time_ms: 0, // Would need to track actual time
        created_at: new Date().toISOString()
      })

    // Return both messages
    return new Response(JSON.stringify({
      userMessage,
      assistantMessage,
      conversationTitle: newTitle
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Enhanced Chat AI error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
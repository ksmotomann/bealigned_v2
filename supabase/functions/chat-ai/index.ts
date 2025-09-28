import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// System prompt for the BeAligned co-parenting coach
const SYSTEM_PROMPT = `You are BeH2O®, a compassionate AI co-parenting coach developed by BeAligned. 
You help separated or divorced parents navigate co-parenting challenges with empathy and practical solutions.
Focus on the best interests of the children while supporting the emotional well-being of the parent.
Be conversational, supportive, and provide actionable advice.
Remember the 7 phases of the BeAligned process when appropriate:
1. Understanding the Challenge
2. Exploring Emotions
3. Identifying Patterns
4. Reframing Perspectives
5. Building Solutions
6. Creating Action Plans
7. Reflecting on Progress`

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
    const { conversationId, content } = await req.json()

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

    // Get conversation history (last 20 messages for context)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (msgError) {
      throw new Error(`Failed to get message history: ${msgError.message}`)
    }

    // Reverse to get chronological order
    const messageHistory = messages.reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Fetch relevant document chunks for context enhancement
    let documentContext = '';
    try {
      // Get all processed documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id, original_name')
        .eq('processing_status', 'completed')
        .limit(10)

      if (documents && documents.length > 0) {
        const documentIds = documents.map(d => d.id)
        const { data: chunks } = await supabase
          .from('document_chunks')
          .select('content, chunk_index, document_id')
          .in('document_id', documentIds)
          .order('chunk_index', { ascending: true })
          .limit(10)

        if (chunks && chunks.length > 0) {
          const contextChunks = chunks.map((chunk, index) => {
            const doc = documents.find(d => d.id === chunk.document_id)
            const docName = doc?.original_name || 'Reference Material'
            return `[${docName} - Section ${chunk.chunk_index + 1}]\n${chunk.content}`
          }).join('\n\n---\n\n')

          documentContext = `\n\nBeAligned Reference Materials:\n${contextChunks}\n\n`
        }
      }
    } catch (docError) {
      console.error('Error fetching document context for basic chat:', docError)
    }

    // Enhanced system prompt with document context
    const enhancedSystemPrompt = SYSTEM_PROMPT + documentContext

    // Call OpenAI Chat Completion
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          ...messageHistory
        ],
        temperature: 0.7,
        max_tokens: 1500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
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
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (assistantMsgError) {
      throw new Error(`Failed to store assistant message: ${assistantMsgError.message}`)
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Return both messages
    return new Response(JSON.stringify({
      userMessage,
      assistantMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Chat AI error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
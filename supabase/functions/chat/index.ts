import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { composeSystemPrompt } from './prompts.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIResponseRequest {
  userInput: string
  currentPhase: number
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    metadata?: any
  }>
  sessionContext?: Record<string, any>
  sessionId?: string
}

interface StructuredResponse {
  reply: string
  phase_status: 'in_progress' | 'completed'
  current_phase: number
  next_phase: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userInput, currentPhase, conversationHistory, sessionContext, sessionId } =
      await req.json() as AIResponseRequest

    console.log(`🎯 Structured Chat Function - Phase ${currentPhase}:`, { userInput, sessionId })

    // Get phase prompt and guidance from database
    const { data: phasePrompt, error: phaseError } = await supabaseClient
      .from('phase_prompts')
      .select('*')
      .eq('phase_number', currentPhase)
      .single()

    if (phaseError || !phasePrompt) {
      console.log('⚠️ DATABASE QUERY FAILED - phase_prompts table empty or query error')
      console.log('   Error:', phaseError?.message)
      throw new Error(`Failed to load phase ${currentPhase} prompt: ${phaseError?.message}`)
    }

    console.log('📋 DATABASE PHASE PROMPT:', {
      phase_header: phasePrompt.phase_header,
      ai_guidance: phasePrompt.ai_guidance ? phasePrompt.ai_guidance.substring(0, 100) + '...' : 'undefined',
      hasGuidance: !!phasePrompt.ai_guidance
    })

    // 🎯 VECTOR RETRIEVAL: Get relevant BeH2O content from vector database
    console.log('🔍 VECTOR RETRIEVAL: Generating embedding for user input...')
    let vectorContext = ''
    try {
      // Generate embedding for user input using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userInput,
          model: 'text-embedding-ada-002',
        }),
      })

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json()
        const queryEmbedding = embeddingData.data[0].embedding

        console.log('✅ Embedding generated, searching vector database...')

        // Search for relevant chunks - EXCLUDE conversation samples, prioritize methodology
        const { data: relevantChunks, error: vectorError } = await supabaseClient
          .rpc('match_bealigned_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.6,  // Lowered threshold to get more results
            match_count: 5,  // Get more chunks
            filter_phase: null  // Don't filter by phase - get general methodology content
          })

        if (!vectorError && relevantChunks && relevantChunks.length > 0) {
          // Filter out short/incomplete chunks (likely conversation fragments)
          const methodologyChunks = relevantChunks.filter(chunk =>
            chunk.content && chunk.content.length > 50
          )

          console.log(`✅ Found ${methodologyChunks.length} relevant BeH2O content chunks (${relevantChunks.length} total before filtering)`)
          console.log('   Similarities:', methodologyChunks.map(c => `${(c.similarity * 100).toFixed(1)}%`).join(', '))

          if (methodologyChunks.length > 0) {
            // Build context from retrieved chunks - emphasize this is GUIDANCE
            vectorContext = '\n\n--- CRITICAL: BeH2O Methodology Guidance (Apply these principles in your response) ---\n' +
              methodologyChunks.map((chunk, i) =>
                `[BeH2O Principle ${i + 1}]: ${chunk.content}`
              ).join('\n\n') +
              '\n--- Use BeH2O voice: warm, grounded, purposeful. NOT therapeutic jargon. ---\n'
          }
        } else {
          console.log('⚠️ No relevant vector content found or error:', vectorError?.message)
        }
      } else {
        console.log('⚠️ Embedding API failed:', embeddingResponse.status)
      }
    } catch (vectorErr) {
      console.log('⚠️ Vector retrieval failed (continuing without):', vectorErr.message)
    }

    // Build system prompt from governance + phase template files
    console.log('📋 Loading governance and phase template from markdown files...')
    const systemPrompt = await composeSystemPrompt(currentPhase, userInput, vectorContext)

    console.log('🔍 SYSTEM PROMPT STRUCTURE:')
    console.log('   Source: packages/prompts/ markdown files (governance.md + phase templates)')
    console.log(`   Current Phase: ${currentPhase}`)
    console.log('   Governance: Loaded from governance.md')
    console.log(`   Phase Template: Loaded from 0${currentPhase}_*.md`)
    console.log('   Vector Context:', vectorContext ? `${vectorContext.length} chars` : 'none')

    // Generate AI response
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...conversationHistory,
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.9,
        max_tokens: 500,
        top_p: 0.95
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const rawResponse = openaiData.choices[0]?.message?.content || ''

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🤖 AI RESPONSE RECEIVED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Raw Response:', rawResponse)
    console.log('🚨 DEBUGGING: Is AI generating phase headers?', rawResponse.includes('PHASE 2'))
    console.log('🚨 DEBUGGING: Is AI generating 💬?', rawResponse.includes('💬'))
    console.log('🚨 DEBUGGING: Is AI generating 🌊?', rawResponse.includes('🌊'))

    // Parse structured JSON response
    let structuredResponse: StructuredResponse
    try {
      // Try to extract JSON from response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse
      structuredResponse = JSON.parse(jsonStr)

      // Validate required fields
      if (!structuredResponse.reply || !structuredResponse.phase_status || !structuredResponse.current_phase) {
        throw new Error('Missing required fields in AI response')
      }

    } catch (parseError) {
      console.error('❌ Failed to parse structured response:', parseError)
      // Fallback: create structured response from raw text
      structuredResponse = {
        reply: rawResponse,
        phase_status: 'in_progress',
        current_phase: currentPhase,
        next_phase: currentPhase
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ PARSED STRUCTURED RESPONSE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('   phase_status:', structuredResponse.phase_status)
    console.log('   current_phase:', structuredResponse.current_phase)
    console.log('   next_phase:', structuredResponse.next_phase)
    console.log('   reply preview:', structuredResponse.reply?.substring(0, 150) + '...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // If phase completed, update session only (no phase header in content)
    let nextPhase = structuredResponse.current_phase
    let phaseAdvanced = false
    let nextPhasePrompt = null

    if (structuredResponse.phase_status === 'completed' && sessionId) {
      nextPhase = structuredResponse.next_phase
      phaseAdvanced = true

      console.log(`🚀 Phase advancement: ${currentPhase} → ${nextPhase}`)

      // Get next phase prompt data for header
      const { data: nextPhaseData, error: nextPhaseError } = await supabaseClient
        .from('phase_prompts')
        .select('*')
        .eq('phase_number', nextPhase)
        .single()

      if (!nextPhaseError && nextPhaseData) {
        nextPhasePrompt = nextPhaseData
        console.log(`📋 Next phase header: ${nextPhaseData.phase_header}`)
      }

      // Update session current_phase
      const { error: updateError } = await supabaseClient
        .from('reflection_sessions')
        .update({ current_phase: nextPhase })
        .eq('id', sessionId)

      if (updateError) {
        console.error('❌ Failed to update session phase:', updateError)
      }
    }

    // Return response in format expected by frontend
    return new Response(
      JSON.stringify({
        content: structuredResponse.reply,
        model: 'gpt-4',
        phase_advanced: phaseAdvanced,
        original_phase: currentPhase,
        current_phase: structuredResponse.current_phase,
        next_phase: nextPhase,
        phase_status: structuredResponse.phase_status,
        guidance_type: 'structured_json',
        phase_data: phaseAdvanced && nextPhasePrompt ? {
          title: nextPhasePrompt.phase_header,
          semantic_id: nextPhasePrompt.semantic_id
        } : {
          title: phasePrompt.phase_header,
          semantic_id: phasePrompt.semantic_id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in structured chat function:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to generate structured response',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
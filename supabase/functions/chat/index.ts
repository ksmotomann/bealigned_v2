import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      throw new Error(`Failed to load phase ${currentPhase} prompt: ${phaseError?.message}`)
    }

    // Build system prompt with phase guidance
    const systemPrompt = `You are Trina, a warm and experienced co-parenting coach using the BeH2O methodology.

Current Phase: ${phasePrompt.phase_header}
Guidance: ${phasePrompt.ai_guidance}

User Input: ${userInput}

BeH2O® Principles:
- Be Strong: Communicate with clarity and grounded purpose
- Flow: Be responsive, not reactive, while moving forward
- The Third Side: Hold space for all perspectives while centering the child
- Safeguarding Childhoods: The goal is protecting the child's experience

CRITICAL INSTRUCTION: You must respond ONLY with valid JSON. Do not include any text before or after the JSON.

DO NOT include phase headers like "PHASE 2: WHAT'S BENEATH THAT?" in your response.
DO NOT include emojis like 💬 or 🌊 in your response.
Phase headers are handled separately by the system.

Your response must be in this EXACT format:
{
  "reply": "your warm, reflective message here",
  "phase_status": "completed",
  "current_phase": ${currentPhase},
  "next_phase": ${currentPhase === 7 ? currentPhase : currentPhase + 1}
}

PHASE COMPLETION CRITERIA:
Phase 1: "completed" when user has clearly NAMED their situation/concern
Phase 2: "completed" when user has identified DEEPER EMOTIONS/FEELINGS beneath the surface
Phase 3: "completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES
  - Look for statements like "for my kids", "to be a good parent", "to set an example", "because it's right"
  - User has moved beyond surface concerns to deeper motivations
Phase 4: "completed" when user has genuinely CONSIDERED CO-PARENT'S PERSPECTIVE
Phase 5: "completed" when user has genuinely CONSIDERED CHILD'S PERSPECTIVE
Phase 6: "completed" when user has EXPLORED POTENTIAL SOLUTIONS/OPTIONS
Phase 7: "completed" when user has CHOSEN a specific COMMUNICATION APPROACH

Current Phase ${currentPhase} - Set "phase_status" to "completed" if user has met the criteria above
- Set "phase_status" to "in_progress" if they need more exploration
- When "phase_status" is "completed", ALWAYS set "next_phase" to ${currentPhase + 1}
- When "phase_status" is "in_progress", set "next_phase" to ${currentPhase}
- Be natural and conversational in your "reply" field
- NEVER include phase headers or phase transitions in your reply
- RESPOND ONLY WITH JSON - NO OTHER TEXT`

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

    console.log('🤖 Raw AI Response:', rawResponse)
    console.log('🔍 Full AI Response for debugging:', rawResponse)
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

    console.log('✅ Structured Response:', {
      phase_status: structuredResponse.phase_status,
      current_phase: structuredResponse.current_phase,
      next_phase: structuredResponse.next_phase
    })

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

      // Update session current_step
      const { error: updateError } = await supabaseClient
        .from('reflection_sessions')
        .update({ current_step: nextPhase })
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
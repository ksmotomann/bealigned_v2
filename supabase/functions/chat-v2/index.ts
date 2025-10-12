/**
 * BeAligned Flow Engine (chat-v2)
 * Complete rebuild based on master architecture from assets/master/
 *
 * Key Features:
 * - Readiness-based phase progression (0-1 score)
 * - Nonlinear flow (can loop within phases)
 * - FlowState tracking (accumulated context)
 * - Prompt library with variations
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  FlowPhase,
  FlowState,
  AIReflectionRequest,
  AIReflectionResponse,
  READINESS_THRESHOLD
} from './types.ts'
import { buildSystemPrompt } from './governance.ts'
import { selectPrompt, getTransitionPrompt } from './prompt-library.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Phase sequence for default progression
 */
const PHASE_SEQUENCE: FlowPhase[] = ['issue', 'feelings', 'why', 'coparent', 'child', 'options', 'message']

/**
 * Get next phase in sequence
 */
function getNextPhase(currentPhase: FlowPhase): FlowPhase {
  const currentIndex = PHASE_SEQUENCE.indexOf(currentPhase)
  if (currentIndex === -1 || currentIndex === PHASE_SEQUENCE.length - 1) {
    return currentPhase // Stay on last phase
  }
  return PHASE_SEQUENCE[currentIndex + 1]
}

/**
 * Get phase heading that matches the phase progress tracker
 */
function getPhaseHeading(phase: FlowPhase): string {
  const headings: Record<FlowPhase, string> = {
    'issue': '🌿 **PHASE 1:** *LET\'S NAME IT*',
    'feelings': '🌊 **PHASE 2:** *WHAT\'S BENEATH THAT?*',
    'why': '💫 **PHASE 3:** *YOUR WHY*',
    'coparent': '👥 **PHASE 4:** *STEP INTO YOUR CO-PARENT\'S SHOES*',
    'child': '👶 **PHASE 5:** *SEE THROUGH YOUR CHILD\'S EYES*',
    'options': '💡 **PHASE 6:** *EXPLORE ALIGNED OPTIONS*',
    'message': '✉️ **PHASE 7:** *CHOOSE + COMMUNICATE*'
  }
  return headings[phase] || ''
}

/**
 * Initialize FlowState for new session
 */
function initializeFlowState(): FlowState {
  return {
    readiness: 0.0,
    context: {},
    lastPrompt: '',
    lastResponse: '',
    conversationHistory: []
  }
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

    const request = await req.json() as AIReflectionRequest
    const { userInput, currentPhase, flowState, sessionId } = request

    console.log(`🌊 Flow Engine v2 - Phase: ${currentPhase}, Readiness: ${flowState?.readiness || 0}`)

    // Initialize flow state if not provided
    const activeFlowState = flowState || initializeFlowState()

    // Build system prompt
    console.log('📋 Building system prompt from master governance...')
    const systemPrompt = buildSystemPrompt(
      currentPhase as FlowPhase,
      activeFlowState,
      userInput
    )

    console.log('🤖 Calling OpenAI with readiness-based prompting...')

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
          ...activeFlowState.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.7,  // Lower temp for better instruction-following (was 0.9)
        max_tokens: 1500,  // Increased to ensure Phase 6 options complete
        top_p: 0.95
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const rawResponse = openaiData.choices[0]?.message?.content || ''

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🤖 AI RESPONSE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(rawResponse.substring(0, 200) + '...')

    // Parse structured JSON response
    let aiResponse: AIReflectionResponse
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse
      aiResponse = JSON.parse(jsonStr)

      // Validate required fields
      if (!aiResponse.summary || !aiResponse.next_prompt || aiResponse.readiness === undefined) {
        throw new Error('Missing required fields in AI response')
      }

    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
      // Fallback response
      aiResponse = {
        summary: 'Processing your response...',
        next_prompt: selectPrompt(currentPhase as FlowPhase, 'reprompt'),
        readiness: 0.5,
        suggested_next_phase: null,
        context_updates: {}
      }
    }

    console.log('📊 READINESS SCORE:', aiResponse.readiness.toFixed(2))
    console.log('🎯 SUGGESTED PHASE:', aiResponse.suggested_next_phase || 'stay in current')

    // Determine next phase based on readiness
    let nextPhase = currentPhase
    let phaseAdvanced = false

    if (aiResponse.readiness >= READINESS_THRESHOLD) {
      // User is ready to advance
      if (aiResponse.suggested_next_phase && aiResponse.suggested_next_phase !== currentPhase) {
        nextPhase = aiResponse.suggested_next_phase
        phaseAdvanced = true
        console.log(`🚀 Phase advancement: ${currentPhase} → ${nextPhase}`)
      } else {
        // AI didn't suggest next phase, use sequence
        const sequentialNext = getNextPhase(currentPhase as FlowPhase)
        if (sequentialNext !== currentPhase) {
          nextPhase = sequentialNext
          phaseAdvanced = true
          console.log(`🚀 Phase advancement (sequential): ${currentPhase} → ${nextPhase}`)
        }
      }
    } else {
      console.log(`🔄 Staying in ${currentPhase} (readiness ${aiResponse.readiness.toFixed(2)} < ${READINESS_THRESHOLD})`)
    }

    // Update flow state
    const updatedFlowState: FlowState = {
      readiness: aiResponse.readiness,
      context: {
        ...activeFlowState.context,
        ...aiResponse.context_updates
      },
      lastPrompt: aiResponse.next_prompt,
      lastResponse: userInput,
      conversationHistory: [
        ...activeFlowState.conversationHistory,
        {
          role: 'user',
          content: userInput,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: aiResponse.next_prompt,
          readiness: aiResponse.readiness,
          timestamp: new Date().toISOString()
        }
      ].slice(-10) // Keep last 10 exchanges
    }

    // Save to database if sessionId provided
    if (sessionId) {
      const { error: updateError } = await supabaseClient
        .from('reflection_sessions')
        .update({
          current_step: PHASE_SEQUENCE.indexOf(nextPhase as FlowPhase) + 1, // Convert to 1-7
          flow_state: updatedFlowState
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('❌ Failed to update session:', updateError)
      }
    }

    // Only prepend phase heading when advancing to a new phase
    const phaseHeading = phaseAdvanced ? getPhaseHeading(nextPhase as FlowPhase) : ''
    const contentWithHeading = phaseHeading
      ? `${phaseHeading}\n\n${aiResponse.next_prompt}`
      : aiResponse.next_prompt

    // Return response
    return new Response(
      JSON.stringify({
        content: contentWithHeading,
        summary: aiResponse.summary,
        model: 'gpt-4o',
        phase_advanced: phaseAdvanced,
        original_phase: currentPhase,
        current_phase: nextPhase,
        readiness: aiResponse.readiness,
        flow_state: updatedFlowState,
        guidance_type: 'flow_engine_v2'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in flow engine v2:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to generate response',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

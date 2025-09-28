// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PhaseCompletionRequest {
  userInput: string
  currentPhase: number
  aiResponse: string
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    metadata?: any
  }>
}

interface CompletionPattern {
  id: number
  phase_number: number | null
  pattern_type: string
  pattern_regex: string | null
  threshold_value: number | null
  description: string
  is_active: boolean
}

interface CompletionSignal {
  id: number
  signal_text: string
  applies_to_phases: number[]
  signal_type: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { userInput, currentPhase, aiResponse, conversationHistory = [] } = 
      await req.json() as PhaseCompletionRequest

    console.log(`🔍 Phase Completion Check - Phase ${currentPhase}:`, { 
      userInput: userInput.substring(0, 50) + '...',
      aiResponseLength: aiResponse.length,
      userInputLength: userInput.length
    })

    // Step 1: Check for explicit completion signals first
    const { data: completionSignals } = await supabaseClient
      .from('completion_signals')
      .select('*')
      .contains('applies_to_phases', [currentPhase])

    const userInputTrimmed = userInput.trim().toLowerCase()
    
    for (const signal of completionSignals || []) {
      if (userInputTrimmed === signal.signal_text.toLowerCase()) {
        console.log(`✅ Explicit completion signal found: "${signal.signal_text}"`)
        return new Response(
          JSON.stringify({
            shouldAdvance: true,
            reason: `explicit_signal:${signal.signal_text}`,
            confidence: 1.0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Step 2: Get completion patterns for this phase and general patterns
    const { data: patterns } = await supabaseClient
      .from('completion_patterns')
      .select('*')
      .or(`phase_number.eq.${currentPhase},phase_number.is.null`)
      .eq('is_active', true)

    if (!patterns) {
      throw new Error('Failed to load completion patterns')
    }

    // Step 3: Apply pattern-based logic
    const userInputLength = userInput.trim().length
    const aiResponseLength = aiResponse.trim().length

    // Get thresholds from database with more reasonable defaults
    const userEngagementThreshold = patterns.find(p => p.pattern_type === 'user_input_length')?.threshold_value || 3
    const aiResponseThreshold = patterns.find(p => p.pattern_type === 'ai_response_length')?.threshold_value || 20  // Lowered from 50

    const userEngaged = userInputLength > userEngagementThreshold
    const aiResponded = aiResponseLength > aiResponseThreshold

    console.log('📊 Engagement metrics:', {
      userInputLength,
      aiResponseLength,
      userEngagementThreshold,
      aiResponseThreshold,
      userEngaged,
      aiResponded,
      endsWithQuestion: aiResponse.trim().endsWith('?'),
      patternCount: patterns?.length || 0
    })

    // Phase-specific logic
    console.log(`🎯 ROUTING TO PHASE ${currentPhase} COMPLETION LOGIC`)
    
    try {
      if (currentPhase === 5) {
        console.log('📍 About to call Phase 5 completion')
        const result = await checkPhase5Completion(userInput, aiResponse, patterns, userEngaged, aiResponded)
        console.log('📍 Phase 5 completion returned:', result.status || 'unknown status')
        return result
      } else if (currentPhase === 1) {
        console.log('📍 About to call Phase 1 completion')
        const result = await checkPhase1Completion(userInput, aiResponse, patterns, userEngaged, aiResponded)
        console.log('📍 Phase 1 completion returned:', result.status || 'unknown status')
        return result
      } else if (currentPhase === 2) {
        console.log('📍 About to call Phase 2 completion')
        const result = await checkPhase2Completion(userInput, aiResponse, patterns, conversationHistory, currentPhase, userEngaged, aiResponded)
        console.log('📍 Phase 2 completion returned:', result.status || 'unknown status')
        return result
      } else if (currentPhase === 3) {
        console.log('📍 About to call Phase 3 completion')
        const result = await checkPhase3Completion(userInput, aiResponse, patterns, userEngaged, aiResponded)
        console.log('📍 Phase 3 completion returned:', result.status || 'unknown status')
        return result
      } else if (currentPhase === 6) {
        console.log('📍 About to call Phase 6 completion')
        const result = await checkPhase6Completion(userInput, aiResponse, patterns, userEngaged, aiResponded)
        console.log('📍 Phase 6 completion returned:', result.status || 'unknown status')
        return result
      } else {
        console.log('📍 About to call General phase completion')
        const result = await checkGeneralPhaseCompletion(userInput, aiResponse, patterns, conversationHistory, currentPhase, userEngaged, aiResponded)
        console.log('📍 General phase completion returned:', result.status || 'unknown status')
        return result
      }
    } catch (phaseError) {
      console.error('❌ Error in phase-specific completion logic:', phaseError)
      return new Response(
        JSON.stringify({
          shouldAdvance: false,
          reason: 'phase_completion_error',
          error: phaseError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Error in check-phase-completion:', error)
    
    return new Response(
      JSON.stringify({
        shouldAdvance: false,
        reason: 'error',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Phase 5 specific completion logic
async function checkPhase5Completion(
  userInput: string, 
  aiResponse: string, 
  patterns: CompletionPattern[], 
  userEngaged: boolean, 
  aiResponded: boolean
) {
  console.log('5️⃣ PHASE 5 FUNCTION ENTRY')
  console.log('5️⃣ User input:', JSON.stringify(userInput))
  console.log('5️⃣ AI response:', JSON.stringify(aiResponse))
  
  const substantiveThreshold = patterns.find(p => p.pattern_type === 'substantive_response_length')?.threshold_value || 15

  // Use hardcoded patterns to ensure reliable detection (matching AI function logic)
  const userInputLower = userInput.toLowerCase()
  const hasChildEmotions = /hurt|sad|angry|scared|confused|lost|upset|frustrated|hate|love|need|want|feel|think|notice|see|know/.test(userInputLower)
  const hasChildPerspective = /they|child|son|daughter|kids|children/.test(userInputLower)
  const hasSubstantiveResponse = userInput.trim().length > substantiveThreshold
  const providedChildInsight = hasChildEmotions && hasChildPerspective && hasSubstantiveResponse
  
  console.log('5️⃣ Pattern matches:', {
    userInputLower: userInputLower.substring(0, 50) + '...',
    hasChildEmotions,
    hasChildPerspective,
    hasSubstantiveResponse,
    providedChildInsight,
    substantiveThreshold
  })

  console.log('PHASE 5 CHILD PERSPECTIVE CHECK:', { 
    hasChildEmotions, 
    hasChildPerspective, 
    hasSubstantiveResponse,
    providedChildInsight,
    userInputLength: userInput.trim().length,
    aiAskedQuestion: aiResponse.trim().endsWith('?'),
    userEngaged,
    aiResponded
  })

  // If AI asks a question, stay in phase for user to respond
  if (aiResponse.trim().endsWith('?')) {
    console.log('PHASE 5 STAYING - AI asked a question, waiting for user response')
    return new Response(
      JSON.stringify({
        shouldAdvance: false,
        reason: 'ai_asked_question',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  // If user provided child perspective insights, advance
  if (providedChildInsight && userEngaged && aiResponded) {
    console.log('PHASE 5 ADVANCING TRUE - Child perspective insights provided')
    return new Response(
      JSON.stringify({
        shouldAdvance: true,
        reason: 'child_perspective_insight_provided',
        confidence: 0.8
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  // Fallback: If user provided substantial response but not specific child insight, still advance
  if (hasSubstantiveResponse && userEngaged && aiResponded) {
    console.log('PHASE 5 ADVANCING TRUE - Substantial response provided (fallback)')
    return new Response(
      JSON.stringify({
        shouldAdvance: true,
        reason: 'substantial_phase5_response',
        confidence: 0.7
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  console.log('PHASE 5 NOT ADVANCING - insufficient response')
  return new Response(
    JSON.stringify({
      shouldAdvance: false,
      reason: 'phase5_incomplete',
      confidence: 0.7
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}

// Phase 1 specific completion logic
async function checkPhase1Completion(
  userInput: string, 
  aiResponse: string, 
  patterns: CompletionPattern[], 
  userEngaged: boolean, 
  aiResponded: boolean
) {
  const hasNamingSufficiency = userInput.trim().length > 20 // User provided substantial description
  const hasIssueContent = /problem|issue|concern|situation|difficulty|trouble|worried|scared|upset|struggle/i.test(userInput)
  
  console.log('1️⃣ Phase 1 check:', { 
    hasNamingSufficiency, 
    hasIssueContent, 
    userEngaged, 
    aiResponded,
    userInputLength: userInput.trim().length,
    userInputSample: userInput.substring(0, 50)
  })

  // Advance when user has sufficiently "named" their issue with substantial content
  const shouldAdvance = userEngaged && aiResponded && hasNamingSufficiency

  return new Response(
    JSON.stringify({
      shouldAdvance,
      reason: shouldAdvance ? 'phase1_reflection_complete' : 'phase1_incomplete',
      confidence: 0.8
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}

// Phase 2 specific completion logic  
async function checkPhase2Completion(
  userInput: string,
  aiResponse: string,
  patterns: CompletionPattern[],
  conversationHistory: any[],
  currentPhase: number,
  userEngaged: boolean,
  aiResponded: boolean
) {
  console.log('2️⃣ PHASE 2 FUNCTION ENTRY')
  
  const substantiveThreshold = patterns.find(p => p.pattern_type === 'substantive_response_length')?.threshold_value || 20
  const hasSubstantiveResponse = userInput.trim().length > substantiveThreshold
  const answeredTheQuestion = userInput.trim().length > 10 // User provided some answer

  console.log('PHASE 2 EMOTIONAL RESPONSE CHECK:', { 
    userInputLength: userInput.trim().length,
    hasSubstantiveResponse,
    answeredTheQuestion, 
    userEngaged,
    aiResponded,
    aiAskedQuestion: aiResponse.trim().endsWith('?')
  })

  // If AI asks a question, stay in phase for user to respond
  if (aiResponse.trim().endsWith('?')) {
    console.log('PHASE 2 STAYING - AI asked a question, waiting for user response')
    return new Response(
      JSON.stringify({
        shouldAdvance: false,
        reason: 'ai_asked_question',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  // If user provided substantial emotional response and AI didn't ask another question, advance
  if (hasSubstantiveResponse && userEngaged && aiResponded) {
    console.log('PHASE 2 ADVANCING TRUE - Substantial emotional response and AI not asking more')
    return new Response(
      JSON.stringify({
        shouldAdvance: true,
        reason: 'substantial_emotional_response',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  console.log('PHASE 2 NOT ADVANCING - checking fallback')

  // Fallback: Basic completion if user engaged but didn't meet substantial threshold
  const shouldAdvance = userEngaged && aiResponded && answeredTheQuestion
  
  console.log('PHASE 2 FINAL DECISION:', { 
    shouldAdvance,
    reason: shouldAdvance ? 'basic_emotional_response' : 'insufficient_emotional_response'
  })

  return new Response(
    JSON.stringify({
      shouldAdvance,
      reason: shouldAdvance ? 'basic_emotional_response' : 'insufficient_emotional_response',
      confidence: 0.7
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}

// Phase 3 specific completion logic
async function checkPhase3Completion(
  userInput: string,
  aiResponse: string,
  patterns: CompletionPattern[],
  userEngaged: boolean,
  aiResponded: boolean
) {
  console.log('3️⃣ PHASE 3 FUNCTION ENTRY')
  console.log('PHASE 3 RAW INPUTS:', {
    userInput: `"${userInput}"`,
    aiResponse: `"${aiResponse}"`,
    userInputLength: userInput?.length,
    aiResponseLength: aiResponse?.length
  })
  
  const substantialWhyLength = patterns.find(p => p.pattern_type === 'substantial_why_length')?.threshold_value || 20
  const hasSubstantialWhy = userInput.trim().length > substantialWhyLength
  const answeredTheWhyQuestion = userInput.trim().length > 10 // User provided some answer
  const aiAskedQuestion = aiResponse.trim().endsWith('?')

  // Check for values-based response
  const userInputLower = userInput.toLowerCase()
  const hasValuesResponse = /safety|protect|trust|values|important|care|love|responsible|duty|father|parent|right|wrong|family/.test(userInputLower)
  const isSubstantial = userInput.trim().length > 20
  const providedWhyValues = hasValuesResponse && isSubstantial

  console.log('PHASE 3 DETAILED ANALYSIS:', { 
    userInputLength: userInput.trim().length,
    hasSubstantialWhy,
    answeredTheWhyQuestion, 
    userEngaged,
    aiResponded,
    aiAskedQuestion,
    hasValuesResponse,
    isSubstantial,
    providedWhyValues,
    userInputSample: userInput.substring(0, 100)
  })

  // If AI asks a question, stay in phase for user to respond
  if (aiAskedQuestion) {
    console.log('PHASE 3 STAYING - AI asked a question, waiting for user response')
    return new Response(
      JSON.stringify({
        shouldAdvance: false,
        reason: 'ai_asked_question',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  // If user provided substantial why/values response and AI didn't ask another question, advance
  if (hasSubstantialWhy && userEngaged && aiResponded) {
    console.log('PHASE 3 ADVANCING TRUE - Substantial why response and AI not asking more')
    return new Response(
      JSON.stringify({
        shouldAdvance: true,
        reason: 'substantial_why_response',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  console.log('PHASE 3 NOT ADVANCING - checking fallback')

  // Fallback: Basic completion if user engaged but didn't meet substantial threshold
  const shouldAdvance = userEngaged && aiResponded && answeredTheWhyQuestion

  console.log('PHASE 3 FINAL DECISION:', { 
    shouldAdvance,
    reason: shouldAdvance ? 'basic_why_provided' : 'insufficient_why_response'
  })

  return new Response(
    JSON.stringify({
      shouldAdvance,
      reason: shouldAdvance ? 'basic_why_provided' : 'insufficient_why_response',
      confidence: 0.7
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}

// Phase 6 specific completion logic
async function checkPhase6Completion(
  userInput: string,
  aiResponse: string,
  patterns: CompletionPattern[],
  userEngaged: boolean,
  aiResponded: boolean
) {
  console.log('6️⃣ PHASE 6 FUNCTION ENTRY')
  
  const userInputLower = userInput.toLowerCase()
  
  // Check if user made a selection from the options
  const hasSelection = /^(all|both|1|2|3|first|second|third|one|two|three|option 1|option 2|option 3|all of them|all three|the first|the second|the third)$/i.test(userInput.trim()) ||
                       /^(1\s*and\s*2|1\s*and\s*3|2\s*and\s*3|1\s*,\s*2|1\s*,\s*3|2\s*,\s*3)$/i.test(userInput.trim())
  
  const substantiveThreshold = patterns.find(p => p.pattern_type === 'substantive_response_length')?.threshold_value || 20
  const hasSubstantiveResponse = userInput.trim().length > substantiveThreshold
  
  console.log('PHASE 6 OPTIONS SELECTION CHECK:', { 
    hasSelection,
    hasSubstantiveResponse,
    userInputLength: userInput.trim().length,
    userEngaged,
    aiResponded,
    aiAskedQuestion: aiResponse.trim().endsWith('?'),
    userInputSample: userInput.substring(0, 50)
  })

  // If AI asks a question, stay in phase for user to respond
  if (aiResponse.trim().endsWith('?')) {
    console.log('PHASE 6 STAYING - AI asked a question, waiting for user response')
    return new Response(
      JSON.stringify({
        shouldAdvance: false,
        reason: 'ai_asked_question',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  // If user made a clear selection, advance to Phase 7
  if (hasSelection && userEngaged && aiResponded) {
    console.log('PHASE 6 ADVANCING TRUE - User made a clear selection from options')
    return new Response(
      JSON.stringify({
        shouldAdvance: true,
        reason: 'option_selected',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  // If user provided substantial response about their ideas but hasn't selected yet, stay in phase
  if (hasSubstantiveResponse && userEngaged && aiResponded) {
    console.log('PHASE 6 STAYING - User provided ideas but has not selected options yet')
    return new Response(
      JSON.stringify({
        shouldAdvance: false,
        reason: 'ideas_provided_awaiting_selection',
        confidence: 0.8
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  console.log('PHASE 6 NOT ADVANCING - insufficient response or no selection made')
  return new Response(
    JSON.stringify({
      shouldAdvance: false,
      reason: 'phase6_incomplete',
      confidence: 0.7
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}

// General phase completion logic (phases 4, 7)
async function checkGeneralPhaseCompletion(
  userInput: string,
  aiResponse: string,
  patterns: CompletionPattern[],
  conversationHistory: any[],
  currentPhase: number,
  userEngaged: boolean,
  aiResponded: boolean
) {
  console.log(`${currentPhase}️⃣ GENERAL PHASE FUNCTION ENTRY`)
  
  const substantiveThreshold = patterns.find(p => p.pattern_type === 'substantive_response_length')?.threshold_value || 20
  const hasSubstantiveResponse = userInput.trim().length > substantiveThreshold
  const answeredTheQuestion = userInput.trim().length > 10 // User provided some answer

  console.log(`PHASE ${currentPhase} PERSPECTIVE CHECK:`, { 
    userInputLength: userInput.trim().length,
    hasSubstantiveResponse,
    answeredTheQuestion, 
    userEngaged,
    aiResponded,
    aiAskedQuestion: aiResponse.trim().endsWith('?')
  })

  // If AI asks a question, stay in phase for user to respond
  if (aiResponse.trim().endsWith('?')) {
    console.log(`PHASE ${currentPhase} STAYING - AI asked a question, waiting for user response`)
    return new Response(
      JSON.stringify({
        shouldAdvance: false,
        reason: 'ai_asked_question',
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  // If user provided substantial response and AI didn't ask another question, advance
  if (hasSubstantiveResponse && userEngaged && aiResponded) {
    console.log(`PHASE ${currentPhase} ADVANCING TRUE - Substantial response and AI not asking more`)
    return new Response(
      JSON.stringify({
        shouldAdvance: true,
        reason: `substantial_phase${currentPhase}_response`,
        confidence: 0.9
      }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    )
  }

  console.log(`PHASE ${currentPhase} NOT ADVANCING - checking fallback`)

  // Fallback: Basic completion if user engaged but didn't meet substantial threshold
  const shouldAdvance = userEngaged && aiResponded && answeredTheQuestion
  
  console.log(`PHASE ${currentPhase} FINAL DECISION:`, { 
    shouldAdvance,
    reason: shouldAdvance ? `basic_phase${currentPhase}_response` : `insufficient_phase${currentPhase}_response`
  })

  return new Response(
    JSON.stringify({
      shouldAdvance,
      reason: shouldAdvance ? `basic_phase${currentPhase}_response` : `insufficient_phase${currentPhase}_response`,
      confidence: 0.7
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  )
}
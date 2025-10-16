/**
 * BeAligned Flow Engine v3 (chat-v3)
 *
 * Database-driven, vector-enhanced reflection engine with full 7-phase support.
 *
 * Key Features:
 * - DB-driven configuration via flow_config table
 * - Semantic retrieval from v3_vector schema (approved content only)
 * - Steward-based content boosting (Trina +15%, admin +8%)
 * - Phase 7: Integration and co-creation with Deep Think Mode
 * - Governance-driven with retrieval as assistive context only
 * - Full tracing with retrieval provenance
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadAndValidateVersion } from '../shared/validation/index.ts'
import { loadFlowConfig, canAdvance, shouldForceAdvance, getNextSubstate, type PhaseCfg } from '../shared/flow/config.ts'
import {
  shouldEnterDeepThink,
  determinePhase7Decision,
  extractUserLanguage,
  generateContainmentMessage,
  type Phase7Substate,
  type Phase7Signals,
  type Phase7Context
} from '../shared/flow/phase7.ts'
import {
  detectClosure,
  detectFeelingNamed,
  hasRecentChildImpactCue,
  needsPhaseBridge,
  shouldOfferChildImpactNudge
} from '../shared/flow/context.ts'
import {
  compose,
  extractChildName,
  extractLastFeeling,
  type FlowSnippet,
  type ComposerContext
} from '../shared/flow/composer.ts'
import { composeSystemPrompt as composeGovernancePrompt } from '../shared/governance/systemPrompt.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

/**
 * Phase label and emoji mapping
 */
function phaseToLabel(p: string): string {
  const map: Record<string, string> = {
    issue: "🌿 Phase 1 · Let's Name It",
    feelings: "🌊 Phase 2 · What's Beneath That",
    why: "🌞 Phase 3 · Why This Matters",
    perspective: "🌤️ Phase 4 · Perspective",
    options: "🍃 Phase 5 · Options",
    choose: "🌱 Phase 6 · Choose",
    message: "🕊️ Phase 7 · Expression"
  }
  return map[p] ?? `Phase · ${p}`
}

const phaseEmojiMap: Record<string, string> = {
  issue: "🌿",
  feelings: "🌊",
  why: "🌞",
  perspective: "🌤️",
  options: "🍃",
  choose: "🌱",
  message: "🕊️"
}

/**
 * Calculate light boost score for flow snippet
 */
function calculateScore(item: any, ctx: { phase: string; userSaidClosure?: boolean }): number {
  let s = item.similarity_score || 0.5  // Base semantic score
  s += (item.weight ?? 1) * 0.02  // Weight boost

  // Steward boost
  if (item.steward === 'Trina') s += 0.15
  else if (item.steward === 'admin') s += 0.08

  // Phase match boost
  if (item.phase === ctx.phase) s += 0.10

  // Context boosts
  if (ctx.userSaidClosure && item.tags?.includes('containment')) s += 0.10
  if (ctx.phase === 'feelings' && item.tags?.includes('phase_transition')) s += 0.06
  if (item.tags?.includes('coaching')) s += 0.08

  // Phase 6 (choose) kind boosts - prioritize invitation-style over directives
  if (ctx.phase === 'choose' && item.kind) {
    if (item.kind === 'why_recap') s += 0.12     // Prioritize three-why recap
    if (item.kind === 'option_invite') s += 0.08  // Prioritize invitation over task
    if (item.kind === 'bridge') s += 0.06
    if (item.kind === 'lens_tie') s += 0.06
    if (item.kind === 'reengage') s += 0.06
    if (item.kind === 'confirm_why') s += 0.05
  }

  // Phase 7 (message) kind boosts - prioritize user's own language
  if (ctx.phase === 'message' && item.kind) {
    if (item.kind === 'coauthor_seed') s += 0.10  // Prefer user's own language
    if (item.kind === 'clear_frame') s += 0.05    // Only after a seed exists
    if (item.kind === 'contain') s += 0.04
    if (item.kind === 'collect') s += 0.06        // When vars missing
  }

  return s
}

/**
 * Retrieval result from vector database
 */
interface RetrievalResult {
  id: string
  content: string
  score: number
  source: 'principles' | 'flows' | 'exemplars'
  steward?: string
  status?: string
  phase?: string
  tags?: string[]
}

/**
 * Retrieve relevant context from v3_vector schema
 *
 * Filters to status='approved' only and boosts by steward.
 *
 * @param supabase - Supabase client
 * @param userText - User's input text
 * @param phase - Current phase
 * @param tags - Additional tags to filter by
 * @param k - Number of results to retrieve
 * @returns Array of approved content snippets, ranked by boosted score
 */
async function retrieveContext(
  supabase: any,
  userText: string,
  phase: string,
  tags: string[] = [],
  k: number = 5
): Promise<RetrievalResult[]> {
  // Check if retrieval is enabled
  const retrievalEnabled = Deno.env.get('RETRIEVAL_ENABLED') !== 'false'

  if (!retrievalEnabled) {
    console.log('⚠️ Retrieval disabled via RETRIEVAL_ENABLED=false')
    return []
  }

  console.log(`🔍 Retrieval: phase=${phase}, tags=${tags.join(',')}, k=${k}`)

  // For now, return placeholder results
  // In production, this would:
  // 1. Generate embedding for userText using OpenAI
  // 2. Query v3_vector.search_all() RPC with semantic search
  // 3. Filter results to status='approved'
  // 4. Boost scores by steward and phase match
  // 5. Return top-k results

  // Placeholder: Return empty for now
  // Real implementation would call:
  //   const { data } = await supabase.rpc('v3_vector_search', {
  //     query_embedding: embedding,
  //     phase_filter: phase,
  //     tag_filters: tags,
  //     k_limit: k * 3  // Get more, then filter and boost
  //   })

  return []
}

/**
 * Detect emotional intensity from user input
 * Returns 0.0-1.0 score based on emotional language
 */
function detectEmotionalIntensity(userInput: string): number {
  if (!userInput) return 0

  const lower = userInput.toLowerCase()

  // High-intensity emotional words
  const highIntensity = [
    'devastated', 'traumatized', 'crushed', 'destroyed', 'unbearable',
    'horrible', 'terrible', 'awful', 'heartbroken', 'shattered'
  ]

  // Medium-intensity emotional words
  const mediumIntensity = [
    'hurt', 'hurts', 'pain', 'painful', 'sad', 'worry', 'worried',
    'anxious', 'scared', 'afraid', 'angry', 'frustrated', 'upset'
  ]

  // Count matches
  let score = 0.0

  for (const word of highIntensity) {
    if (lower.includes(word)) score += 0.4
  }

  for (const word of mediumIntensity) {
    if (lower.includes(word)) score += 0.2
  }

  return Math.min(1.0, score)  // Cap at 1.0
}

/**
 * Filter retrieved results to approved only and boost by steward + phase + coaching + refinement tags
 */
function filterAndBoostResults(
  results: RetrievalResult[],
  currentPhase: string,
  userSaidClosure: boolean = false,
  userInput?: string
): RetrievalResult[] {
  // Filter to approved status only
  const approved = results.filter(r => r.status === 'approved')

  // Detect boundary phrases ("no", "not now", "I'm good")
  const userSetBoundary = userInput && userInput.trim().toLowerCase().match(/^(no|not now|i'?m good)\b/)

  // Detect emotional intensity
  const emotionalIntensity = userInput ? detectEmotionalIntensity(userInput) : 0

  // Boost scores based on steward, phase match, coaching feedback, and new refinement tags
  const boosted = approved.map(r => {
    let bonus = 0

    // Steward boost
    if (r.steward === 'Trina') bonus += 0.15
    else if (r.steward === 'admin') bonus += 0.08

    // Phase match boost
    if (r.phase === currentPhase) bonus += 0.10

    // Coaching feedback boost - prioritize real-world feedback
    if (r.tags && r.tags.includes('coaching')) {
      bonus += 0.08
      console.log(`📚 Coaching boost applied: ${r.id.substring(0, 8)}...`)
    }

    // NEW: Containment boost when user signals closure
    if (userSaidClosure && r.tags && r.tags.includes('containment')) {
      bonus += 0.10
      console.log(`🔒 Containment boost applied: ${r.id.substring(0, 8)}...`)
    }

    // NEW: Boundary containment boost when user declines exploration
    if (userSetBoundary && r.tags && r.tags.includes('containment')) {
      bonus += 0.15
      console.log(`🛑 Boundary containment boost applied: ${r.id.substring(0, 8)}...`)
    }

    // NEW: Emotional intensity containment boost
    if (emotionalIntensity >= 0.75 && r.tags && r.tags.includes('containment')) {
      bonus += 0.10
      console.log(`💔 Emotional intensity containment boost applied: ${r.id.substring(0, 8)}... (intensity: ${emotionalIntensity.toFixed(2)})`)
    }

    // NEW: Phase transition bridge boost when moving issue → feelings
    if (currentPhase === 'feelings' && r.tags && r.tags.includes('phase_transition')) {
      bonus += 0.06
      console.log(`🌉 Phase transition boost applied: ${r.id.substring(0, 8)}...`)
    }

    return {
      ...r,
      score: r.score + bonus,
      originalScore: r.score
    }
  })

  // Sort by boosted score
  return boosted.sort((a, b) => b.score - a.score)
}

/**
 * Compose system prompt with governance and retrieved context
 * Now uses the shared governance module
 */
function composeSystemPrompt(
  phase: string,
  phaseCfg: PhaseCfg,
  retrievedContext: RetrievalResult[]
): string {
  return composeGovernancePrompt(
    {
      phase,
      substate: phaseCfg.substate_order?.[0],
      substateOrder: phaseCfg.substate_order
    },
    retrievedContext
  )
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

    const body = await req.json()
    const {
      userInput,
      currentPhase,
      flowState,
      sessionId,
      chatVersion,
      model,
      temperature,
      max_tokens
    } = body

    // Load version config and validate parameters
    const { versionConfig, validatedParams } = await loadAndValidateVersion(
      chatVersion || 3,
      { model, temperature, max_tokens },
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🔒 Backend validation:', {
      version: versionConfig.version,
      validatedParams
    })

    // Load flow configuration from database
    const flowCfg = await loadFlowConfig(supabaseClient)

    // Map currentPhase to config key (handle both formats)
    const phaseKey = currentPhase.startsWith('phase_')
      ? currentPhase.replace('phase_', ['issue', 'feelings', 'why', 'perspective', 'options', 'choose', 'message'][parseInt(currentPhase.split('_')[1]) - 1] || 'issue')
      : currentPhase

    const phaseCfg = flowCfg[phaseKey]

    if (!phaseCfg) {
      throw new Error(`Unknown phase: ${phaseKey}`)
    }

    if (!phaseCfg.enabled) {
      throw new Error(`Phase ${phaseKey} is currently disabled`)
    }

    console.log(`🌊 Flow Engine v3 - Phase: ${phaseKey} (readiness threshold: ${phaseCfg.min_readiness_to_advance})`)

    // Track reprompt count
    const repromptCount = flowState?.repromptCount || 0

    // ==================================================================
    // PHASE 7 SPECIAL HANDLING (Keep existing Phase 7 logic)
    // ==================================================================

    // Track previous phase for change detection
    const prevPhase = flowState?.phase || null

    if (phaseKey === 'message') {
      const phase7State = flowState?.phase7 as Phase7Context || {}
      const substate: Phase7Substate = (flowState?.substate as Phase7Substate) || 'integrate'

      console.log(`🎨 Phase 7 substate: ${substate}`)

      // Extract user's language from earlier phases
      if (!phase7State.userLanguage) {
        phase7State.userLanguage = extractUserLanguage(flowState?.context || {})
      }

      // Retrieval with Phase 7 filters
      const tags = ['phase7', phaseKey]
      if (substate) tags.push(substate)

      const retrieved = await retrieveContext(
        supabaseClient,
        userInput,
        phaseKey,
        tags,
        5
      )

      const curated = filterAndBoostResults(retrieved, phaseKey, false, userInput)

      console.log(`📚 Retrieved ${curated.length} approved items for Phase 7`)

      // Analyze signals for Deep Think Mode
      const signals: Phase7Signals = {
        emotionLevel: flowState?.emotionLevel || 0,
        complexity: flowState?.complexity || 0
      }

      // Deep Think Mode hook
      if (substate === 'option' && phaseCfg.allow_deepthink && shouldEnterDeepThink(signals)) {
        console.log('🤔 High emotion/complexity detected - offering Deep Think Mode')

        const userChoseDeepThink = userInput.toLowerCase().includes('deep think') ||
          userInput.toLowerCase().includes('pause') ||
          userInput.toLowerCase().includes('human insight')

        if (userChoseDeepThink) {
          await supabaseClient.from('aligned_insights_queue').insert({
            session_id: sessionId,
            due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            payload: {
              reason: 'phase7_deepthink',
              snapshot: flowState,
              userInput
            }
          })

          console.log('⏸️ Deep Think Mode activated - session paused')

          const phase_changed = prevPhase && prevPhase !== phaseKey

          const response = {
            content: generateContainmentMessage({ chosenOption: 'deepthink' }),
            phase: phaseKey,
            current_phase: phaseKey,
            substate: 'deepthink',
            phase_label: phaseToLabel(phaseKey),
            phase_emoji: phaseEmojiMap[phaseKey] ?? "❖",
            phase_changed,
            next_phase_hint: null,
            mode: 'deepthink_pending',
            decision: 'offer_deepthink',
            phase_advanced: false,
            retrieved_ids: curated.map(r => ({
              source: r.source,
              id: r.id,
              score: r.score,
              steward: r.steward,
              status: r.status
            }))
          }

          await supabaseClient.from('conversation_traces').insert({
            session_id: sessionId,
            turn_index: flowState?.conversationHistory?.length || 0,
            phase: phaseKey,
            substate: 'deepthink',
            phase_emoji: phaseEmojiMap[phaseKey] ?? null,
            user_input: userInput,
            ai_response: response.content,
            decision: 'offer_deepthink',
            retrieved_ids: response.retrieved_ids,
            model: validatedParams.model,
            temperature: validatedParams.temperature,
            max_output_tokens: validatedParams.max_tokens
          })

          return new Response(
            JSON.stringify(response),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }

        // Offer Deep Think option
        const offerMessage = "This feels important and complex. I can offer three paths:\n\n" +
          "1. **Outward**: Co-create a listener-ready message for your co-parent or child\n" +
          "2. **Inward**: Develop a personal mantra or anchor for yourself\n" +
          "3. **Deep Think**: Pause for 48 hours and receive a human-crafted Aligned Insight\n\n" +
          "Which feels right for you?"

        const phase_changed = prevPhase && prevPhase !== phaseKey

        const response = {
          content: offerMessage,
          phase: phaseKey,
          current_phase: phaseKey,
          substate: 'option',
          phase_label: phaseToLabel(phaseKey),
          phase_emoji: phaseEmojiMap[phaseKey] ?? "❖",
          phase_changed,
          next_phase_hint: null,
          decision: 'offer_deepthink',
          phase_advanced: false,
          retrieved_ids: curated.map(r => ({
            source: r.source,
            id: r.id,
            score: r.score,
            steward: r.steward,
            status: r.status
          }))
        }

        await supabaseClient.from('conversation_traces').insert({
          session_id: sessionId,
          turn_index: flowState?.conversationHistory?.length || 0,
          phase: phaseKey,
          substate: 'option',
          phase_emoji: phaseEmojiMap[phaseKey] ?? null,
          user_input: userInput,
          ai_response: response.content,
          decision: 'offer_deepthink',
          retrieved_ids: response.retrieved_ids,
          model: validatedParams.model,
          temperature: validatedParams.temperature,
          max_output_tokens: validatedParams.max_tokens
        })

        return new Response(
          JSON.stringify(response),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Compose system prompt for Phase 7
      const systemPrompt = composeSystemPrompt(phaseKey, phaseCfg, curated)

      // Call OpenAI
      console.log('🤖 Calling OpenAI for Phase 7 co-creation...')

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: validatedParams.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...((flowState?.conversationHistory || []).map((msg: any) => ({
              role: msg.role,
              content: msg.content
            }))),
            { role: 'user', content: userInput }
          ],
          temperature: validatedParams.temperature,
          max_tokens: validatedParams.max_tokens,
          response_format: { type: "json_object" }
        })
      })

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`)
      }

      const openaiData = await openaiResponse.json()
      const rawResponse = openaiData.choices[0]?.message?.content || '{}'

      let aiResponse
      try {
        aiResponse = JSON.parse(rawResponse)
      } catch (e) {
        console.error('Failed to parse AI response:', e)
        aiResponse = {
          content: "Let's continue...",
          readiness: 0.5
        }
      }

      // Determine next substate
      const nextSubstate = getNextSubstate(substate, phaseCfg)

      // Check if Phase 7 is complete (all substates done)
      const phase7Complete = !nextSubstate
      const targetPhase = phase7Complete ? phaseCfg.next_phase : phaseKey
      const phase_changed = phase7Complete && prevPhase !== targetPhase

      const response = {
        content: aiResponse.content || '',
        phase: phaseKey,
        current_phase: targetPhase,
        substate: nextSubstate,
        phase_label: phaseToLabel(targetPhase),
        phase_emoji: phaseEmojiMap[targetPhase] ?? "❖",
        phase_changed,
        next_phase_hint: phase7Complete ? null : phaseCfg.next_phase,
        phase_advanced: phase7Complete,
        readiness: aiResponse.readiness || 0.8,
        signals: aiResponse.signals || {},
        retrieved_ids: curated.map(r => ({
          source: r.source,
          id: r.id,
          score: r.score,
          steward: r.steward,
          status: r.status
        })),
        flow_state: {
          ...flowState,
          phase: targetPhase,
          substate: nextSubstate,
          phase7: {
            ...phase7State,
            lastSubstate: substate
          }
        }
      }

      await supabaseClient.from('conversation_traces').insert({
        session_id: sessionId,
        turn_index: flowState?.conversationHistory?.length || 0,
        phase: phaseKey,
        substate,
        phase_emoji: phaseEmojiMap[phaseKey] ?? null,
        user_input: userInput,
        ai_response: response.content,
        readiness: response.readiness,
        phase_advanced: phase7Complete,
        next_phase: phase7Complete ? phaseCfg.next_phase : phaseKey,
        retrieved_ids: response.retrieved_ids,
        model: validatedParams.model,
        temperature: validatedParams.temperature,
        max_output_tokens: validatedParams.max_tokens,
        metadata: {
          signals,
          phase7_context: phase7State
        }
      })

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // ==================================================================
    // PHASES 1-6 HANDLING - DATA-DRIVEN
    // ==================================================================

    // Detect context signals
    const userSaidClosure = phaseKey === 'issue' ? detectClosure(userInput) : false
    const feelingNamed = phaseKey === 'feelings' ? detectFeelingNamed(userInput) : false
    const hasRecentChildCue = phaseKey === 'feelings' ? hasRecentChildImpactCue(
      flowState?.conversationHistory || [],
      3
    ) : false
    const needsBridge = needsPhaseBridge(phaseKey, prevPhase)
    const needsNudge = shouldOfferChildImpactNudge(
      phaseKey,
      feelingNamed,
      flowState?.readiness || 0,
      hasRecentChildCue
    )

    console.log(`🎯 Context: closure=${userSaidClosure}, feelingNamed=${feelingNamed}, needsBridge=${needsBridge}, needsNudge=${needsNudge}`)

    // Single retrieval call - get all flow snippets
    // The retrieval function should query v3_vector.flows with kind, phase, tags filters
    // For now, we'll construct a mock response showing the structure
    // In production, this would call: await supabase.rpc('v3_flows_search', {...})

    const retrievedFlows: FlowSnippet[] = []  // Placeholder - needs actual retrieval implementation

    // TODO: Implement actual retrieval from v3_vector.flows
    // const { data: flowsData } = await supabaseClient
    //   .from('v3_vector.flows')
    //   .select('*')
    //   .eq('status', 'approved')
    //   .eq('phase', phaseKey)
    //   .or(`kind.in.(ack,bridge,contain,prompt,nudge)`)
    //
    // Convert to FlowSnippet format and apply light boosts
    // const retrievedFlows = flowsData.map(item => ({
    //   id: item.id,
    //   content: item.content,
    //   kind: item.kind,
    //   phase: item.phase,
    //   weight: item.weight,
    //   vars: item.vars,
    //   tags: item.tags,
    //   steward: item.steward,
    //   score: calculateScore(item, {phase: phaseKey, userSaidClosure})
    // }))

    // Compose response from retrieved snippets
    const composerContext: ComposerContext = {
      phase: phaseKey,
      userSaidClosure,
      needsBridge,
      needsNudge,
      childName: extractChildName(flowState),
      lastFeelingNamed: extractLastFeeling(flowState)
    }

    const composed = compose(retrievedFlows, composerContext)

    console.log(`📝 Composed from snippets:`, composed.snippets_used)

    // If we have composed content from DB, use it directly as the response
    if (composed.content && composed.content.length > 10) {
      // We have a data-driven response - calculate readiness and return

      // Simple readiness calculation based on context
      let readiness = flowState?.readiness || 0.3
      if (userSaidClosure) readiness = Math.max(readiness, 0.8)
      if (feelingNamed) readiness = Math.min(1.0, readiness + 0.15)

      const forceAdvance = shouldForceAdvance(repromptCount, phaseCfg)
      const phaseAdvanced = canAdvance(readiness, phaseCfg) || forceAdvance
      const nextPhase = phaseAdvanced ? phaseCfg.next_phase : phaseKey
      const phase_changed = prevPhase && prevPhase !== nextPhase

      const response = {
        content: composed.content,
        phase: phaseKey,
        current_phase: nextPhase,
        phase_label: phaseToLabel(nextPhase),
        phase_emoji: phaseEmojiMap[nextPhase] ?? "❖",
        phase_changed,
        next_phase_hint: phaseAdvanced ? null : phaseCfg.next_phase,
        phase_advanced: phaseAdvanced,
        readiness,
        signals: {},
        force_advanced: forceAdvance,
        retrieved_ids: [],
        flow_state: {
          ...flowState,
          phase: nextPhase,
          readiness,
          repromptCount: phaseAdvanced ? 0 : repromptCount + 1
        }
      }

      // Write trace with snippet usage
      await supabaseClient.from('conversation_traces').insert({
        session_id: sessionId,
        turn_index: flowState?.conversationHistory?.length || 0,
        phase: phaseKey,
        phase_emoji: phaseEmojiMap[phaseKey] ?? null,
        user_input: userInput,
        ai_response: response.content,
        readiness,
        phase_advanced: phaseAdvanced,
        next_phase: nextPhase,
        force_advanced: forceAdvance,
        reprompt_count: repromptCount,
        decision: userSaidClosure ? 'contain' : (phaseAdvanced ? 'advance' : 'stay'),
        retrieved_ids: [],
        model: 'data-driven',
        metadata: {
          data_driven: true,
          snippets_used: composed.snippets_used,
          user_said_closure: userSaidClosure,
          feeling_named: feelingNamed,
          child_impact_nudged: needsNudge
        }
      })

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // FALLBACK: If no composed content from DB, fall back to AI generation
    // (This path should rarely execute once DB is populated)
    console.log('⚠️ Fallback to AI generation - DB content insufficient')

    // Retrieval with phase-specific tags
    const tags = [phaseKey, `phase${phaseKey}`]
    const retrieved = await retrieveContext(
      supabaseClient,
      userInput,
      phaseKey,
      tags,
      5
    )

    const curated = filterAndBoostResults(retrieved, phaseKey, userSaidClosure, userInput)

    console.log(`📚 Retrieved ${curated.length} approved items for ${phaseKey}`)

    // Compose system prompt
    const systemPrompt = composeSystemPrompt(phaseKey, phaseCfg, curated)

    // Call OpenAI
    console.log('🤖 Calling OpenAI...')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: validatedParams.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...((flowState?.conversationHistory || []).map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))),
          { role: 'user', content: userInput }
        ],
        temperature: validatedParams.temperature,
        max_tokens: validatedParams.max_tokens,
        response_format: { type: "json_object" }
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const rawResponse = openaiData.choices[0]?.message?.content || '{}'

    let aiResponse
    try {
      aiResponse = JSON.parse(rawResponse)
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      aiResponse = {
        content: "Let's continue exploring this together...",
        readiness: 0.3
      }
    }

    // Determine phase advancement
    const readiness = aiResponse.readiness || 0.0
    const forceAdvance = shouldForceAdvance(repromptCount, phaseCfg)
    const phaseAdvanced = canAdvance(readiness, phaseCfg) || forceAdvance

    const nextPhase = phaseAdvanced ? phaseCfg.next_phase : phaseKey
    const phase_changed = phaseAdvanced && prevPhase !== nextPhase

    console.log(`📊 Readiness: ${readiness.toFixed(2)} | Threshold: ${phaseCfg.min_readiness_to_advance} | Reprompts: ${repromptCount}/${phaseCfg.max_reprompts}`)
    console.log(`${phaseAdvanced ? '✅ Advancing' : '⏸️ Staying'} | Next: ${nextPhase}`)

    const response = {
      content: aiResponse.content || '',
      phase: phaseKey,
      current_phase: nextPhase,
      phase_label: phaseToLabel(nextPhase),
      phase_emoji: phaseEmojiMap[nextPhase] ?? "❖",
      phase_changed,
      next_phase_hint: phaseAdvanced ? null : phaseCfg.next_phase,
      phase_advanced: phaseAdvanced,
      readiness,
      signals: aiResponse.signals || {},
      force_advanced: forceAdvance,
      retrieved_ids: curated.map(r => ({
        source: r.source,
        id: r.id,
        score: r.score,
        steward: r.steward,
        status: r.status
      })),
      flow_state: {
        ...flowState,
        phase: nextPhase,
        readiness,
        repromptCount: phaseAdvanced ? 0 : repromptCount + 1
      }
    }

    // Write trace
    await supabaseClient.from('conversation_traces').insert({
      session_id: sessionId,
      turn_index: flowState?.conversationHistory?.length || 0,
      phase: phaseKey,
      phase_emoji: phaseEmojiMap[phaseKey] ?? null,
      user_input: userInput,
      ai_response: response.content,
      readiness,
      phase_advanced: phaseAdvanced,
      next_phase: nextPhase,
      force_advanced: forceAdvance,
      reprompt_count: repromptCount,
      retrieved_ids: response.retrieved_ids,
      model: validatedParams.model,
      temperature: validatedParams.temperature,
      max_output_tokens: validatedParams.max_tokens,
      metadata: {
        signals: aiResponse.signals,
        config_used: {
          min_readiness: phaseCfg.min_readiness_to_advance,
          max_reprompts: phaseCfg.max_reprompts
        },
        user_said_closure: userSaidClosure || false,
        feeling_named: feelingNamed || false
      }
    })

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in flow engine v3:', error)

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

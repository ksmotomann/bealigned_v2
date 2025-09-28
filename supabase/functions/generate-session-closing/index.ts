// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SessionClosingRequest {
  sessionContext: {
    sessionId?: string
    currentPhase: number
    emotionalJourney: string[] // e.g., ['overwhelmed', 'clarity', 'empowered']
    keyInsights: string[]
    userWhy?: string
    coparentDynamic?: 'high_conflict' | 'cooperative' | 'parallel' | 'disengaged'
    childrenAges?: string[]
    communicationNeeded?: boolean
    hasBoundaryIssues?: boolean
    hasBreakthrough?: boolean
  }
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    metadata?: any
  }>
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

    const { sessionContext, conversationHistory = [] } = 
      await req.json() as SessionClosingRequest

    console.log(`🎯 Session Closing Generation - Phase ${sessionContext.currentPhase}:`, {
      emotionalJourney: sessionContext.emotionalJourney,
      communicationNeeded: sessionContext.communicationNeeded,
      hasBreakthrough: sessionContext.hasBreakthrough
    })

    // Step 1: Determine appropriate closing types based on session context
    const closingTypes = await determineClosingTypes(sessionContext)
    console.log(`🎯 Determined closing types:`, closingTypes)

    // Step 2: Get matching content for each closing type
    const closingRecommendations = await getClosingContent(
      supabaseClient, 
      closingTypes, 
      sessionContext
    )

    // Step 3: Generate contextual content using AI
    const personalizedClosings = await generatePersonalizedClosings(
      closingRecommendations,
      sessionContext,
      conversationHistory
    )

    // Step 4: Log the selection for analytics
    if (sessionContext.sessionId && personalizedClosings.length > 0) {
      await logClosingSelection(
        supabaseClient,
        sessionContext.sessionId,
        personalizedClosings[0],
        sessionContext
      )
    }

    return new Response(
      JSON.stringify({
        sessionClosings: personalizedClosings,
        metadata: {
          closingTypesConsidered: closingTypes,
          recommendationsCount: closingRecommendations.length,
          phase: sessionContext.currentPhase
        }
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )

  } catch (error) {
    console.error('❌ Error in generate-session-closing:', error)
    
    return new Response(
      JSON.stringify({
        sessionClosings: [{
          type: 'closing_reflection',
          title: 'Thank You for Your Courage',
          content: `You've shown real courage today — naming what's hard, staying focused on what matters most for your children, and being willing to grow through challenge. That's the heart of aligned parenting.

💙 "Be strong and courageous" - Joshua 1:9`,
          confidence: 1.0
        }],
        error: error.message
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    )
  }
})

// Determine which types of closings are most appropriate based on session context
async function determineClosingTypes(sessionContext: any): Promise<string[]> {
  const types: string[] = []
  
  // Always include a closing reflection for acknowledgment
  types.push('closing_reflection')
  
  // Add closing summary if session was comprehensive (multiple phases covered)
  if (sessionContext.currentPhase >= 6 || sessionContext.keyInsights?.length > 2) {
    types.push('closing_summary')
  }
  
  // Add peace reminder if high conflict or emotional overwhelm
  if (sessionContext.coparentDynamic === 'high_conflict' || 
      sessionContext.emotionalJourney?.includes('overwhelmed') ||
      sessionContext.emotionalJourney?.includes('angry')) {
    types.push('peace_reminder')
  }
  
  // Add anchor statement if there was a breakthrough or major insight
  if (sessionContext.hasBreakthrough || sessionContext.userWhy) {
    types.push('anchor_statement')
  }
  
  // Add message draft if communication is needed
  if (sessionContext.communicationNeeded) {
    types.push('message_draft_clear')
  }
  
  return types
}

// Get content templates from database based on context
async function getClosingContent(
  supabase: any, 
  closingTypes: string[], 
  sessionContext: any
) {
  const recommendations = []
  
  for (const closingType of closingTypes) {
    const { data: content } = await supabase
      .from('session_closing_content')
      .select(`
        id,
        title,
        content_template,
        situation_tags,
        emotional_context
      `)
      .eq('closing_type_id', 
        `(SELECT id FROM session_closing_types WHERE closing_type = '${closingType}')`
      )
      .eq('is_active', true)
      .limit(2)

    if (content && content.length > 0) {
      // Score based on context match
      for (const item of content) {
        let score = 0.5 // Base score
        
        // Boost score for emotional context match
        const currentEmotion = sessionContext.emotionalJourney?.slice(-1)[0]
        if (currentEmotion && item.emotional_context?.includes(currentEmotion)) {
          score += 0.3
        }
        
        // Boost for dynamic match
        if (item.situation_tags?.includes(sessionContext.coparentDynamic)) {
          score += 0.2
        }
        
        recommendations.push({
          ...item,
          closingType,
          relevanceScore: score
        })
      }
    }
  }
  
  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3)
}

// Generate personalized content using AI
async function generatePersonalizedClosings(
  recommendations: any[],
  sessionContext: any,
  conversationHistory: any[]
) {
  const personalizedClosings = []
  
  for (const recommendation of recommendations) {
    try {
      // Create context-aware prompt for personalization
      const personalizationPrompt = `
Based on this session context:
- Current phase: ${sessionContext.currentPhase}
- Emotional journey: ${sessionContext.emotionalJourney?.join(' → ')}
- Key insights: ${sessionContext.keyInsights?.join('; ')}
- Co-parent dynamic: ${sessionContext.coparentDynamic}

Personalize this ${recommendation.closingType} template while maintaining its core structure and BeAligned tone:

${recommendation.content_template}

Guidelines:
- Keep the core message and structure intact
- Make it specific to their situation where {placeholders} exist  
- Maintain the empowering, grounded tone
- Include Jacob's courage theme subtly if appropriate
- Be concise and impactful
`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are BeAligned AI, helping create meaningful session closings that honor courage, growth, and child-centered wisdom.' },
            { role: 'user', content: personalizationPrompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      })

      if (response.ok) {
        const data = await response.json()
        personalizedClosings.push({
          type: recommendation.closingType,
          title: recommendation.title,
          content: data.choices[0].message.content,
          confidence: recommendation.relevanceScore
        })
      } else {
        // Fallback to template if AI fails
        personalizedClosings.push({
          type: recommendation.closingType,
          title: recommendation.title,
          content: recommendation.content_template,
          confidence: recommendation.relevanceScore * 0.8
        })
      }
    } catch (error) {
      console.error(`Error personalizing ${recommendation.closingType}:`, error)
      // Use template as fallback
      personalizedClosings.push({
        type: recommendation.closingType,
        title: recommendation.title,
        content: recommendation.content_template,
        confidence: recommendation.relevanceScore * 0.7
      })
    }
  }
  
  return personalizedClosings
}

// Log closing selection for analytics
async function logClosingSelection(
  supabase: any,
  sessionId: string,
  selectedClosing: any,
  sessionContext: any
) {
  try {
    await supabase
      .from('session_closing_selections')
      .insert({
        session_id: sessionId,
        closing_type_id: `(SELECT id FROM session_closing_types WHERE closing_type = '${selectedClosing.type}')`,
        session_context: sessionContext,
        selected_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging closing selection:', error)
    // Non-critical error, don't fail the request
  }
}
// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminFeedbackRequest {
  sessionId: string
  adminUserId?: string
  feedbackType: 'missing_closing_type' | 'wrong_closing' | 'content_improvement' | 'new_closing_needed' | 'alternative_response'
  feedbackContent: string
  suggestedClosingType?: string
  suggestedContent?: string
  sessionContext: any
  messageContext?: any
  priorityLevel?: 'low' | 'medium' | 'high' | 'urgent'
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

    const feedbackRequest = await req.json() as AdminFeedbackRequest

    console.log('🎯 Processing admin feedback:', {
      sessionId: feedbackRequest.sessionId,
      feedbackType: feedbackRequest.feedbackType,
      suggestedType: feedbackRequest.suggestedClosingType
    })

    // Step 1: Store feedback in unified feedback table
    const { data: feedback, error: feedbackError } = await supabaseClient
      .from('unified_feedback')
      .insert({
        session_id: feedbackRequest.sessionId,
        feedback_type: feedbackRequest.feedbackType,
        feedback_value: 'neutral', // Admin feedback is treated as improvement suggestion
        feedback_text: feedbackRequest.feedbackContent,
        alternative_content: feedbackRequest.suggestedContent,
        session_context: feedbackRequest.sessionContext,
        message_context: feedbackRequest.messageContext || {
          messageType: 'admin_feedback',
          phase: feedbackRequest.sessionContext?.currentPhase || 1
        },
        source_type: 'admin',
        processed_at: new Date().toISOString(),
        actions_taken: {
          suggested_closing_type: feedbackRequest.suggestedClosingType,
          priority_level: feedbackRequest.priorityLevel || 'high'
        }
      })
      .select()
      .single()

    if (feedbackError) {
      throw new Error(`Failed to store feedback: ${feedbackError.message}`)
    }

    console.log('✅ Admin feedback stored with ID:', feedback.id)

    // Step 1.5: Check for phase progression commands in feedback
    const phaseProgressionResult = await handlePhaseProgressionFeedback(
      supabaseClient,
      feedbackRequest,
      feedback.id
    )

    // Step 2: Process feedback through vector learning system
    const vectorUpdateResult = await processVectorLearning(
      supabaseClient,
      feedbackRequest,
      feedback.id
    )

    // Step 3: Process feedback for immediate adaptive learning
    const adaptiveResult = await processAdaptiveLearning(
      supabaseClient, 
      feedback, 
      feedbackRequest
    )

    // Step 3: If this is a request for a new closing type, create it immediately
    if (feedbackRequest.feedbackType === 'new_closing_needed' && 
        feedbackRequest.suggestedClosingType) {
      await createAdaptiveClosingType(
        supabaseClient,
        feedbackRequest.suggestedClosingType,
        feedbackRequest.suggestedContent || '',
        feedback.id,
        feedbackRequest.sessionContext
      )
    }

    // Step 4: Generate corrected response if feedback is about the last AI message
    let correctedResponse = null
    const isAboutLastResponse = feedbackRequest.messageContext?.aiResponse && (
      feedbackRequest.feedbackContent.toLowerCase().includes('last') ||
      feedbackRequest.feedbackContent.toLowerCase().includes('previous') ||
      feedbackRequest.feedbackContent.toLowerCase().includes('this') ||
      feedbackRequest.feedbackContent.toLowerCase().includes('should') ||
      feedbackRequest.feedbackContent.toLowerCase().includes('instead') ||
      feedbackRequest.feedbackContent.toLowerCase().includes('better') ||
      feedbackRequest.feedbackContent.toLowerCase().includes('wrong') ||
      feedbackRequest.feedbackContent.toLowerCase().includes('replace') ||
      feedbackRequest.feedbackContent.toLowerCase().includes("didn't") ||
      feedbackRequest.feedbackContent.toLowerCase().includes("don't") ||
      feedbackRequest.feedbackContent.toLowerCase().includes("move") ||
      feedbackRequest.feedbackContent.toLowerCase().includes("prompt") ||
      feedbackRequest.feedbackContent.toLowerCase().includes("phase") ||
      feedbackRequest.feedbackContent.toLowerCase().includes("you")
    )

    if (isAboutLastResponse) {
      console.log('🔄 Generating corrected response based on admin feedback')
      correctedResponse = await generateCorrectedResponse(
        feedbackRequest.messageContext.userInput,
        feedbackRequest.messageContext.aiResponse,
        feedbackRequest.feedbackContent,
        feedbackRequest.sessionContext
      )
    }

    // Step 5: Generate immediate suggestions for similar future sessions
    const futureSuggestions = await generateFutureSuggestions(
      supabaseClient,
      feedbackRequest
    )

    // Build detailed acknowledgment message
    let acknowledgmentMessage = '✅ Admin feedback received and processed!\n\n'
    
    // Show specific planned actions
    const plannedActions = []
    
    if (vectorUpdateResult?.success) {
      plannedActions.push(`📊 Updated vector database with ${vectorUpdateResult.updateType} improvements`)
    }
    
    if (isAboutLastResponse && correctedResponse) {
      plannedActions.push('🔄 Generated corrected response to replace the last AI message')
    }
    
    if (adaptiveResult?.patternMatched) {
      plannedActions.push(`🎯 Applied learning pattern: ${adaptiveResult.patternMatched}`)
    } else {
      plannedActions.push('📝 Stored feedback for future learning pattern development')
    }
    
    acknowledgmentMessage += 'Immediate Actions Taken:\n' + plannedActions.map(action => `• ${action}`).join('\n')

    return new Response(
      JSON.stringify({
        success: true,
        feedbackId: feedback.id,
        vectorUpdateResult,
        adaptiveResult,
        futureSuggestions,
        correctedResponse,
        isAboutLastResponse,
        acknowledgmentMessage,
        message: acknowledgmentMessage,
        phaseProgression: phaseProgressionResult,
        immediateActions: [
          ...(vectorUpdateResult?.actionsExecuted || []),
          ...(adaptiveResult?.actionsExecuted || []),
          ...(correctedResponse ? ['Generated corrected response'] : [])
        ]
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )

  } catch (error) {
    console.error('❌ Error processing admin feedback:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
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

// Process vector learning from admin feedback
async function processVectorLearning(
  supabase: any,
  feedbackRequest: AdminFeedbackRequest,
  feedbackId: number
) {
  try {
    console.log('🔄 Processing admin feedback through vector learning system')
    
    // Determine update type based on feedback content and type
    let updateType = 'user_improvement'
    
    // Analyze feedback content for keywords that indicate the type of improvement needed
    const feedbackLower = feedbackRequest.feedbackContent.toLowerCase()
    
    if (feedbackLower.includes('blamed') || feedbackLower.includes('ashamed') || 
        feedbackLower.includes('judged') || feedbackLower.includes('criticized') ||
        feedbackLower.includes('guilt') || feedbackLower.includes('harsh') ||
        feedbackLower.includes('attacking') || feedbackLower.includes('shaming')) {
      updateType = 'emotional_harm_prevention' // Critical - causing emotional damage
    } else if (feedbackLower.includes('natural') || feedbackLower.includes('conversation') || 
               feedbackLower.includes('flow') || feedbackLower.includes('awkward') ||
               feedbackLower.includes('robotic') || feedbackLower.includes('tone')) {
      updateType = 'conversational_improvement'
    } else if (feedbackLower.includes('wrong') || feedbackLower.includes('inappropriate') ||
               feedbackLower.includes('doesn\'t match')) {
      updateType = 'negative_weighting'
    } else if (feedbackLower.includes('missing') || feedbackLower.includes('need') ||
               feedbackLower.includes('should have') || feedbackLower.includes('add')) {
      updateType = 'content_replacement'
    }
    
    // Override with explicit feedback type if provided
    switch (feedbackRequest.feedbackType) {
      case 'content_improvement':
      case 'alternative_response':
        updateType = 'user_improvement'
        break
      case 'wrong_closing':
        updateType = 'negative_weighting'
        break
      case 'new_closing_needed':
      case 'missing_closing_type':
        updateType = 'content_replacement'
        break
    }

    // Call the vector update Edge Function
    const vectorResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/update-vector-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalContent: feedbackRequest.messageContext?.aiResponse || 'Conversation context',
        improvedContent: feedbackRequest.suggestedContent || feedbackRequest.feedbackContent,
        feedbackType: 'admin_suggestion',
        context: {
          phase: feedbackRequest.sessionContext?.currentPhase || 1,
          messageType: updateType === 'emotional_harm_prevention' ? 'emotional_safety' : 
                      updateType === 'conversational_improvement' ? 'conversation_flow' : 'ai_response',
          userInput: feedbackRequest.messageContext?.userInput,
          sessionContext: {
            ...feedbackRequest.sessionContext,
            conversationFeedback: feedbackRequest.feedbackContent, // Store generic feedback
            isGenericFeedback: !feedbackRequest.messageContext?.aiResponse,
            isCriticalFeedback: updateType === 'emotional_harm_prevention'
          }
        },
        updateType: updateType,
        confidence: updateType === 'emotional_harm_prevention' ? 1.0 : 0.9 // Maximum confidence for emotional harm issues
      })
    })

    if (vectorResponse.ok) {
      const vectorResult = await vectorResponse.json()
      console.log('✅ Vector system updated successfully')
      
      return {
        success: true,
        actionsExecuted: vectorResult.actionsExecuted || ['Vector database updated'],
        confidence: 0.9,
        updateType: updateType
      }
    } else {
      console.warn('⚠️ Vector update failed, but continuing with other processing')
      return {
        success: false,
        error: 'Vector update failed but feedback was still processed',
        actionsExecuted: ['Feedback stored for manual vector processing']
      }
    }
  } catch (error) {
    console.error('Error in vector learning processing:', error)
    return {
      success: false,
      error: error.message,
      actionsExecuted: ['Feedback stored for manual vector processing']
    }
  }
}

// Process adaptive learning from feedback
async function processAdaptiveLearning(
  supabase: any, 
  feedback: any, 
  request: AdminFeedbackRequest
) {
  try {
    // Check for existing learning patterns
    const { data: patterns } = await supabase
      .from('feedback_learning_patterns')
      .select('*')

    let matchedPattern = null
    
    for (const pattern of patterns || []) {
      const triggers = pattern.trigger_conditions
      const keywords = triggers.keywords || []
      
      // Check if feedback content matches pattern keywords
      const hasMatchingKeyword = keywords.some((keyword: string) => 
        request.feedbackContent.toLowerCase().includes(keyword.toLowerCase())
      )
      
      if (hasMatchingKeyword) {
        matchedPattern = pattern
        break
      }
    }

    if (matchedPattern) {
      console.log('✅ Matched learning pattern:', matchedPattern.pattern_name)
      
      // Process the pattern's suggested actions
      const actions = matchedPattern.suggested_actions
      
      if (actions.create_type) {
        await createAdaptiveClosingType(
          supabase,
          actions.create_type,
          request.suggestedContent || generateDefaultContent(actions.create_type),
          feedback.id,
          request.sessionContext
        )
      }
      
      // Update pattern success rate
      await supabase
        .from('feedback_learning_patterns')
        .update({ 
          success_count: matchedPattern.success_count + 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', matchedPattern.id)
      
      return { 
        patternMatched: matchedPattern.pattern_name,
        actionsExecuted: actions
      }
    }
    
    return { 
      patternMatched: null,
      message: 'No existing pattern matched - feedback stored for manual review'
    }
    
  } catch (error) {
    console.error('Error in adaptive learning:', error)
    return { error: error.message }
  }
}

// Create new adaptive closing type
async function createAdaptiveClosingType(
  supabase: any,
  typeName: string,
  content: string,
  feedbackId: number,
  sessionContext: any
) {
  try {
    // Check if type already exists
    const { data: existingType } = await supabase
      .from('adaptive_closing_types')
      .select('id')
      .eq('generated_type_name', typeName)
      .single()

    if (existingType) {
      console.log('📝 Adaptive closing type already exists:', typeName)
      return existingType
    }

    // Create new adaptive closing type
    const { data: newType, error: typeError } = await supabase
      .from('adaptive_closing_types')
      .insert({
        generated_type_name: typeName,
        display_name: typeName.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: `Auto-generated closing type based on admin feedback`,
        origin_feedback_id: feedbackId,
        usage_contexts: extractUsageContexts(sessionContext),
        emotional_triggers: extractEmotionalTriggers(sessionContext),
        confidence_score: 0.8, // High confidence for admin-suggested types
        is_approved: true, // Auto-approve admin suggestions
        is_active: true,
        approved_at: new Date().toISOString()
      })
      .select()
      .single()

    if (typeError) {
      throw new Error(`Failed to create adaptive type: ${typeError.message}`)
    }

    console.log('✅ Created new adaptive closing type:', newType.generated_type_name)

    // Create content for the new type
    if (content) {
      const contentEmbedding = await generateEmbedding(content)
      
      await supabase
        .from('adaptive_closing_content')
        .insert({
          adaptive_type_id: newType.id,
          title: `Auto-Generated ${newType.display_name}`,
          content_template: content,
          generation_method: 'admin_provided',
          source_feedback_id: feedbackId,
          situation_tags: ['admin_suggested', 'adaptive'],
          emotional_context: extractEmotionalTriggers(sessionContext),
          embedding: contentEmbedding,
          is_active: true
        })
    }

    return newType
    
  } catch (error) {
    console.error('Error creating adaptive closing type:', error)
    throw error
  }
}

// Generate embedding for content
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    return new Array(1536).fill(0) // Return zero vector as fallback
  }
}

// Extract usage contexts from session
function extractUsageContexts(sessionContext: any): string[] {
  const contexts = ['adaptive', 'admin_suggested']
  
  if (sessionContext.communicationNeeded) contexts.push('communication_need')
  if (sessionContext.hasBoundaryIssues) contexts.push('boundary_setting')  
  if (sessionContext.coparentDynamic === 'high_conflict') contexts.push('high_conflict')
  
  return contexts
}

// Extract emotional triggers from session
function extractEmotionalTriggers(sessionContext: any): string[] {
  return sessionContext.emotionalJourney || ['supportive']
}

// Generate default content for common adaptive types
function generateDefaultContent(typeName: string): string {
  const templates = {
    'message_to_coparent': `***📩 Message to Co-Parent***

*Hi [Co-parent's Name],*

*I wanted to reach out about [situation]. I understand we may see this differently, and I respect your perspective.*

*My focus is on making sure [child's name] feels supported and has what they need. I believe [specific request/boundary] would help with that.*

*I'm open to discussing this further if you'd like. Thank you for considering it.*

*[Your Name]*`,

    'child_conversation_script': `***💝 What to Say to Your Child***

*"I know this situation with [parent/situation] might feel confusing or hard for you. It's okay to have all kinds of feelings about it.*

*What I want you to know is that both Mom and Dad love you very much, even when we have to figure out grown-up things separately.*

*You don't have to fix anything or choose sides. Your job is just to be a kid and know you're loved.*

*Is there anything you want to ask me or anything that would help you feel better?"*`,

    'boundary_reinforcement': `***🌿 Your Boundary Reminder***

*I don't have to justify my parenting decisions to anyone.*
*I can say no without providing extensive explanations.*
*My child's well-being comes before anyone's comfort with my boundaries.*
*I trust my instincts about what my child needs.*
*Setting boundaries is an act of love, not selfishness.*`
  }
  
  return templates[typeName] || `***Auto-generated content for ${typeName}***\n\nThis closing type was created based on admin feedback and needs content development.`
}

// Generate corrected response based on admin feedback
async function generateCorrectedResponse(
  userInput: string,
  originalAIResponse: string,
  adminFeedback: string,
  sessionContext: any
): Promise<string> {
  try {
    console.log('🤖 Generating corrected response using OpenAI')
    
    const correctionPrompt = `
You are a co-parenting support specialist helping to correct an AI response based on admin feedback.

ORIGINAL USER INPUT:
"${userInput}"

ORIGINAL AI RESPONSE:
"${originalAIResponse}"

ADMIN FEEDBACK:
"${adminFeedback}"

SESSION CONTEXT:
- Phase: ${sessionContext.currentPhase || 'Unknown'}
- Co-parent dynamic: ${sessionContext.coparentDynamic || 'Unknown'}

Please generate a corrected response that addresses the admin's feedback while maintaining:
1. A supportive, empathetic tone
2. BeH20 framework principles (strength-based, solution-focused)
3. Appropriate response length and structure for this conversation phase
4. Focus on the user's emotional needs and practical next steps

Return only the corrected response text, no explanations or meta-commentary.
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert co-parenting support specialist focused on generating emotionally safe, supportive responses.'
          },
          {
            role: 'user',
            content: correctionPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const correctedResponse = data.choices[0]?.message?.content?.trim()

    if (!correctedResponse) {
      throw new Error('No corrected response generated')
    }

    console.log('✅ Successfully generated corrected response')
    return correctedResponse

  } catch (error) {
    console.error('Error generating corrected response:', error)
    
    // Fallback: Generate a simple corrected response based on the feedback
    return `Thank you for sharing that with me. I understand this situation is challenging for you. Let me provide a more supportive response.

Based on your feedback, here's what I recommend: ${adminFeedback.includes('should') ? adminFeedback.split('should')[1] : 'focusing on what feels most supportive for you right now'}.

Remember, you're doing your best in a difficult situation, and every small step toward better co-parenting helps your child feel more secure.

What feels like the most manageable next step for you?`
  }
}

// Generate suggestions for future similar sessions
async function generateFutureSuggestions(
  supabase: any,
  request: AdminFeedbackRequest
) {
  // This could be enhanced to predict when similar sessions might benefit from the new closing type
  return {
    suggestedTriggers: extractUsageContexts(request.sessionContext),
    applicablePhases: [request.sessionContext.currentPhase],
    estimatedUsageFrequency: 'medium'
  }
}

// Handle phase progression commands in admin feedback
async function handlePhaseProgressionFeedback(
  supabaseClient: any, 
  feedbackRequest: AdminFeedbackRequest,
  feedbackId: string
) {
  try {
    const feedbackText = feedbackRequest.feedbackContent.toLowerCase()
    
    // Detect phase progression commands
    const phaseProgressionPatterns = [
      /you did not progress to phase (\d+)/i,
      /should.*advance.*to.*phase (\d+)/i,
      /move.*to.*phase (\d+)/i,
      /progress.*to.*phase (\d+)/i,
      /should.*be.*phase (\d+)/i,
      /force.*phase (\d+)/i,
      /advance.*phase (\d+)/i,
      /next.*phase.*(\d+)/i
    ]
    
    let targetPhase = null
    for (const pattern of phaseProgressionPatterns) {
      const match = feedbackText.match(pattern)
      if (match) {
        targetPhase = parseInt(match[1])
        break
      }
    }
    
    if (!targetPhase) {
      return { detected: false, message: 'No phase progression command detected' }
    }
    
    console.log(`🚀 Phase progression detected: Force advance to Phase ${targetPhase}`)
    
    // Update the session context to force progression to target phase
    const sessionId = feedbackRequest.sessionId
    if (!sessionId) {
      return { 
        detected: true, 
        targetPhase, 
        success: false, 
        error: 'No session ID provided' 
      }
    }
    
    // Update reflection_sessions table to force phase progression
    const { data: session, error: sessionError } = await supabaseClient
      .from('reflection_sessions')
      .update({
        current_phase: targetPhase,
        admin_forced_phase: targetPhase,
        admin_feedback_id: feedbackId,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single()
    
    if (sessionError) {
      console.error('❌ Failed to update session phase:', sessionError)
      return { 
        detected: true, 
        targetPhase, 
        success: false, 
        error: sessionError.message 
      }
    }
    
    // Log the phase progression action
    console.log(`✅ Session ${sessionId} phase forced to ${targetPhase} by admin feedback`)
    
    return {
      detected: true,
      targetPhase,
      success: true,
      sessionId,
      message: `Phase progression forced to Phase ${targetPhase}`,
      updatedSession: session
    }
    
  } catch (error) {
    console.error('❌ Error in handlePhaseProgressionFeedback:', error)
    return { 
      detected: true, 
      success: false, 
      error: error.message 
    }
  }
}
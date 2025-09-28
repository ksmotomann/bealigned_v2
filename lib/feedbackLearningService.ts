/**
 * Unified Feedback Learning Service - All Feedback Sources Treated Equally
 * Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9)
 * - helping families be strong and courageous through difficult moments
 */

import { supabase } from './supabase'

export interface FeedbackInput {
  sessionId: string
  messageId: string
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'alternative_response' | 'missing_closing' | 'better_phase_advancement' | 'content_improvement'
  feedbackValue?: 'positive' | 'negative' | 'neutral'
  feedbackText?: string // For alternative responses, text feedback, etc.
  alternativeContent?: string // What they would have preferred
  sessionContext?: any
  sourceType?: 'user' | 'admin' | 'system' // We treat all equally, but track for analytics
  messageContext?: {
    phase: number
    messageType: 'ai_response' | 'phase_header' | 'welcome' | 'closing'
    userInput?: string
    aiResponse?: string
  }
}

export interface LearningInsight {
  pattern: string
  confidence: number
  suggestedAction: string
  applicableContexts: string[]
}

/**
 * Universal feedback processing - treats all feedback sources equally
 */
export async function processFeedback(feedback: FeedbackInput): Promise<{
  processed: boolean
  insights: LearningInsight[]
  immediateActions: any[]
}> {
  try {
    console.log('🎯 Processing unified feedback:', {
      type: feedback.feedbackType,
      source: feedback.sourceType,
      phase: feedback.messageContext?.phase
    })

    // Step 1: Store the feedback (unified table)
    const { data: storedFeedback } = await supabase
      .from('unified_feedback')
      .insert({
        session_id: feedback.sessionId,
        message_id: feedback.messageId,
        feedback_type: feedback.feedbackType,
        feedback_value: feedback.feedbackValue,
        feedback_text: feedback.feedbackText,
        alternative_content: feedback.alternativeContent,
        session_context: feedback.sessionContext,
        message_context: feedback.messageContext,
        source_type: feedback.sourceType || 'user',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    // Step 2: Analyze for immediate learning patterns
    const insights = await analyzeForPatterns(feedback)
    
    // Step 3: Execute immediate improvements
    const immediateActions = await executeImmediateActions(insights, feedback)

    // Step 4: Update vector database if content-related feedback
    if (feedback.feedbackType === 'alternative_response' && feedback.alternativeContent) {
      await updateVectorContent(feedback)
    }

    return {
      processed: true,
      insights,
      immediateActions
    }

  } catch (error) {
    console.error('❌ Error processing feedback:', error)
    return {
      processed: false,
      insights: [],
      immediateActions: []
    }
  }
}

/**
 * Enhanced thumbs up/down with micro-learning
 */
export async function processThumbsFeedback(
  sessionId: string,
  messageId: string,
  isPositive: boolean,
  messageContext: FeedbackInput['messageContext'],
  sessionContext?: any
): Promise<void> {
  await processFeedback({
    sessionId,
    messageId,
    feedbackType: isPositive ? 'thumbs_up' : 'thumbs_down',
    feedbackValue: isPositive ? 'positive' : 'negative',
    messageContext,
    sessionContext,
    sourceType: 'user'
  })
}

/**
 * Process "suggest alternative response" feedback
 */
export async function processAlternativeResponseFeedback(
  sessionId: string,
  messageId: string,
  alternativeText: string,
  messageContext: FeedbackInput['messageContext'],
  sessionContext?: any
): Promise<void> {
  await processFeedback({
    sessionId,
    messageId,
    feedbackType: 'alternative_response',
    feedbackValue: 'negative', // Implies current response wasn't ideal
    feedbackText: `User suggested better response`,
    alternativeContent: alternativeText,
    messageContext,
    sessionContext,
    sourceType: 'user'
  })
}

/**
 * Admin real-time feedback (same processing)
 */
export async function processAdminFeedback(
  sessionId: string,
  feedbackType: FeedbackInput['feedbackType'],
  feedbackText: string,
  messageContext: FeedbackInput['messageContext'],
  sessionContext?: any
): Promise<void> {
  await processFeedback({
    sessionId,
    messageId: `admin-${Date.now()}`,
    feedbackType,
    feedbackText,
    messageContext,
    sessionContext,
    sourceType: 'admin'
  })
}

/**
 * Analyze feedback for learning patterns
 */
async function analyzeForPatterns(feedback: FeedbackInput): Promise<LearningInsight[]> {
  const insights: LearningInsight[] = []
  
  // Pattern 1: Consistent negative feedback on specific phase responses
  if (feedback.feedbackValue === 'negative' && feedback.messageContext?.phase) {
    const { data: similarFeedback } = await supabase
      .from('unified_feedback')
      .select('*')
      .eq('feedback_value', 'negative')
      .eq('message_context->>phase', feedback.messageContext.phase)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    
    if (similarFeedback && similarFeedback.length >= 3) {
      insights.push({
        pattern: `High negative feedback for Phase ${feedback.messageContext.phase}`,
        confidence: 0.8,
        suggestedAction: 'review_phase_content',
        applicableContexts: [`phase_${feedback.messageContext.phase}`]
      })
    }
  }
  
  // Pattern 2: Alternative responses suggesting missing closing types
  if (feedback.feedbackType === 'alternative_response' && feedback.alternativeContent) {
    const content = feedback.alternativeContent.toLowerCase()
    
    if (content.includes('message') && content.includes('co-parent')) {
      insights.push({
        pattern: 'User wants co-parent communication help',
        confidence: 0.9,
        suggestedAction: 'create_message_to_coparent_closing',
        applicableContexts: ['communication_need']
      })
    }
    
    if (content.includes('child') && (content.includes('tell') || content.includes('explain'))) {
      insights.push({
        pattern: 'User needs child communication script',
        confidence: 0.85,
        suggestedAction: 'create_child_conversation_closing',
        applicableContexts: ['child_communication']
      })
    }
  }
  
  // Pattern 3: Thumbs down on welcome messages
  if (feedback.feedbackValue === 'negative' && feedback.messageContext?.messageType === 'welcome') {
    insights.push({
      pattern: 'Welcome message tone mismatch',
      confidence: 0.7,
      suggestedAction: 'adjust_welcome_tone_selection',
      applicableContexts: ['welcome_optimization']
    })
  }
  
  return insights
}

/**
 * Execute immediate actions based on insights
 */
async function executeImmediateActions(insights: LearningInsight[], feedback: FeedbackInput) {
  const actions = []
  
  for (const insight of insights) {
    switch (insight.suggestedAction) {
      case 'create_message_to_coparent_closing':
        // Auto-create adaptive closing type
        await supabase.functions.invoke('process-admin-feedback', {
          body: {
            sessionId: feedback.sessionId,
            feedbackType: 'new_closing_needed',
            feedbackContent: 'User needs co-parent message help',
            suggestedClosingType: 'message_to_coparent',
            suggestedContent: feedback.alternativeContent,
            sessionContext: feedback.sessionContext,
            priorityLevel: 'high'
          }
        })
        actions.push('Created message_to_coparent closing type')
        break
        
      case 'create_child_conversation_closing':
        await supabase.functions.invoke('process-admin-feedback', {
          body: {
            sessionId: feedback.sessionId,
            feedbackType: 'new_closing_needed',
            feedbackContent: 'User needs child conversation script',
            suggestedClosingType: 'child_conversation_script',
            suggestedContent: feedback.alternativeContent,
            sessionContext: feedback.sessionContext,
            priorityLevel: 'high'
          }
        })
        actions.push('Created child_conversation_script closing type')
        break
        
      case 'adjust_welcome_tone_selection':
        // Flag for welcome tone algorithm adjustment
        await supabase
          .from('system_adjustments')
          .insert({
            adjustment_type: 'welcome_tone',
            trigger_context: feedback.sessionContext,
            priority: 'medium',
            status: 'pending'
          })
        actions.push('Flagged welcome tone for adjustment')
        break
    }
  }
  
  return actions
}

/**
 * Update vector database with better content
 */
async function updateVectorContent(feedback: FeedbackInput) {
  if (!feedback.alternativeContent || !feedback.messageContext) return
  
  // This would add the alternative content as a positive example
  // and potentially downweight the original response
  try {
    await supabase.functions.invoke('update-vector-content', {
      body: {
        originalContent: feedback.messageContext.aiResponse,
        improvedContent: feedback.alternativeContent,
        context: feedback.messageContext,
        updateType: 'user_improvement'
      }
    })
  } catch (error) {
    console.error('Error updating vector content:', error)
  }
}

/**
 * Get feedback analytics for admin dashboard
 */
export async function getFeedbackAnalytics(timeRange: 'day' | 'week' | 'month' = 'week') {
  const daysBack = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30
  
  const { data: analytics } = await supabase
    .from('unified_feedback')
    .select(`
      feedback_type,
      feedback_value,
      message_context,
      session_context,
      created_at
    `)
    .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
  
  return {
    totalFeedback: analytics?.length || 0,
    positiveRatio: analytics?.filter(f => f.feedback_value === 'positive').length / (analytics?.length || 1),
    topIssues: extractTopIssues(analytics),
    phasePerformance: analyzePhasePerformance(analytics),
    improvementAreas: identifyImprovementAreas(analytics)
  }
}

function extractTopIssues(analytics: any[]) {
  // Analyze negative feedback patterns
  const negativeByType = analytics
    ?.filter(f => f.feedback_value === 'negative')
    .reduce((acc, f) => {
      const key = `${f.feedback_type}_phase_${f.message_context?.phase}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  
  return Object.entries(negativeByType || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }))
}

function analyzePhasePerformance(analytics: any[]) {
  const phases = [1,2,3,4,5,6,7]
  return phases.map(phase => {
    const phaseFeedback = analytics?.filter(f => f.message_context?.phase === phase) || []
    const positive = phaseFeedback.filter(f => f.feedback_value === 'positive').length
    const total = phaseFeedback.length
    
    return {
      phase,
      satisfaction: total > 0 ? positive / total : 0,
      totalFeedback: total
    }
  })
}

function identifyImprovementAreas(analytics: any[]) {
  // Use insights from analyzeForPatterns to identify systemic issues
  return [
    'Phase completion accuracy',
    'Welcome message tone matching',
    'Session closing relevance',
    'Communication support quality'
  ]
}
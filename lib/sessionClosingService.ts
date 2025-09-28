/**
 * Session Closing Service - Contextual Session Takeaways
 * Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9)
 * - helping families be strong and courageous through difficult moments
 */

import { supabase } from './supabase'

export interface SessionClosing {
  type: 'closing_reflection' | 'closing_summary' | 'peace_reminder' | 'anchor_statement' | 'message_draft_clear' | 'message_to_children'
  title: string
  content: string
  confidence: number
}

export interface SessionContext {
  sessionId?: string
  currentPhase: number
  emotionalJourney: string[] // Track emotional progression through session
  keyInsights: string[] // Major insights or revelations
  userWhy?: string // User's deeper why discovered
  coparentDynamic?: 'high_conflict' | 'cooperative' | 'parallel' | 'disengaged'
  childrenAges?: string[]
  communicationNeeded?: boolean // Does user need to communicate with co-parent?
  hasBoundaryIssues?: boolean // Are there boundary-related challenges?
  hasBreakthrough?: boolean // Was there a significant breakthrough moment?
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
}

/**
 * Generate contextual session closings based on the user's journey
 */
export async function generateSessionClosings(
  sessionContext: SessionContext,
  conversationHistory: Message[] = []
): Promise<SessionClosing[]> {
  try {
    console.log('🎯 Generating contextual session closings...')
    
    const { data, error } = await supabase.functions.invoke('generate-session-closing', {
      body: {
        sessionContext,
        conversationHistory: conversationHistory.slice(-15) // Keep last 15 for context
      }
    })

    if (error) {
      console.error('❌ Error calling session closing Edge Function:', error)
      return getFallbackClosings(sessionContext)
    }

    console.log('✅ Session closings generated:', {
      closingsCount: data.sessionClosings?.length || 0,
      types: data.sessionClosings?.map((c: SessionClosing) => c.type) || [],
      phase: data.metadata?.phase
    })
    
    return data.sessionClosings || []

  } catch (error) {
    console.error('❌ Error in session closing generation:', error)
    return getFallbackClosings(sessionContext)
  }
}

/**
 * Build session context from conversation and user state
 */
export function buildSessionContext(
  currentPhase: number,
  conversationHistory: Message[],
  sessionId?: string
): SessionContext {
  // Analyze conversation to extract context
  const userMessages = conversationHistory.filter(m => m.role === 'user').map(m => m.content)
  const allContent = userMessages.join(' ').toLowerCase()
  
  // Detect emotional journey through language patterns
  const emotionalJourney = detectEmotionalJourney(allContent)
  
  // Detect key insights through AI responses
  const aiMessages = conversationHistory.filter(m => m.role === 'assistant')
  const keyInsights = extractKeyInsights(aiMessages)
  
  // Detect communication needs
  const communicationNeeded = /message|tell|communicate|say to|write|email|text/.test(allContent)
  
  // Detect co-parent dynamic
  const coparentDynamic = detectCoparentDynamic(allContent)
  
  // Detect breakthroughs
  const hasBreakthrough = detectBreakthrough(aiMessages, userMessages)
  
  return {
    sessionId,
    currentPhase,
    emotionalJourney,
    keyInsights,
    communicationNeeded,
    coparentDynamic,
    hasBreakthrough
  }
}

/**
 * Detect emotional progression through the session
 */
function detectEmotionalJourney(content: string): string[] {
  const journey: string[] = []
  
  // Initial emotions (typically present early)
  if (/overwhelmed|stressed|frustrated|angry|upset|mad/.test(content)) {
    journey.push('overwhelmed')
  }
  if (/sad|hurt|disappointed|devastated/.test(content)) {
    journey.push('sad')
  }
  if (/confused|lost|stuck|don't know/.test(content)) {
    journey.push('confused')
  }
  
  // Processing emotions (middle)
  if (/thinking|considering|wondering|maybe|perhaps/.test(content)) {
    journey.push('reflective')
  }
  
  // Resolution emotions (typically toward end)
  if (/clear|clarity|understand|makes sense|see now/.test(content)) {
    journey.push('clarity')
  }
  if (/ready|can do|will try|feel better|stronger/.test(content)) {
    journey.push('empowered')
  }
  
  return journey.length > 0 ? journey : ['reflective'] // Default
}

/**
 * Extract key insights from AI responses
 */
function extractKeyInsights(aiMessages: Message[]): string[] {
  const insights: string[] = []
  
  for (const message of aiMessages.slice(-5)) { // Look at recent AI messages
    const content = message.content.toLowerCase()
    
    // Look for insight patterns
    if (content.includes('your deeper why') || content.includes('what matters most')) {
      insights.push('deeper_why_clarified')
    }
    if (content.includes('child') && content.includes('needs')) {
      insights.push('child_needs_identified')
    }
    if (content.includes('boundary') || content.includes('protect')) {
      insights.push('boundary_awareness')
    }
    if (content.includes('perspective') && content.includes('co-parent')) {
      insights.push('coparent_perspective_gained')
    }
  }
  
  return insights
}

/**
 * Detect co-parent relationship dynamic
 */
function detectCoparentDynamic(content: string): SessionContext['coparentDynamic'] {
  if (/toxic|abuse|control|manipulat|fighting|war|battle|hate/.test(content)) {
    return 'high_conflict'
  }
  if (/work together|cooperat|agree|support|partner/.test(content)) {
    return 'cooperative'
  }
  if (/parallel|separate|avoid|minimal contact|don't talk/.test(content)) {
    return 'parallel'
  }
  if (/ignore|doesn't respond|won't engage|absent/.test(content)) {
    return 'disengaged'
  }
  
  return 'parallel' // Default assumption
}

/**
 * Detect if there was a significant breakthrough moment
 */
function detectBreakthrough(aiMessages: Message[], userMessages: string[]): boolean {
  // Look for AI acknowledgment of breakthrough
  const recentAI = aiMessages.slice(-3).map(m => m.content.toLowerCase()).join(' ')
  if (/beautiful|powerful|breakthrough|shift|transformation|wow/.test(recentAI)) {
    return true
  }
  
  // Look for user expressions of clarity/relief
  const recentUser = userMessages.slice(-2).join(' ').toLowerCase()
  if (/makes sense|feel better|clarity|understand now|relief|lighter/.test(recentUser)) {
    return true
  }
  
  return false
}

/**
 * Fallback closings if Edge Function fails
 */
function getFallbackClosings(sessionContext: SessionContext): SessionClosing[] {
  const fallbacks: SessionClosing[] = [
    {
      type: 'closing_reflection',
      title: 'Thank You for Your Courage',
      content: `***You've shown real courage today — naming what's hard, staying focused on what matters most for your children, and being willing to grow through challenge.***

***That's the heart of aligned parenting: choosing growth over comfort, love over fear, and your children's well-being over being right.***

***💙 "Be strong and courageous" - Joshua 1:9***`,
      confidence: 0.8
    }
  ]
  
  // Add peace reminder for high conflict situations
  if (sessionContext.coparentDynamic === 'high_conflict' || 
      sessionContext.emotionalJourney.includes('overwhelmed')) {
    fallbacks.push({
      type: 'peace_reminder',
      title: 'Your Peace Reminder',
      content: `***🌿 Your Peace Reminder***

*I don't have to carry what isn't mine.*
*I parent from love, not from fear.*
*My children know my heart — that's what matters.*
*I can be strong and gentle at the same time.*`,
      confidence: 0.7
    })
  }
  
  return fallbacks
}

/**
 * Get contextual sign-out mantra (different from session closings)
 */
export async function getContextualSignOutMantra(sessionContext: SessionContext): Promise<string> {
  // This would integrate with the existing outro/mantra system
  // Session closings come BEFORE the final sign-out mantra
  const { getContextualOutroMantra } = await import('./outroPrompts')
  
  const emotionalState = sessionContext.emotionalJourney.slice(-1)[0] || 'empowered'
  return getContextualOutroMantra(emotionalState, sessionContext.currentPhase)
}
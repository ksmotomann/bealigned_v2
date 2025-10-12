/**
 * AI-Generated Welcome Message Service
 *
 * Instead of using static prompts, this service uses AI to generate personalized
 * welcome messages based on tone categories and user preferences.
 */

import { WELCOME_PROMPTS } from './welcomePrompts'
import { generateAIResponse } from './aiServiceKnowledgeBased'
import debug from './debugLogger'

export type WelcomeTone = 'reflective' | 'validating' | 'sorting' | 'direct' | 'mixed'

export interface UserProfile {
  preferredTone?: WelcomeTone
  communicationStyle?: 'gentle' | 'direct' | 'supportive' | 'structured'
  sessionHistory?: {
    hasCompletedSessions: boolean
    lastSessionDays?: number
    commonChallenges?: string[]
  }
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'late'
}

/**
 * Generate AI-powered welcome message based on user preferences and examples
 */
export async function generateAIWelcomeMessage(
  userProfile: UserProfile = {}
): Promise<string> {
  debug.log('🎯 generateAIWelcomeMessage called with profile:', userProfile)

  try {
    // Use Supabase Edge Function instead of direct API calls
    const { supabase } = await import('./supabase')

    debug.log('🚀 Calling Supabase Edge Function for AI welcome generation')
    
    const { data, error } = await supabase.functions.invoke('generate-ai-welcome', {
      body: { userProfile }
    })

    if (error) {
      console.error('❌ Edge Function error:', error)
      throw new Error(`Edge Function failed: ${error.message}`)
    }

    if (!data?.welcomeMessage) {
      throw new Error('No welcome message returned from Edge Function')
    }

    debug.log('✅ AI welcome message generated via Edge Function:', {
      message: data.welcomeMessage.substring(0, 50) + '...',
      toneCategory: data.toneCategory,
      generatedBy: data.generatedBy
    })

    return data.welcomeMessage

  } catch (error) {
    console.error('❌ Failed to generate AI welcome message via Edge Function:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userProfile
    })
    // Fallback to static random prompt if AI generation fails
    debug.log('📝 Falling back to static welcome message')
    return getStaticFallbackWelcome(userProfile)
  }
}

/**
 * Determine the best tone category based on user profile
 */
function determineToneCategory(userProfile: UserProfile): WelcomeTone {
  // If user has explicit preference, use it (unless it's 'mixed')
  if (userProfile.preferredTone && userProfile.preferredTone !== 'mixed') {
    return userProfile.preferredTone
  }

  // Smart tone selection based on context
  const { communicationStyle, timeOfDay, sessionHistory } = userProfile

  // Time-based preferences
  if (timeOfDay === 'morning') return 'reflective'
  if (timeOfDay === 'late' || timeOfDay === 'evening') return 'validating'
  
  // Style-based preferences  
  if (communicationStyle === 'direct') return 'direct'
  if (communicationStyle === 'gentle') return 'validating'
  if (communicationStyle === 'structured') return 'sorting'
  
  // History-based preferences
  if (sessionHistory?.hasCompletedSessions) {
    // Returning users might appreciate more direct approach
    return Math.random() > 0.5 ? 'direct' : 'sorting'
  }
  
  // Default to validating for new users - most supportive
  return 'validating'
}

/**
 * Get description of each tone category
 */
function getToneDescription(tone: WelcomeTone): string {
  const descriptions = {
    reflective: 'Contemplative, introspective, focuses on inner awareness and mindful reflection',
    validating: 'Supportive, acknowledging, emphasizes that showing up is progress',
    sorting: 'Practical, organizing, helps break down overwhelming situations into manageable pieces',
    direct: 'Straightforward, energetic, invites full expression without judgment',
    mixed: 'Balanced approach combining multiple tones'
  }
  return descriptions[tone] || descriptions.validating
}

/**
 * Static fallback if AI generation fails
 * Still uses intelligent tone detection for better user experience
 */
function getStaticFallbackWelcome(userProfile: UserProfile): string {
  const toneCategory = determineToneCategory(userProfile)
  debug.log('📝 Using static fallback with tone:', toneCategory)

  const categoryPrompts = WELCOME_PROMPTS[toneCategory] || WELCOME_PROMPTS.validating
  const randomIndex = Math.floor(Math.random() * categoryPrompts.length)
  const selectedPrompt = categoryPrompts[randomIndex]

  debug.log('✅ Selected static prompt:', selectedPrompt.substring(0, 50) + '...')
  return selectedPrompt
}

/**
 * Generate welcome message with caching for performance
 */
const messageCache = new Map<string, { message: string, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCachedAIWelcomeMessage(
  userProfile: UserProfile = {}
): Promise<string> {
  // Create cache key from user profile
  const cacheKey = JSON.stringify(userProfile)
  const cached = messageCache.get(cacheKey)
  
  // Return cached message if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.message
  }
  
  // Generate new message
  const message = await generateAIWelcomeMessage(userProfile)
  
  // Cache it
  messageCache.set(cacheKey, { message, timestamp: Date.now() })
  
  return message
}

/**
 * Get user profile from available data (future enhancement)
 */
export function buildUserProfile(
  userId?: string,
  sessionData?: any,
  timeOfDay?: string
): UserProfile {
  // For now, return basic profile based on time
  const now = new Date()
  const hour = now.getHours()
  
  let detectedTimeOfDay: UserProfile['timeOfDay'] = 'afternoon'
  if (hour < 12) detectedTimeOfDay = 'morning'
  else if (hour < 18) detectedTimeOfDay = 'afternoon'
  else if (hour < 22) detectedTimeOfDay = 'evening'
  else detectedTimeOfDay = 'late'
  
  return {
    timeOfDay: detectedTimeOfDay,
    communicationStyle: 'supportive', // Default
    sessionHistory: {
      hasCompletedSessions: false // Will be enhanced with real data
    }
  }
}
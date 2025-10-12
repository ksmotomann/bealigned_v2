// Chat welcome prompts organized by tone and approach
import debug from './debugLogger'

export const WELCOME_PROMPTS = {
  reflective: [
    "Being here isn't about having all the answers. It's about quieting the noise long enough to see what's really underneath. What's on your mind today?",
    "Sometimes the hardest part is slowing down enough to notice what matters. What's asking for your attention today?",
    "This is your pause button. What's the noise you most want to quiet?"
  ],
  
  validating: [
    "Some days feel like too much. What's the one thing weighing most on you right now?",
    "You showed up—that's already progress. Where do you want to start from here?",
    "I'm not here to hand you answers. I'm here to help you uncover the ones already within you. Where should we start?",
    "You made it here—that's something. What do you want to work through first?"
  ],
  
  sorting: [
    "You don't need to fix everything at once. What's the first piece you'd like to sort through?",
    "This space isn't about judgment—it's about finding clarity in the middle of the mess. What's showing up for you right now?",
    "Carrying a heavy load today? What can you set down here?",
    "You've got a lot on your plate. What's one piece we can clear off together?"
  ],
  
  direct: [
    "Have at me. Bring the mess, the questions, the weight of it all—this is where we make it lighter. What do you want to lay down first?",
    "Lay it on me. What do you want to get off your chest first?",
    "Hit me with it. What's taking up the most space in your head right now?",
    "Go ahead—get it out. What's the thing you want to let go of the most?",
    "Don't hold back. What's the first thing you need to say?",
    "Bring it. Big or small—what's on you that we can unpack here?"
  ]
}

// Get all prompts as a flat array
const ALL_PROMPTS = [
  ...WELCOME_PROMPTS.reflective,
  ...WELCOME_PROMPTS.validating,
  ...WELCOME_PROMPTS.sorting,
  ...WELCOME_PROMPTS.direct
]

// Get a random welcome prompt (legacy function for backwards compatibility)
export function getRandomWelcomePrompt(): string {
  const randomIndex = Math.floor(Math.random() * ALL_PROMPTS.length)
  return ALL_PROMPTS[randomIndex]
}

// New AI-powered welcome message (async) - OPTIMIZED: Use static prompts directly
export async function getAIGeneratedWelcome(userProfile?: any): Promise<string> {
  debug.log('🎯 === BeH2O WELCOME GENERATION (STATIC) ===')

  // OPTIMIZATION: Skip slow AI/vector generation, use high-quality static prompts directly
  // The static prompts are already BeH2O-aligned and perform well
  try {
    const welcomeMessage = getRandomWelcomePrompt()
    debug.log('✅ Static welcome message selected:', welcomeMessage)
    debug.log('📝 Message length:', welcomeMessage.length, 'characters')
    return welcomeMessage
  } catch (error) {
    console.error('❌ Static welcome selection failed:', error)
    debug.log('🆘 Returning emergency fallback message')
    return "Let's take a moment to explore what's on your mind. What situation would you like to reflect on?"
  }
}

// Get a random prompt from a specific category
export function getRandomWelcomePromptByCategory(category: keyof typeof WELCOME_PROMPTS): string {
  const categoryPrompts = WELCOME_PROMPTS[category]
  const randomIndex = Math.floor(Math.random() * categoryPrompts.length)
  return categoryPrompts[randomIndex]
}

// Get a weighted random prompt (can adjust weights based on user preferences)
export function getWeightedRandomWelcomePrompt(weights?: {
  reflective?: number
  validating?: number
  sorting?: number
  direct?: number
}): string {
  const defaultWeights = { reflective: 1, validating: 1, sorting: 1, direct: 1 }
  const finalWeights = { ...defaultWeights, ...weights }
  
  // Create weighted array
  const weightedPrompts: string[] = []
  
  Object.entries(WELCOME_PROMPTS).forEach(([category, prompts]) => {
    const weight = finalWeights[category as keyof typeof finalWeights] || 1
    for (let i = 0; i < weight; i++) {
      weightedPrompts.push(...prompts)
    }
  })
  
  const randomIndex = Math.floor(Math.random() * weightedPrompts.length)
  return weightedPrompts[randomIndex]
}

// Future enhancement: Get prompt based on user personality/bio profile
export function getPersonalizedWelcomePrompt(userProfile?: {
  personality?: 'reflective' | 'direct' | 'validating' | 'sorting'
  communicationStyle?: 'gentle' | 'direct' | 'supportive' | 'structured'
}): string {
  if (!userProfile?.personality) {
    return getRandomWelcomePrompt()
  }
  
  // Map personality types to tone categories
  const personalityToCategory: Record<string, keyof typeof WELCOME_PROMPTS> = {
    reflective: 'reflective',
    direct: 'direct', 
    validating: 'validating',
    sorting: 'sorting'
  }
  
  const category = personalityToCategory[userProfile.personality]
  return category ? getRandomWelcomePromptByCategory(category) : getRandomWelcomePrompt()
}
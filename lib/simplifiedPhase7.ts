// Simplified Phase 7 completion matching GPT gold standard
export interface SimplePhase7Context {
  issue?: string
  feelings?: string
  why?: string
  childNeeds?: string
  chosenOption?: string
}

// Generate a coherent CLEAR message based on conversation context
export function generateSimpleClearMessage(context: SimplePhase7Context): string {
  // If we don't have enough context, use a generic template
  if (!context.issue || !context.feelings || !context.why) {
    return "I've been reflecting on our situation, and I want to share something important. When [specific situation] happened, I felt [emotion] because [what matters to you]. I'm not asking you to agree with everything, but I am asking that we both center our child's needs. What I'd most appreciate is [specific request]. I believe we both want [shared goal for our child]."
  }

  // Extract key elements to create a coherent message
  const situation = extractKeyPhrase(context.issue)
  const emotion = extractKeyEmotion(context.feelings)  
  const reason = extractKeyPhrase(context.why)
  
  // Create a focused CLEAR message
  return `I've been reflecting on our situation, and I want to share something important. When ${situation} happened, I felt ${emotion} because ${reason}. I'm not asking you to agree with everything, but I am asking that we both center our child's needs. What I'd most appreciate is finding a way to work together on this. I believe we both want what's best for our child.`
}

// Helper function to extract key phrases from longer user input
function extractKeyPhrase(input: string, maxWords: number = 8): string {
  if (!input) return "this situation"
  
  // Remove very long responses and extract key elements
  const words = input.trim().split(/\s+/)
  if (words.length <= maxWords) {
    return input.toLowerCase()
  }
  
  // Try to find the main issue/concern in the first part
  const firstSentence = input.split(/[.!?]/)[0].trim()
  const firstSentenceWords = firstSentence.split(/\s+/)
  
  if (firstSentenceWords.length <= maxWords) {
    return firstSentence.toLowerCase()
  }
  
  // Fall back to first few words
  return words.slice(0, maxWords).join(' ').toLowerCase()
}

// Helper function to extract primary emotion
function extractKeyEmotion(input: string): string {
  if (!input) return "concerned"
  
  const emotionWords = [
    'angry', 'frustrated', 'hurt', 'sad', 'worried', 'overwhelmed', 
    'scared', 'anxious', 'confused', 'disappointed', 'upset', 'stressed'
  ]
  
  const inputLower = input.toLowerCase()
  for (const emotion of emotionWords) {
    if (inputLower.includes(emotion)) {
      return emotion
    }
  }
  
  // Default if no specific emotion found
  return "concerned"
}

// Generate brief closing reflection matching GPT style
export function generateBriefClosing(context: SimplePhase7Context): string {
  const closingOptions = [
    "You've done some powerful reflection today — moving from confusion to clarity about what truly matters. Remember: Alignment doesn't mean agreement — it means staying centered on what's important. You've got this.",
    
    "What I see in you today is someone who chose to pause instead of react. That kind of reflection takes real courage, and it's exactly what creates the space for real solutions to emerge.",
    
    "You showed up today with honesty about your struggles and openness to seeing beyond your first reaction. That willingness to explore is what transforms conflict into collaboration.",
    
    "The fact that you're here, doing this work, shows your commitment to something bigger than being right. You're choosing to be the kind of parent who creates stability even in chaos."
  ]
  
  return closingOptions[Math.floor(Math.random() * closingOptions.length)]
}

// Main function to generate complete Phase 7 response
export function generateSimplePhase7Response(context: SimplePhase7Context): {
  clearMessage: string
  closingReflection: string
} {
  return {
    clearMessage: generateSimpleClearMessage(context),
    closingReflection: generateBriefClosing(context)
  }
}
import { getContextualClosingElements } from './closingElements'
import { getContextualOutroMantra } from './outroPrompts'

// Enhanced Phase 7 completion system
export interface Phase7CompletionContext {
  // Session data extracted from conversation
  initialSituation?: string
  coreEmotions?: string[]
  deeperWhy?: string
  coParentPerspective?: string
  childPerspective?: string
  chosenOption?: string
  
  // Analysis for contextual selection
  primaryConcern?: 'coParent' | 'child' | 'self'
  emotionalIntensity?: 'low' | 'medium' | 'high'
  resolutionLevel?: 'resolved' | 'progress' | 'processing'
  sessionType?: 'breakthrough' | 'maintenance' | 'crisis'
}

export function generatePhase7Completion(context: Phase7CompletionContext): {
  messageDraft: string
  closingReflection: string
  peaceReminder: string
  closingSummary: string
  anchorStatement: string
  outroMantra: string
} {
  // Get contextual closing elements
  const closingElements = getContextualClosingElements({
    primaryConcern: context.primaryConcern,
    emotionalIntensity: context.emotionalIntensity,
    resolutionLevel: context.resolutionLevel,
    sessionType: context.sessionType
  })
  
  // Generate contextual outro mantra
  const outroMantra = getContextualOutroMantra({
    phaseCompleted: 7,
    emotionalIntensity: context.emotionalIntensity || 'medium',
    resolutionLevel: context.resolutionLevel || 'progress'
  })
  
  // Customize message draft based on chosen option and context
  let messageDraft = closingElements.messageDraft
  
  // Replace template variables with actual context
  if (context.initialSituation) {
    messageDraft = messageDraft.replace(/\[situation\]/g, context.initialSituation)
  }
  if (context.coreEmotions && context.coreEmotions.length > 0) {
    messageDraft = messageDraft.replace(/\[emotion\]/g, context.coreEmotions[0])
  }
  if (context.deeperWhy) {
    messageDraft = messageDraft.replace(/\[deeper why\]/g, context.deeperWhy)
    messageDraft = messageDraft.replace(/\[why it matters\]/g, context.deeperWhy)
  }
  
  // Customize closing summary with actual session insights
  let closingSummary = closingElements.closingSummary
  if (context.initialSituation && context.coreEmotions && context.deeperWhy) {
    closingSummary = `Today you moved from ${context.coreEmotions[0]} about ${context.initialSituation} to clarity about what really matters: ${context.deeperWhy}. You've chosen to respond from alignment rather than reaction, focusing on what serves everyone's highest good.`
  }
  
  return {
    messageDraft,
    closingReflection: closingElements.closingReflection,
    peaceReminder: closingElements.peaceReminder,
    closingSummary,
    anchorStatement: closingElements.anchorStatement,
    outroMantra
  }
}

// Format the complete Phase 7 completion sequence
export function formatPhase7CompletionSequence(context: Phase7CompletionContext): string[] {
  const completion = generatePhase7Completion(context)
  
  return [
    `## 📝 Your CLEAR Message Draft\n\n"${completion.messageDraft}"\n\n*Feel free to adapt this language to match your voice and situation.*`,
    
    `## 🌟 Closing Reflection\n\n${completion.closingReflection}`,
    
    `## 🕊️ Peace Reminder\n\n${completion.peaceReminder}`,
    
    `## 💫 Session Summary\n\n${completion.closingSummary}`,
    
    `## ⚓ Anchor Statement\n\n*"${completion.anchorStatement}"*`,
    
    `---\n\n*${completion.outroMantra}*`
  ]
}

// Simplified version for immediate use - analyzes the school bus scenario
export function generateSchoolBusCompletion(): string[] {
  const context: Phase7CompletionContext = {
    initialSituation: "son missing the bus and school morning routine conflicts",
    coreEmotions: ["worry", "fear", "overwhelm"],
    deeperWhy: "wanting to enjoy time with son and maintain peace in co-parenting",
    coParentPerspective: "seeing him as irresponsible with school punctuality",
    childPerspective: "feeling annoyed and frustrated by morning pressure",
    primaryConcern: 'coParent',
    emotionalIntensity: 'medium',
    resolutionLevel: 'progress',
    sessionType: 'maintenance'
  }
  
  return [
    `## 📝 Your CLEAR Message Draft\n\n"I wanted to talk with you about our morning routine with [son's name]. I know we both want him to succeed in school, and I've been reflecting on how we can work together on this. When he misses the bus and I have to drive him, I sometimes hit traffic which creates stress for both of us. I'm not trying to avoid responsibility - I love our drive time together. What I'd most appreciate is if we could create a consistent morning routine that sets him up for success. Could we explore some solutions together that honor what we both want for him?"\n\n*Feel free to adapt this language to match your voice and situation.*`,
    
    `## 🌟 Closing Reflection\n\nWhat I see in you today is someone who chose to pause instead of react. You could have stayed focused on the blame and frustration, but instead you explored what this situation was really about - your love for your son and your desire for peaceful mornings together. That kind of reflection takes real courage.`,
    
    `## 🕊️ Peace Reminder\n\nRemember: Your child doesn't need you to be perfect. They need you to be present, honest, and committed to their wellbeing above all else. The morning routine will improve, but what matters most is that you're approaching it from love rather than fear.`,
    
    `## 💫 Session Summary\n\nToday you moved from worry and overwhelm about school mornings to clarity about what really matters: enjoying your relationship with your son while maintaining responsibility. You recognized that your co-parent may be acting from concern about punctuality, and your son might be feeling pressured. Most importantly, you're choosing to approach this from collaboration rather than conflict.`,
    
    `## ⚓ Anchor Statement\n\n*"Alignment doesn't mean agreement - it means being centered on what matters most."*`,
    
    `---\n\n*Every reflection makes the next step lighter.*`
  ]
}
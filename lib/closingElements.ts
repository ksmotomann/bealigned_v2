// Phase 7 completion elements for comprehensive session closure
export const CLOSING_ELEMENTS = {
  // Final message drafts - CLEAR communication templates
  reflectionMessageDrafts: {
    coParentCommunication: [
      "I've been reflecting on our situation, and I want to share something important with you. When [situation] happened, I felt [emotion] because [deeper why]. I'm not asking you to agree with everything, but I am asking that we both center [child's name]'s needs. What I'd most appreciate is [specific request]. I believe we both want [shared value/goal].",
      
      "I wanted to talk with you about [situation]. I know we see this differently, but I've been doing some reflection and I want to be transparent. I felt [emotion] when [specific incident] because [why it matters]. Rather than letting this create more distance, I'd like to focus on [child-centered outcome]. Could we explore [specific solution] together?",
      
      "I hope we can take a step back and look at this with fresh eyes. The situation with [specific context] has been weighing on me because [personal why]. I'm not trying to be right - I'm trying to be centered on what [child's name] needs from both of us. I'd love to work together on [specific action/solution]. What are your thoughts?"
    ],
    
    childCommunication: [
      "[Child's name], I want you to know that some of the grown-up stuff happening between your [parent] and me isn't your responsibility to fix or worry about. We both love you deeply, and that will never change. It's okay for you to feel [acknowledge their feelings] about this situation. What you need to know most is that you're safe, you're loved, and it's not your job to take care of the adults.",
      
      "Hey [child's name], I noticed you might be feeling [observed emotion] about what's happening between your [other parent] and me. I want you to know that our grown-up problems are not your fault, and they're not yours to solve. Both of us love you no matter what. You get to just be a kid and focus on [age-appropriate activities]. If you have questions or feelings about this, you can always talk to me.",
      
      "I want to talk with you about something important. Sometimes grown-ups have disagreements, and that might feel scary or confusing. What I want you to know is that you are loved completely by both your [other parent] and me. Our disagreements are about grown-up things, not about you. You don't need to choose sides, fix anything, or carry our feelings. Your job is to be [child's age] and do [child-appropriate things]."
    ],
    
    selfReflection: [
      "I'm choosing to step back from this reactive cycle and center myself on what truly matters: [child's wellbeing/core value]. While I can't control [other person's] response, I can control how I show up. I will focus on [specific aligned action] and trust that consistency and clarity will create the foundation [child's name] needs.",
      
      "This situation has taught me that I can hold both my truth and space for [co-parent's] perspective without compromising my values. My role is not to win or be right, but to model the stability and love [child's name] deserves. I will continue to [specific commitment] and trust the process.",
      
      "I'm recognizing that my emotional reaction to this situation was trying to tell me something important about [deeper value/need]. Instead of letting that drive me toward conflict, I can use it as information to guide me toward [aligned response]. I'm committed to showing up as the parent [child's name] needs me to be."
    ]
  },

  // Closing reflections - summary of insights and growth
  closingReflections: [
    "What I see in you today is someone who chose courage over comfort. You didn't just name your pain - you explored what it was teaching you and how it could guide you toward alignment. That kind of reflection takes real strength.",
    
    "You showed up today with honesty about your struggles and openness to seeing beyond your first reaction. That willingness to pause and explore is exactly what creates the space for real solutions to emerge.",
    
    "The fact that you're here, doing this work, shows your commitment to something bigger than being right. You're choosing to be the kind of parent who creates stability even in chaos, and that matters deeply.",
    
    "What stands out to me is how you were able to hold both your truth and your co-parent's humanity simultaneously. That kind of emotional maturity is what transforms conflict into collaboration.",
    
    "You've done something really significant today - you've moved from reaction to reflection to aligned action. That shift is what breaks cycles and creates new possibilities for your family."
  ],

  // Peace reminders - grounding statements
  peaceReminders: [
    "Remember: You don't have to fix everything today. You just have to show up consistently with love and clarity.",
    
    "Progress isn't always visible immediately, but every time you choose alignment over reaction, you're creating stability your child can count on.",
    
    "Your child doesn't need you to be perfect. They need you to be present, honest, and committed to their wellbeing above all else.",
    
    "The work you're doing matters, even when it feels invisible. Every choice toward alignment creates ripples of peace in your child's world.",
    
    "Trust that when you operate from love and clarity, you create space for solutions you couldn't see from a reactive place."
  ],

  // Closing summaries - integration of session insights
  closingSummaries: [
    "Today you moved from [initial emotional state] to [insight/clarity]. You identified that your deeper why is [core value/need] and recognized that [co-parent] may be operating from [their perspective]. Most importantly, you're choosing to center [child's name]'s needs through [specific aligned action].",
    
    "We started with [presenting situation] and discovered it was really about [deeper theme]. You've chosen to shift from [reactive pattern] to [aligned response]. The path forward honors both your truth and your commitment to [child-centered outcome].",
    
    "Your reflection revealed that beneath [surface emotion] was [core need/value]. Rather than letting that drive conflict, you're choosing to channel it toward [constructive action]. This shift from reaction to alignment is the heart of the work.",
    
    "What emerged today is clarity about your non-negotiables ([core values]) and flexibility about your methods ([specific approaches]). You're choosing to engage from [aligned stance] rather than [reactive position], which creates space for [positive possibility]."
  ],

  // Anchor statements - memorable truths to carry forward
  anchorStatements: [
    "Alignment doesn't mean agreement - it means being centered on what matters most.",
    
    "Your child needs your clarity more than they need your conflict to be resolved.",
    
    "When you operate from your values instead of your wounds, you create the stability your child deserves.",
    
    "The most powerful thing you can do is show up consistently as the parent your child needs, regardless of how others respond.",
    
    "Peace in your family starts with peace in your own heart.",
    
    "You can hold your truth and hold space for others at the same time.",
    
    "Your child's safety and wellbeing are always worth more than being right."
  ]
}

// Helper functions to get random elements from each category
export function getRandomReflectionMessageDraft(type: 'coParentCommunication' | 'childCommunication' | 'selfReflection'): string {
  const drafts = CLOSING_ELEMENTS.reflectionMessageDrafts[type]
  return drafts[Math.floor(Math.random() * drafts.length)]
}

export function getRandomClosingReflection(): string {
  const reflections = CLOSING_ELEMENTS.closingReflections
  return reflections[Math.floor(Math.random() * reflections.length)]
}

export function getRandomPeaceReminder(): string {
  const reminders = CLOSING_ELEMENTS.peaceReminders
  return reminders[Math.floor(Math.random() * reminders.length)]
}

export function getRandomClosingSummary(): string {
  const summaries = CLOSING_ELEMENTS.closingSummaries
  return summaries[Math.floor(Math.random() * summaries.length)]
}

export function getRandomAnchorStatement(): string {
  const statements = CLOSING_ELEMENTS.anchorStatements
  return statements[Math.floor(Math.random() * statements.length)]
}

// Contextual selection based on session data
export function getContextualClosingElements(sessionContext?: {
  primaryConcern?: 'coParent' | 'child' | 'self'
  emotionalIntensity?: 'low' | 'medium' | 'high'
  resolutionLevel?: 'resolved' | 'progress' | 'processing'
  sessionType?: 'breakthrough' | 'maintenance' | 'crisis'
}) {
  if (!sessionContext) {
    return {
      messageDraft: getRandomReflectionMessageDraft('coParentCommunication'),
      closingReflection: getRandomClosingReflection(),
      peaceReminder: getRandomPeaceReminder(),
      closingSummary: getRandomClosingSummary(),
      anchorStatement: getRandomAnchorStatement()
    }
  }

  // Select message draft type based on primary concern
  const draftType = sessionContext.primaryConcern === 'child' ? 'childCommunication' :
                   sessionContext.primaryConcern === 'self' ? 'selfReflection' : 'coParentCommunication'

  return {
    messageDraft: getRandomReflectionMessageDraft(draftType),
    closingReflection: getRandomClosingReflection(),
    peaceReminder: getRandomPeaceReminder(),  
    closingSummary: getRandomClosingSummary(),
    anchorStatement: getRandomAnchorStatement()
  }
}
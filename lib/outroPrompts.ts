// Chat outro/sign-off mantras organized by theme and tone
export const OUTRO_MANTRAS = {
  grounding: [
    "To Be is Being in the pause. Carry that steadiness with you.",
    "In the pause, you found clarity. Take that forward.",
    "Strong yet flexible. Steady and fluid. Keep Being.",
    "The pause doesn't end here. It goes with you."
  ],
  
  affirming: [
    "You created space today. That's enough.",
    "You showed up with honesty. That's real progress.", 
    "This work is quiet but strong — just like you.",
    "You're not behind. You're becoming."
  ],
  
  releasing: [
    "You leave not with answers, but with more room to breathe.",
    "You've set something down here. No need to pick it back up.",
    "Every reflection makes the next step lighter."
  ],
  
  centering: [
    "Alignment doesn't mean agreement. It means staying rooted in what matters."
  ]
}

// Get all mantras as a flat array
const ALL_MANTRAS = [
  ...OUTRO_MANTRAS.grounding,
  ...OUTRO_MANTRAS.affirming,
  ...OUTRO_MANTRAS.releasing,
  ...OUTRO_MANTRAS.centering
]

// Get a random outro mantra
export function getRandomOutroMantra(): string {
  const randomIndex = Math.floor(Math.random() * ALL_MANTRAS.length)
  return ALL_MANTRAS[randomIndex]
}

// Get a random mantra from a specific theme
export function getRandomOutroMantraByTheme(theme: keyof typeof OUTRO_MANTRAS): string {
  const themeMantraes = OUTRO_MANTRAS[theme]
  const randomIndex = Math.floor(Math.random() * themeMantraes.length)
  return themeMantraes[randomIndex]
}

// Get a weighted random mantra (can adjust weights based on session outcome)
export function getWeightedRandomOutroMantra(weights?: {
  grounding?: number
  affirming?: number
  releasing?: number
  centering?: number
}): string {
  const defaultWeights = { grounding: 1, affirming: 1, releasing: 1, centering: 1 }
  const finalWeights = { ...defaultWeights, ...weights }
  
  // Create weighted array
  const weightedMantras: string[] = []
  
  Object.entries(OUTRO_MANTRAS).forEach(([theme, mantras]) => {
    const weight = finalWeights[theme as keyof typeof finalWeights] || 1
    for (let i = 0; i < weight; i++) {
      weightedMantras.push(...mantras)
    }
  })
  
  const randomIndex = Math.floor(Math.random() * weightedMantras.length)
  return weightedMantras[randomIndex]
}

// Future enhancement: Get mantra based on session completion or user state
export function getPersonalizedOutroMantra(sessionData?: {
  completionType?: 'full' | 'partial' | 'breakthrough' | 'challenging'
  userMood?: 'relieved' | 'overwhelmed' | 'clear' | 'uncertain'
  userPersonality?: 'reflective' | 'direct' | 'validating' | 'sorting'
}): string {
  if (!sessionData?.completionType) {
    return getRandomOutroMantra()
  }
  
  // Map session completion types to appropriate themes
  const completionToTheme: Record<string, keyof typeof OUTRO_MANTRAS> = {
    full: 'affirming',      // "You showed up with honesty. That's real progress."
    partial: 'grounding',   // "The pause doesn't end here. It goes with you."
    breakthrough: 'releasing', // "You've set something down here. No need to pick it back up."
    challenging: 'centering'   // "Alignment doesn't mean agreement..."
  }
  
  const theme = completionToTheme[sessionData.completionType]
  return theme ? getRandomOutroMantraByTheme(theme) : getRandomOutroMantra()
}

// Enhanced outro with context-aware selection
export function getContextualOutroMantra(context?: {
  phaseCompleted?: number
  breakthroughMoments?: number
  emotionalIntensity?: 'low' | 'medium' | 'high'
  resolutionLevel?: 'resolved' | 'progress' | 'processing'
}): string {
  if (!context) return getRandomOutroMantra()
  
  // Higher emotional intensity or breakthroughs -> releasing themes
  if (context.emotionalIntensity === 'high' || (context.breakthroughMoments && context.breakthroughMoments > 0)) {
    return getWeightedRandomOutroMantra({ releasing: 3, affirming: 2, grounding: 1, centering: 1 })
  }
  
  // Full completion -> affirming themes
  if (context.phaseCompleted === 7 && context.resolutionLevel === 'resolved') {
    return getWeightedRandomOutroMantra({ affirming: 3, grounding: 2, releasing: 1, centering: 1 })
  }
  
  // Partial completion -> grounding themes
  if (context.phaseCompleted && context.phaseCompleted < 7) {
    return getWeightedRandomOutroMantra({ grounding: 3, centering: 2, affirming: 1, releasing: 1 })
  }
  
  return getRandomOutroMantra()
}
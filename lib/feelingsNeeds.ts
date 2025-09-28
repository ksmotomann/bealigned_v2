export interface Feeling {
  name: string
  category: 'pleasant' | 'unpleasant'
  intensity: 'mild' | 'moderate' | 'strong'
  related: string[]
}

export interface Need {
  name: string
  category: string
  description: string
}

export const FEELINGS_LIST: Feeling[] = [
  // Pleasant Feelings
  { name: 'happy', category: 'pleasant', intensity: 'moderate', related: ['joyful', 'glad', 'pleased'] },
  { name: 'excited', category: 'pleasant', intensity: 'strong', related: ['enthusiastic', 'energized'] },
  { name: 'peaceful', category: 'pleasant', intensity: 'mild', related: ['calm', 'serene', 'tranquil'] },
  { name: 'grateful', category: 'pleasant', intensity: 'moderate', related: ['thankful', 'appreciative'] },
  { name: 'hopeful', category: 'pleasant', intensity: 'moderate', related: ['optimistic', 'encouraged'] },
  { name: 'content', category: 'pleasant', intensity: 'mild', related: ['satisfied', 'fulfilled'] },
  { name: 'loving', category: 'pleasant', intensity: 'strong', related: ['affectionate', 'warm', 'tender'] },
  { name: 'confident', category: 'pleasant', intensity: 'moderate', related: ['assured', 'secure'] },
  { name: 'inspired', category: 'pleasant', intensity: 'strong', related: ['motivated', 'moved'] },
  { name: 'curious', category: 'pleasant', intensity: 'mild', related: ['interested', 'intrigued'] },
  
  // Unpleasant Feelings
  { name: 'sad', category: 'unpleasant', intensity: 'moderate', related: ['unhappy', 'sorrowful'] },
  { name: 'angry', category: 'unpleasant', intensity: 'strong', related: ['mad', 'furious', 'irritated'] },
  { name: 'scared', category: 'unpleasant', intensity: 'strong', related: ['afraid', 'frightened', 'anxious'] },
  { name: 'frustrated', category: 'unpleasant', intensity: 'moderate', related: ['annoyed', 'exasperated'] },
  { name: 'disappointed', category: 'unpleasant', intensity: 'moderate', related: ['let down', 'discouraged'] },
  { name: 'lonely', category: 'unpleasant', intensity: 'moderate', related: ['isolated', 'disconnected'] },
  { name: 'overwhelmed', category: 'unpleasant', intensity: 'strong', related: ['stressed', 'swamped'] },
  { name: 'confused', category: 'unpleasant', intensity: 'mild', related: ['puzzled', 'uncertain'] },
  { name: 'hurt', category: 'unpleasant', intensity: 'moderate', related: ['wounded', 'pained'] },
  { name: 'worried', category: 'unpleasant', intensity: 'moderate', related: ['concerned', 'uneasy'] },
  { name: 'ashamed', category: 'unpleasant', intensity: 'strong', related: ['embarrassed', 'guilty'] },
  { name: 'jealous', category: 'unpleasant', intensity: 'moderate', related: ['envious', 'resentful'] },
  { name: 'tired', category: 'unpleasant', intensity: 'mild', related: ['exhausted', 'fatigued', 'drained'] }
]

export const NEEDS_LIST: Need[] = [
  // Connection Needs
  { name: 'acceptance', category: 'connection', description: 'To be received with respect and love' },
  { name: 'affection', category: 'connection', description: 'Expressing and receiving care' },
  { name: 'appreciation', category: 'connection', description: 'Having efforts and contributions valued' },
  { name: 'belonging', category: 'connection', description: 'Feeling part of a community' },
  { name: 'closeness', category: 'connection', description: 'Emotional and physical proximity' },
  { name: 'communication', category: 'connection', description: 'Being heard and understood' },
  { name: 'companionship', category: 'connection', description: 'Having others to share experiences with' },
  { name: 'compassion', category: 'connection', description: 'Receiving empathy and kindness' },
  { name: 'consideration', category: 'connection', description: 'Having needs and preferences taken into account' },
  { name: 'empathy', category: 'connection', description: 'Being understood emotionally' },
  { name: 'inclusion', category: 'connection', description: 'Being included and involved' },
  { name: 'intimacy', category: 'connection', description: 'Deep sharing and vulnerability' },
  { name: 'love', category: 'connection', description: 'Giving and receiving deep care' },
  { name: 'respect', category: 'connection', description: 'Being valued for who you are' },
  { name: 'support', category: 'connection', description: 'Having help when needed' },
  { name: 'trust', category: 'connection', description: 'Feeling safe to be vulnerable' },
  { name: 'understanding', category: 'connection', description: 'Being comprehended and seen' },
  
  // Physical Well-being
  { name: 'air', category: 'physical', description: 'Clean air to breathe' },
  { name: 'food', category: 'physical', description: 'Nourishment for the body' },
  { name: 'health', category: 'physical', description: 'Physical wellness and vitality' },
  { name: 'movement', category: 'physical', description: 'Physical activity and exercise' },
  { name: 'rest', category: 'physical', description: 'Adequate sleep and relaxation' },
  { name: 'safety', category: 'physical', description: 'Protection from harm' },
  { name: 'shelter', category: 'physical', description: 'Adequate housing and protection' },
  { name: 'water', category: 'physical', description: 'Clean water for drinking' },
  
  // Autonomy
  { name: 'choice', category: 'autonomy', description: 'Having options and alternatives' },
  { name: 'freedom', category: 'autonomy', description: 'Independence and self-determination' },
  { name: 'independence', category: 'autonomy', description: 'Self-reliance and self-sufficiency' },
  { name: 'space', category: 'autonomy', description: 'Physical and emotional room' },
  { name: 'spontaneity', category: 'autonomy', description: 'Acting on impulse and inspiration' },
  
  // Meaning
  { name: 'accomplishment', category: 'meaning', description: 'Achieving goals and objectives' },
  { name: 'contribution', category: 'meaning', description: 'Making a difference' },
  { name: 'creativity', category: 'meaning', description: 'Expressing originality and imagination' },
  { name: 'growth', category: 'meaning', description: 'Learning and developing' },
  { name: 'hope', category: 'meaning', description: 'Belief in positive possibilities' },
  { name: 'learning', category: 'meaning', description: 'Acquiring knowledge and skills' },
  { name: 'purpose', category: 'meaning', description: 'Having direction and meaning' },
  
  // Peace
  { name: 'beauty', category: 'peace', description: 'Appreciating aesthetics and nature' },
  { name: 'comfort', category: 'peace', description: 'Physical and emotional ease' },
  { name: 'ease', category: 'peace', description: 'Absence of difficulty or effort' },
  { name: 'harmony', category: 'peace', description: 'Balance and agreement' },
  { name: 'order', category: 'peace', description: 'Structure and organization' },
  { name: 'peace', category: 'peace', description: 'Tranquility and calm' },
  { name: 'relaxation', category: 'peace', description: 'Release of tension' },
  
  // Play
  { name: 'adventure', category: 'play', description: 'Excitement and new experiences' },
  { name: 'excitement', category: 'play', description: 'Stimulation and thrill' },
  { name: 'fun', category: 'play', description: 'Enjoyment and amusement' },
  { name: 'humor', category: 'play', description: 'Laughter and lightness' },
  { name: 'joy', category: 'play', description: 'Happiness and delight' },
  { name: 'play', category: 'play', description: 'Recreation and games' },
  
  // Integrity
  { name: 'authenticity', category: 'integrity', description: 'Being true to yourself' },
  { name: 'honesty', category: 'integrity', description: 'Truthfulness and transparency' },
  { name: 'integrity', category: 'integrity', description: 'Alignment with values' },
  { name: 'presence', category: 'integrity', description: 'Being fully here and now' }
]

export function getFeelingsByCategory(category: 'pleasant' | 'unpleasant'): Feeling[] {
  return FEELINGS_LIST.filter(feeling => feeling.category === category)
}

export function getNeedsByCategory(category: string): Need[] {
  return NEEDS_LIST.filter(need => need.category === category)
}

export function getNeedCategories(): string[] {
  return [...new Set(NEEDS_LIST.map(need => need.category))]
}

export function searchFeelings(query: string): Feeling[] {
  const lowercaseQuery = query.toLowerCase()
  return FEELINGS_LIST.filter(feeling => 
    feeling.name.includes(lowercaseQuery) ||
    feeling.related.some(related => related.includes(lowercaseQuery))
  )
}

export function searchNeeds(query: string): Need[] {
  const lowercaseQuery = query.toLowerCase()
  return NEEDS_LIST.filter(need => 
    need.name.includes(lowercaseQuery) ||
    need.description.toLowerCase().includes(lowercaseQuery)
  )
}
export const deeperNeeds = [
  // Security & Stability
  'safety',
  'trust',
  'reliability',
  'consistency',
  'certainty',
  'health',
  'competence',

  // Connection & Belonging
  'love',
  'care',
  'to be heard',
  'to be seen',
  'belonging',
  'inclusion',
  'connection',
  'understanding',
  'empathy',
  'attention',
  'to be acknowledged',

  // Growth & Purpose
  'learning',
  'contribution',
  'competence',
  'purpose',
  'independence',
  'freedom',
  'power',
  'performance',
  'recognition',

  // Respect & Dignity
  'fairness',
  'accountability',
  'dignity',
  'respect',
  'authenticity',
  'to matter',
  'consideration',
  'justice',

  // Harmony & Peace
  'calm',
  'harmony',
  'peace',
  'acceptance',
  'understanding',
  'transparency',
  'honesty',
  'clarity',
  'celebration',
  'reassurance',
  'hope',
  'rest',
  'fun',
  'space',
  'privacy'
];

export const needsGlossary = {
  connection: "The need to feel linked to others",
  understanding: "The need to be comprehended and heard",
  respect: "The need to be valued and honored",
  security: "The need to feel safe and protected",
  autonomy: "The need for independence and choice",
  love: "The need for affection and care",
  acceptance: "The need to be received as you are",
  support: "The need for help and encouragement",
  trust: "The need for reliability and confidence",
  fairness: "The need for justice and equity",
  recognition: "The need to be seen and acknowledged",
  belonging: "The need to be part of something",
  peace: "The need for calm and tranquility",
  safety: "The need for protection from harm",
  validation: "The need for confirmation and approval",
  freedom: "The need for liberty and space",
  cooperation: "The need to work together harmoniously",
  harmony: "The need for balance and agreement",
  empathy: "The need to be understood emotionally",
  compassion: "The need for kindness and care",
  consistency: "The need for predictability",
  reliability: "The need for dependability",
  honesty: "The need for truthfulness",
  transparency: "The need for openness and clarity",
  growth: "The need for development and progress",
  learning: "The need for knowledge and understanding",
  creativity: "The need for expression and innovation",
  meaning: "The need for significance and purpose",
  purpose: "The need for direction and intention",
  achievement: "The need for accomplishment and success"
};

export interface Need {
  name: string;
  definition: string;
  category: 'basic' | 'emotional' | 'growth';
}

export const categorizeNeeds = (): { [key: string]: Need[] } => {
  const basic = ['security', 'safety', 'trust', 'consistency', 'reliability'].map(need => ({
    name: need,
    definition: needsGlossary[need as keyof typeof needsGlossary],
    category: 'basic' as const
  }));

  const emotional = ['connection', 'understanding', 'respect', 'love', 'acceptance', 'support', 'fairness', 'recognition', 'belonging', 'peace', 'validation', 'freedom', 'harmony', 'empathy', 'compassion', 'honesty', 'transparency'].map(need => ({
    name: need,
    definition: needsGlossary[need as keyof typeof needsGlossary],
    category: 'emotional' as const
  }));

  const growth = ['autonomy', 'cooperation', 'growth', 'learning', 'creativity', 'meaning', 'purpose', 'achievement'].map(need => ({
    name: need,
    definition: needsGlossary[need as keyof typeof needsGlossary],
    category: 'growth' as const
  }));

  return { basic, emotional, growth };
};

export const getAllNeeds = (): Need[] => {
  return deeperNeeds.map(need => ({
    name: need,
    definition: needsGlossary[need as keyof typeof needsGlossary],
    category: 'emotional' as const // Default category
  }));
};
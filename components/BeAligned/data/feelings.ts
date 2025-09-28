export const surfaceFeelings = [
  'angry',
  'pissed',
  'frustrated',
  'irritated',
  'furious',
  'stressed',
  'overwhelmed',
  'envious',
  'shocked',
  'distracted',
  'exhausted',
  'anxious',
  'disappointed',
  'contempt',
  'surprised',
  'disgusted',
  'excited',
  'worried',
  'overwhelmed'
];

export const coreFeelings = [
  'hurt',
  'fear',
  'guilt',
  'grief',
  'shame',
  'sad',
  'disappointed',
  'lonely',
  'vulnerable',
  'powerless',
  'torn',
  'terrified',
  'hopeless',
  'unhappy',
  'confused',
  'disconnected',
  'discouraged',
  'remorseful'
];

export const positiveEmotions = [
  'calm',
  'energetic',
  'engaged',
  'interested',
  'inspired',
  'peaceful',
  'joyful',
  'satisfied',
  'relieved',
  'happy',
  'content',
  'hopeful',
  'compassion',
  'confident',
  'grateful',
  'excited',
  'comfortable',
  'guarded',
  'reluctant',
  'open',
  'relaxed'
];

export const feelingsGlossary = {
  // Surface Feelings (Hot Emotions)
  angry: "A strong feeling of displeasure or hostility",
  pissed: "Intensely angry or annoyed",
  frustrated: "Feeling upset because you can't achieve something",
  irritated: "Feeling annoyed or impatient",
  furious: "Extremely angry",
  stressed: "Feeling pressured or unable to cope",
  overwhelmed: "Feeling like you have too much to handle",
  anxious: "Feeling worried or nervous about something",

  // Vulnerable Feelings (Deeper Emotions)
  hurt: "Emotional pain from being wounded or injured",
  fear: "An unpleasant emotion caused by threat or danger",
  guilt: "Feeling responsible for wrongdoing",
  grief: "Deep sorrow from loss",
  shame: "Painful feeling of humiliation or distress",
  sad: "Feeling sorrow or unhappiness",
  disappointed: "Feeling let down when expectations aren't met",
  lonely: "Feeling isolated or lacking connection",
  vulnerable: "Feeling exposed or defenseless",
  powerless: "Feeling unable to control or influence",

  // Nuanced Feelings
  confused: "Feeling uncertain or unclear about something",
  discouraged: "Feeling less hopeful or confident",
  resentful: "Feeling bitter or indignant",
  uncomfortable: "Feeling uneasy or awkward",
  disconnected: "Feeling separated or out of touch",

  // Positive/Strength Feelings
  hopeful: "Feeling optimistic about the future",
  peaceful: "Feeling calm and tranquil",
  joyful: "Feeling great happiness",
  grateful: "Feeling thankful and appreciative",
  engaged: "Feeling involved and interested",
  calm: "Feeling relaxed and serene",
  confident: "Feeling self-assured and certain"
};

export interface Feeling {
  name: string;
  category: 'surface' | 'core';
  definition?: string;
  intensity?: 1 | 2 | 3 | 4 | 5;
}

export const getAllFeelings = (): Feeling[] => {
  const surface = surfaceFeelings.map(feeling => ({
    name: feeling,
    category: 'surface' as const,
    definition: feelingsGlossary[feeling as keyof typeof feelingsGlossary]
  }));

  const core = coreFeelings.map(feeling => ({
    name: feeling,
    category: 'core' as const,
    definition: feelingsGlossary[feeling as keyof typeof feelingsGlossary]
  }));

  return [...surface, ...core];
};
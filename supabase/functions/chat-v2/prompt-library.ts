/**
 * Prompt Library for BeAligned Flow Engine
 * Extracted from assets/master/prompt_library.md and assets/master/instructions.md
 */

import { FlowPhase } from './types.ts'

interface PromptSet {
  primary: string[]
  reprompt: string[]
  transition?: string
  coaching_mindset: string
}

/**
 * Prompt library based on master architecture
 * Each phase has multiple prompt variations for natural conversation
 */
export const PROMPT_LIBRARY: Record<FlowPhase, PromptSet> = {
  issue: {
    coaching_mindset: "Name the storm without becoming it.",
    primary: [
      "What's the situation that's been sticking with you lately?",
      "What's been feeling hardest to navigate lately?",
      "Tell me what's happening in your co-parenting dynamic right now.",
      "What part of this situation feels unclear or stuck?",
      "What's the main thing on your mind today?"
    ],
    reprompt: [
      "That makes sense. What about this situation feels most important to talk through first?",
      "What do you wish your co-parent could understand about this?",
      "If you had to summarize the main challenge in one sentence, what would it be?"
    ],
    transition: "What feelings come up when you think about this?"
  },

  feelings: {
    coaching_mindset: "When we can name what we feel, we can choose how to heal.",
    primary: [
      "What feelings come up when you think about this?",
      "What emotions come up for you when this happens?",
      "How do you feel in those moments?",
      "What emotion feels strongest right now — frustration, sadness, fear, something else?",
      "Sometimes anger masks hurt, or control masks fear. What might be underneath that for you?"
    ],
    reprompt: [
      "What do you think that feeling is trying to tell you?",
      "If your child were watching this moment, what would they notice about your feelings?",
      "If your emotion could speak, what would it say?",
      "Sometimes our feelings point to something we're trying to protect. What might that be?"
    ],
    transition: "What is it about this that feels important to you?"
  },

  why: {
    coaching_mindset: "The 'because' reveals the 'why.'",
    primary: [
      "What is it about this that feels important to you?",
      "What are you hoping for — for your child, for yourself, or for the relationship?",
      "What matters most to you about this situation?",
      "Why is this important for you and your child?",
      "What do you want your child to learn from how you handle this?"
    ],
    reprompt: [
      "That's a strong why. Is there another layer underneath that?",
      "Sometimes our why points to something we're trying to protect. What might that be?",
      "What would 'better' look like for you and your child?"
    ],
    transition: "If your co-parent described this, how might they see it?"
  },

  coparent: {
    coaching_mindset: "Perspective isn't agreement; it's understanding.",
    primary: [
      "If your co-parent described this, how might they see it?",
      "Even if you don't agree, what do you imagine they're feeling or needing?",
      "How do you think your co-parent might be feeling in this situation?",
      "What might be motivating your co-parent's choices?",
      "How might this look from a third side — someone neutral?"
    ],
    reprompt: [
      "Even if you don't agree, can you see what might be motivating your co-parent's choices?",
      "What do you think your co-parent needs most right now?",
      "What might be underneath their behavior or decisions?"
    ],
    transition: "Let's shift into your child's perspective."
  },

  child: {
    coaching_mindset: "The child's needs are the North Star.",
    primary: [
      "What might your child be noticing about this?",
      "How do you think your child is feeling?",
      "What do you think your child needs most right now?",
      "If your child could tell you what they're experiencing, what might they say?",
      "How might your child be carrying this situation?"
    ],
    reprompt: [
      "What do you notice when you imagine it through your child's eyes?",
      "What would your child hope you'd do in this situation?",
      "What does your child need to feel safe and seen right now?"
    ],
    transition: "Given everything we've explored — your why, your co-parent's possible why, your child's needs — here are a few ideas."
  },

  options: {
    coaching_mindset: "When we stay curious, possibilities multiply.",
    primary: [
      "Given everything we've explored — your why, your co-parent's possible why, your child's needs — what ideas come to mind?",
      "What are a few ways this could go differently next time?",
      "What could help reduce tension in this situation?",
      "If you could choose three realistic steps forward, what might they be?",
      "What possibilities might we uncover?"
    ],
    reprompt: [
      "Let's aim for small, doable steps. What's one thing you could try in the next week?",
      "Which option feels most possible given where things are right now?",
      "What have you already tried that worked even a little?"
    ],
    transition: "Would you like help choosing or crafting a message?"
  },

  message: {
    coaching_mindset: "What's clear is kind.",
    primary: [
      "Would you like help crafting a message that reflects this shared purpose?",
      "Would you like to practice how to say that to your co-parent?",
      "How can you phrase that so it's easy for them to hear?",
      "What would this message sound like if it were concise and calm?",
      "Let's craft it in a way that centers your child's stability."
    ],
    reprompt: [
      "That's close. Want to see if it passes the CLEAR test?",
      "What might make this message easier for the other person to receive?",
      "How might you open this message with appreciation or neutrality?"
    ]
  }
}

/**
 * Select a prompt from the library
 * @param phase Current flow phase
 * @param promptType Type of prompt to select
 * @param random Whether to randomize selection (default: true)
 */
export function selectPrompt(
  phase: FlowPhase,
  promptType: 'primary' | 'reprompt' = 'primary',
  random = true
): string {
  const prompts = PROMPT_LIBRARY[phase][promptType]

  if (!prompts || prompts.length === 0) {
    throw new Error(`No ${promptType} prompts found for phase: ${phase}`)
  }

  if (random) {
    return prompts[Math.floor(Math.random() * prompts.length)]
  }

  return prompts[0]
}

/**
 * Get coaching mindset for a phase
 */
export function getCoachingMindset(phase: FlowPhase): string {
  return PROMPT_LIBRARY[phase].coaching_mindset
}

/**
 * Get transition prompt to next phase
 */
export function getTransitionPrompt(phase: FlowPhase): string | undefined {
  return PROMPT_LIBRARY[phase].transition
}

/**
 * Governance Utilities
 *
 * Helper functions to load BeAligned™ governance documents.
 * These documents define AI behavior, prompts, and BeH2O® principles.
 *
 * Source files located in: /governance/
 */

export interface BeH2OPrinciple {
  name: string
  description: string
}

export interface BeAlignedIdea {
  name: string
  description: string
}

export interface CLEARComponent {
  letter: string
  word: string
  description: string
}

export interface BeH2OPrinciples {
  source: string
  version: string
  beh2o_principles: {
    metaphor: string
    core_principles: BeH2OPrinciple[]
    emphasis: string[]
  }
  bealigned_mindset: {
    description: string
    core_ideas: BeAlignedIdea[]
    tagline: string
  }
  frameworks: {
    clear: {
      name: string
      components: CLEARComponent[]
    }
    third_side: {
      name: string
      description: string
      purpose: string
    }
  }
}

export interface PhasePrompts {
  phase_name: string
  goal: string
  primary_prompts: string[]
  follow_up_prompts: string[]
  guidance: string[]
  completion_criteria: string
}

export interface PromptLibrary {
  source: string
  version: string
  phases: Record<string, PhasePrompts>
  general_guidance: string[]
}

/**
 * Load BeH2O® principles and BeAligned™ mindset
 */
export async function loadBeH2OPrinciples(): Promise<BeH2OPrinciples> {
  try {
    const response = await fetch('/governance/beh2o-principles.json')
    if (!response.ok) {
      throw new Error(`Failed to load BeH2O principles: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading BeH2O principles:', error)
    throw error
  }
}

/**
 * Load GPT system instructions
 */
export async function loadGPTInstructions(): Promise<string> {
  try {
    const response = await fetch('/governance/gpt-instructions.txt')
    if (!response.ok) {
      throw new Error(`Failed to load GPT instructions: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error loading GPT instructions:', error)
    throw error
  }
}

/**
 * Load prompt library for all 7 phases
 */
export async function loadPromptLibrary(): Promise<PromptLibrary> {
  try {
    const response = await fetch('/governance/prompt-library.json')
    if (!response.ok) {
      throw new Error(`Failed to load prompt library: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading prompt library:', error)
    throw error
  }
}

/**
 * Get prompts for a specific phase
 */
export async function getPhasePrompts(phaseNumber: number): Promise<PhasePrompts | null> {
  try {
    const library = await loadPromptLibrary()
    return library.phases[phaseNumber.toString()] || null
  } catch (error) {
    console.error(`Error loading prompts for phase ${phaseNumber}:`, error)
    return null
  }
}

/**
 * Select a random prompt from an array
 */
export function selectRandomPrompt(prompts: string[]): string {
  if (!prompts || prompts.length === 0) {
    return ''
  }
  return prompts[Math.floor(Math.random() * prompts.length)]
}

/**
 * Format BeH2O principles for system prompt injection
 */
export function formatBeH2OPrinciples(principles: BeH2OPrinciples): string {
  const formatted = principles.beh2o_principles.core_principles
    .map(p => `- ${p.name}: ${p.description}`)
    .join('\n')

  return `BeH2O® Core Principles:\n${formatted}`
}

/**
 * Format BeAligned mindset for system prompt injection
 */
export function formatBeAlignedMindset(principles: BeH2OPrinciples): string {
  const formatted = principles.bealigned_mindset.core_ideas
    .map(idea => `- ${idea.name}: ${idea.description}`)
    .join('\n')

  return `BeAligned™ Mindset:\n${formatted}`
}

/**
 * Load all governance documents at once
 */
export async function loadAllGovernance() {
  const [instructions, principles, prompts] = await Promise.all([
    loadGPTInstructions(),
    loadBeH2OPrinciples(),
    loadPromptLibrary()
  ])

  return {
    instructions,
    principles,
    prompts
  }
}

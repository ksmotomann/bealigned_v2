/**
 * TypeScript types for BeAligned Flow Engine (chat-v2)
 * Based on assets/master/architecture.md (FlowState model)
 * and assets/master/typescript.md (type definitions)
 * and assets/master/json.md (JSON response formats)
 */

export type FlowPhase =
  | 'issue'       // Phase 1: Let's Name It
  | 'feelings'    // Phase 2: What's Beneath That
  | 'why'         // Phase 3: Your Why
  | 'coparent'    // Phase 4: Step Into Your Co-Parent's Shoes
  | 'child'       // Phase 5: See Through Your Child's Eyes
  | 'options'     // Phase 6: Explore Aligned Options
  | 'message'     // Phase 7: Choose + Communicate

export interface FlowContext {
  issue?: string
  feelings?: string
  why?: string
  coparent?: string       // Phase 4: Co-parent's perspective
  child?: string          // Phase 5: Child's perspective/needs
  options?: string[]      // Phase 6: Aligned options presented
  chosenOption?: string   // Phase 6: User's selected option
  finalReflection?: string  // Meta-reflection after Phase 7 completion
}

export interface FlowState {
  readiness: number              // 0-1 clarity/confidence level
  context: FlowContext           // Accumulated conversation context
  lastPrompt: string             // Last AI-generated question
  lastResponse: string           // User's most recent input
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    readiness?: number
    timestamp: string
  }>
}

export interface AIReflectionRequest {
  userInput: string
  currentPhase: FlowPhase
  flowState: FlowState
  sessionId: string
  sessionContext?: Record<string, any>
}

export interface AIReflectionResponse {
  summary: string                // Distills user's response
  next_prompt: string           // Next question to ask
  readiness: number             // 0-1 clarity score
  suggested_next_phase?: FlowPhase | null  // Or null to stay
  context_updates: Partial<FlowContext>    // Updates to context
}

export interface PromptLibraryEntry {
  phase: FlowPhase
  prompt_type: 'primary' | 'reprompt' | 'transition'
  prompt_text: string
  coaching_mindset?: string
}

/**
 * Readiness Scoring Guide
 *
 * < 0.3: User is vague, defensive, or unclear
 * 0.3-0.6: User is engaged but needs deeper exploration
 * 0.7-0.8: User has genuine clarity, ready to advance
 * 0.9+: User has profound insight
 *
 * Threshold: readiness >= 0.7 to advance phase
 */
export const READINESS_THRESHOLD = 0.7

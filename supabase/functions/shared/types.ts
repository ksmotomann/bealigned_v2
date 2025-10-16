/**
 * Shared Types for BeAligned Chat Versioning System
 * Used across all chat versions (v1, v2, v3)
 */

// Re-export types from chat-v2 for backwards compatibility
export type FlowPhase =
  | 'issue'
  | 'feelings'
  | 'why'
  | 'coparent'
  | 'child'
  | 'options'
  | 'message'

export interface FlowContext {
  issue?: string
  feelings?: string
  why?: string
  coparent?: string
  child?: string
  options?: string[]
  chosenOption?: string
  finalReflection?: string
}

export interface FlowState {
  readiness: number
  context: FlowContext
  lastPrompt: string
  lastResponse: string
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
  summary: string
  next_prompt: string
  readiness: number
  suggested_next_phase?: FlowPhase | null
  context_updates: Partial<FlowContext>
}

export const READINESS_THRESHOLD = 0.7

// =====================================================
// VERSION SYSTEM TYPES
// =====================================================

export interface ChatVersion {
  version: number
  display_name: string
  edge_function_name: string
  default_model: string
  default_temperature: number
  default_max_tokens: number
  temperature_min: number
  temperature_max: number
  max_tokens_cap: number
  phase_token_overrides?: Record<string, number> | null
  scoring_module: string
  retrieval_module: string
  prompts_module: string
  is_default: boolean
  is_admin_only: boolean
  created_at: string
}

export interface ModelConfig {
  model: string
  temperature: number
  max_tokens: number
}

export interface SessionConfig {
  chat_version: number
  ai_model?: string | null
  temperature?: number | null
  max_tokens?: number | null
  version_config?: Record<string, any> | null
}

// =====================================================
// RETRIEVAL TYPES (V3)
// =====================================================

export interface RetrievalResult {
  source: 'principle' | 'exemplar' | 'flow'
  id: string
  score: number
  snippet: string
  metadata?: Record<string, any>
}

export interface RetrievalContext {
  phase: FlowPhase
  userInput: string
  flowState: FlowState
  retrievalMode: 'disabled' | 'v3'
}

// =====================================================
// TELEMETRY TYPES
// =====================================================

export interface TraceEntry {
  session_id: string
  chat_version: number
  model: string
  temperature: number
  max_output_tokens: number
  retrieved_ids?: string[]
  readiness: number
  phase: FlowPhase
  timestamp: string
}

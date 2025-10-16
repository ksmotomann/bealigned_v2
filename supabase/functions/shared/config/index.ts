/**
 * Shared Configuration Module
 * Loads chat version config and validates/clamps parameters
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { ChatVersion, ModelConfig, SessionConfig } from '../types.ts'

/**
 * Load version configuration from database
 */
export async function loadVersionConfig(
  version: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<ChatVersion> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from('chat_versions')
    .select('*')
    .eq('version', version)
    .single()

  if (error || !data) {
    console.error(`❌ Failed to load version ${version}:`, error)
    throw new Error(`Version ${version} not found`)
  }

  return data as ChatVersion
}

/**
 * Get default version from database
 */
export async function getDefaultVersion(
  supabaseUrl: string,
  supabaseKey: string
): Promise<number> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .rpc('get_default_chat_version')

  if (error || !data) {
    console.warn('⚠️ Could not fetch default version, using fallback: 2')
    return 2 // Fallback to v2
  }

  return data as number
}

/**
 * Clamp parameters to version limits
 */
export function clampParams(
  versionConfig: ChatVersion,
  overrides?: Partial<ModelConfig>
): ModelConfig {
  const temperature = overrides?.temperature !== undefined
    ? Math.max(
        versionConfig.temperature_min,
        Math.min(versionConfig.temperature_max, overrides.temperature)
      )
    : versionConfig.default_temperature

  const max_tokens = overrides?.max_tokens !== undefined
    ? Math.min(versionConfig.max_tokens_cap, overrides.max_tokens)
    : versionConfig.default_max_tokens

  const model = overrides?.model || versionConfig.default_model

  return {
    model,
    temperature,
    max_tokens
  }
}

/**
 * Get phase-specific token override if configured
 */
export function getPhaseTokens(
  versionConfig: ChatVersion,
  phase: string,
  defaultTokens: number
): number {
  if (!versionConfig.phase_token_overrides) {
    return defaultTokens
  }

  const override = versionConfig.phase_token_overrides[`phase_${phase}`]
  return override || defaultTokens
}

/**
 * Load session configuration
 */
export async function loadSessionConfig(
  sessionId: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SessionConfig | null> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from('reflection_sessions')
    .select('chat_version, ai_model, temperature, max_tokens, version_config')
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    console.error(`❌ Failed to load session ${sessionId}:`, error)
    return null
  }

  return data as SessionConfig
}

/**
 * Update session configuration
 */
export async function updateSessionConfig(
  sessionId: string,
  config: Partial<SessionConfig>,
  supabaseUrl: string,
  supabaseKey: string
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { error } = await supabase
    .from('reflection_sessions')
    .update(config)
    .eq('id', sessionId)

  if (error) {
    console.error(`❌ Failed to update session ${sessionId}:`, error)
    return false
  }

  return true
}

/**
 * Validate temperature against version limits
 */
export function validateTemperature(
  temperature: number,
  versionConfig: ChatVersion
): boolean {
  return temperature >= versionConfig.temperature_min
    && temperature <= versionConfig.temperature_max
}

/**
 * Validate max_tokens against version limits
 */
export function validateMaxTokens(
  maxTokens: number,
  versionConfig: ChatVersion
): boolean {
  return maxTokens > 0 && maxTokens <= versionConfig.max_tokens_cap
}

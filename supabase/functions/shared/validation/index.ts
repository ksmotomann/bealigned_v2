/**
 * Backend Parameter Validation
 *
 * Server-side validation and clamping of AI parameters
 * based on chat_versions limits. Never trust client input.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import type { ChatVersion } from '../types.ts'

/**
 * Clamp and validate parameters according to version limits
 *
 * @param versionRow - The chat_versions row with limits
 * @param clientParams - Parameters sent from client
 * @returns Validated and clamped parameters
 */
export function clampParams(
  versionRow: ChatVersion,
  clientParams?: {
    model?: string
    temperature?: number
    max_tokens?: number
  }
): {
  model: string
  temperature: number
  max_tokens: number
} {
  // Use defaults if client didn't specify
  const model = clientParams?.model || versionRow.default_model

  // Clamp temperature to version-specific range
  let temperature = clientParams?.temperature ?? versionRow.default_temperature
  temperature = Math.max(
    versionRow.temperature_min,
    Math.min(versionRow.temperature_max, temperature)
  )

  // Clamp max_tokens to version cap
  let max_tokens = clientParams?.max_tokens ?? versionRow.default_max_tokens
  max_tokens = Math.min(versionRow.max_tokens_cap, max_tokens)

  console.log('🔒 Backend parameter clamping:', {
    version: versionRow.version,
    clientRequested: clientParams,
    clamped: { model, temperature, max_tokens },
    limits: {
      temperature: `${versionRow.temperature_min}-${versionRow.temperature_max}`,
      max_tokens: `<=${versionRow.max_tokens_cap}`
    }
  })

  return { model, temperature, max_tokens }
}

/**
 * Load version config and validate parameters in one call
 *
 * @param version - Version number
 * @param clientParams - Client-provided parameters
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service key
 * @returns Version config and validated parameters
 */
export async function loadAndValidateVersion(
  version: number,
  clientParams: {
    model?: string
    temperature?: number
    max_tokens?: number
  } | undefined,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{
  versionConfig: ChatVersion
  validatedParams: {
    model: string
    temperature: number
    max_tokens: number
  }
}> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Fetch version config
  const { data: versionRow, error } = await supabase
    .from('chat_versions')
    .select('*')
    .eq('version', version)
    .single()

  if (error || !versionRow) {
    throw new Error(`Version ${version} not found in database`)
  }

  const versionConfig = versionRow as ChatVersion

  // Clamp parameters
  const validatedParams = clampParams(versionConfig, clientParams)

  return { versionConfig, validatedParams }
}

/**
 * Validate temperature is within version limits (boolean check)
 *
 * @param version - Version number
 * @param temperature - Temperature to validate
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service key
 * @returns true if valid, false otherwise
 */
export async function validateTemperature(
  version: number,
  temperature: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data } = await supabase
    .from('chat_versions')
    .select('temperature_min, temperature_max')
    .eq('version', version)
    .single()

  if (!data) return false

  return temperature >= data.temperature_min && temperature <= data.temperature_max
}

/**
 * Validate max_tokens is within version cap (boolean check)
 *
 * @param version - Version number
 * @param maxTokens - Max tokens to validate
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service key
 * @returns true if valid, false otherwise
 */
export async function validateMaxTokens(
  version: number,
  maxTokens: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data } = await supabase
    .from('chat_versions')
    .select('max_tokens_cap')
    .eq('version', version)
    .single()

  if (!data) return false

  return maxTokens <= data.max_tokens_cap
}

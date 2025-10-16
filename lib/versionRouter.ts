/**
 * Version-Based Routing Helper
 *
 * Maps chat_version number to the correct edge function endpoint
 * by reading from the chat_versions table.
 */

import { supabase } from './supabase'

interface ChatVersionRow {
  version: number
  edge_function_name: string
  default_model: string
  default_temperature: number
  default_max_tokens: number
  temperature_min: number
  temperature_max: number
  max_tokens_cap: number
}

/**
 * Get the edge function endpoint for a given version
 *
 * @param version - The chat version number (1, 2, 3)
 * @returns The full edge function path
 *
 * @example
 * const endpoint = await getChatEndpoint(2)
 * // Returns: '/functions/v1/chat-v2'
 */
export async function getChatEndpoint(version: number): Promise<string> {
  try {
    // Fetch version config from database
    const { data, error } = await supabase
      .from('chat_versions')
      .select('edge_function_name')
      .eq('version', version)
      .single()

    if (error || !data) {
      console.warn(`⚠️ Version ${version} not found, falling back to chat-v2`)
      return '/functions/v1/chat-v2'
    }

    // Map edge function name to full path
    const endpointMap: Record<string, string> = {
      'chat': '/functions/v1/chat',
      'chat-v2': '/functions/v1/chat-v2',
      'chat-v3': '/functions/v1/chat-v3'
    }

    const endpoint = endpointMap[data.edge_function_name]

    if (!endpoint) {
      console.warn(`⚠️ Unknown edge function: ${data.edge_function_name}, falling back to chat-v2`)
      return '/functions/v1/chat-v2'
    }

    return endpoint
  } catch (err) {
    console.error('❌ Error fetching chat endpoint:', err)
    return '/functions/v1/chat-v2' // Safe fallback
  }
}

/**
 * Get the edge function name for direct invocation
 *
 * @param version - The chat version number
 * @returns The edge function name (e.g., 'chat-v2')
 *
 * @example
 * const functionName = await getChatFunctionName(2)
 * await supabase.functions.invoke(functionName, { body: {...} })
 */
export async function getChatFunctionName(version: number): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('chat_versions')
      .select('edge_function_name')
      .eq('version', version)
      .single()

    if (error || !data) {
      console.warn(`⚠️ Version ${version} not found, falling back to chat-v2`)
      return 'chat-v2'
    }

    return data.edge_function_name
  } catch (err) {
    console.error('❌ Error fetching chat function name:', err)
    return 'chat-v2' // Safe fallback
  }
}

/**
 * Get full version configuration from database
 *
 * @param version - The chat version number
 * @returns Version configuration object or null
 */
export async function getVersionConfig(version: number): Promise<ChatVersionRow | null> {
  try {
    const { data, error } = await supabase
      .from('chat_versions')
      .select('*')
      .eq('version', version)
      .single()

    if (error || !data) {
      console.error(`❌ Failed to fetch version ${version}:`, error)
      return null
    }

    return data as ChatVersionRow
  } catch (err) {
    console.error('❌ Error fetching version config:', err)
    return null
  }
}

/**
 * Get the default chat version from database
 *
 * @returns The default version number (falls back to 2 if not found)
 */
export async function getDefaultChatVersion(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('chat_versions')
      .select('version')
      .eq('is_default', true)
      .single()

    if (error || !data) {
      console.warn('⚠️ No default version set, using v2')
      return 2
    }

    return data.version
  } catch (err) {
    console.error('❌ Error fetching default version:', err)
    return 2 // Safe fallback
  }
}

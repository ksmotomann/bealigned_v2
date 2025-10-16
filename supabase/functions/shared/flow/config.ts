/**
 * V3 Flow Configuration Runtime Loader
 *
 * Merges database configuration with safe code defaults.
 * DB values override code defaults when available.
 * Falls back to code if DB unavailable.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type PhaseCfg = {
  phase: string
  next_phase: string | 'final'
  min_readiness_to_advance: number
  max_reprompts: number
  allow_deepthink: boolean
  substate_order: string[] | null
  enabled: boolean
}

/**
 * Code defaults - used as fallback if DB unavailable
 * These mirror the seed data but ensure system works without DB
 */
const CODE_DEFAULTS: Record<string, PhaseCfg> = {
  issue: {
    phase: 'issue',
    next_phase: 'feelings',
    min_readiness_to_advance: 0.85,  // Raised to slow early phase jumps
    max_reprompts: 2,
    allow_deepthink: false,
    substate_order: null,
    enabled: true
  },
  feelings: {
    phase: 'feelings',
    next_phase: 'why',
    min_readiness_to_advance: 0.90,  // Raised to ensure reflection is landed
    max_reprompts: 2,
    allow_deepthink: false,
    substate_order: null,
    enabled: true
  },
  why: {
    phase: 'why',
    next_phase: 'perspective',
    min_readiness_to_advance: 0.90,  // Raised to gate perspective appropriately
    max_reprompts: 2,
    allow_deepthink: false,
    substate_order: null,
    enabled: true
  },
  perspective: {
    phase: 'perspective',
    next_phase: 'options',
    min_readiness_to_advance: 0.7,
    max_reprompts: 2,
    allow_deepthink: false,
    substate_order: null,
    enabled: true
  },
  options: {
    phase: 'options',
    next_phase: 'choose',
    min_readiness_to_advance: 0.7,
    max_reprompts: 2,
    allow_deepthink: false,
    substate_order: null,
    enabled: true
  },
  choose: {
    phase: 'choose',
    next_phase: 'message',
    min_readiness_to_advance: 0.7,
    max_reprompts: 2,
    allow_deepthink: false,
    substate_order: null,
    enabled: true
  },
  message: {
    phase: 'message',
    next_phase: 'final',
    min_readiness_to_advance: 0.7,
    max_reprompts: 2,
    allow_deepthink: true,
    substate_order: ['integrate', 'option', 'coauthor', 'fitcheck', 'contain'],
    enabled: true
  }
}

/**
 * Load flow configuration from database and merge with code defaults
 *
 * @param supabaseClient - Supabase client with service role access
 * @returns Merged configuration map by phase
 */
export async function loadFlowConfig(supabaseClient: SupabaseClient): Promise<Record<string, PhaseCfg>> {
  try {
    const { data, error } = await supabaseClient
      .from('flow_config')
      .select('*')

    if (error) {
      console.warn('⚠️ Failed to load flow_config from DB, using code defaults:', error.message)
      return CODE_DEFAULTS
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No flow_config rows found, using code defaults')
      return CODE_DEFAULTS
    }

    // Start with code defaults, merge DB values
    const merged = { ...CODE_DEFAULTS }

    for (const row of data) {
      // Skip disabled phases
      if (!row.enabled) {
        console.log(`🔒 Phase ${row.phase} is disabled in flow_config`)
        continue
      }

      // Merge DB row with code default for this phase
      merged[row.phase] = {
        phase: row.phase,
        next_phase: row.next_phase,
        min_readiness_to_advance: row.min_readiness_to_advance,
        max_reprompts: row.max_reprompts,
        allow_deepthink: row.allow_deepthink,
        substate_order: row.substate_order,
        enabled: row.enabled
      }
    }

    console.log(`✅ Loaded flow config for ${Object.keys(merged).length} phases`)
    return merged

  } catch (err) {
    console.error('❌ Exception loading flow_config:', err)
    return CODE_DEFAULTS
  }
}

/**
 * Determine if user's readiness score meets threshold to advance
 *
 * @param readiness - Computed readiness score (0.0-1.0)
 * @param cfg - Phase configuration
 * @returns True if ready to advance
 */
export function canAdvance(readiness: number, cfg: PhaseCfg): boolean {
  return readiness >= cfg.min_readiness_to_advance
}

/**
 * Check if reprompt limit has been exceeded
 *
 * @param repromptCount - Number of times user has been re-prompted in this phase
 * @param cfg - Phase configuration
 * @returns True if max reprompts exceeded (force advance)
 */
export function shouldForceAdvance(repromptCount: number, cfg: PhaseCfg): boolean {
  return repromptCount >= cfg.max_reprompts
}

/**
 * Get next substate in message phase flow
 *
 * @param currentSubstate - Current substate
 * @param cfg - Phase configuration (must be 'message' phase)
 * @returns Next substate or null if end of flow
 */
export function getNextSubstate(currentSubstate: string | null, cfg: PhaseCfg): string | null {
  if (!cfg.substate_order || cfg.substate_order.length === 0) {
    return null
  }

  if (!currentSubstate) {
    return cfg.substate_order[0]
  }

  const currentIndex = cfg.substate_order.indexOf(currentSubstate)
  if (currentIndex === -1 || currentIndex === cfg.substate_order.length - 1) {
    return null // End of substates
  }

  return cfg.substate_order[currentIndex + 1]
}

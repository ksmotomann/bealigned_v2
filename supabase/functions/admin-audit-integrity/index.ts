/**
 * Admin Audit Integrity Function
 *
 * Performs governance integrity checks on BeAligned v3 system:
 * - Checks for missing canonical phases
 * - Identifies empty or untagged exemplars
 * - Summarizes phase coverage
 * - Reports last update dates
 *
 * Usage: Run weekly as part of governance review cycle
 * Endpoint: POST /admin-audit-integrity
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PHASE_META } from '../shared/flow/phaseMeta.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface AuditResult {
  timestamp: string
  summary: {
    total_flows: number
    total_exemplars: number
    approved_flows: number
    approved_exemplars: number
    untagged_flows: number
    untagged_exemplars: number
  }
  phase_coverage: Record<string, {
    canonical: boolean
    flows: number
    exemplars: number
    last_updated?: string
    missing_canonical?: boolean
  }>
  issues: Array<{
    severity: 'critical' | 'warning' | 'info'
    category: string
    message: string
    details?: any
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const result: AuditResult = {
      timestamp: new Date().toISOString(),
      summary: {
        total_flows: 0,
        total_exemplars: 0,
        approved_flows: 0,
        approved_exemplars: 0,
        untagged_flows: 0,
        untagged_exemplars: 0
      },
      phase_coverage: {},
      issues: []
    }

    // Get canonical phases from metadata
    const canonicalPhases = Object.entries(PHASE_META)
      .filter(([_, meta]) => !('aliasOf' in meta))
      .map(([key, _]) => key)

    console.log(`📋 Auditing ${canonicalPhases.length} canonical phases:`, canonicalPhases)

    // Audit flows table
    const { data: flows, error: flowsError } = await supabaseClient
      .from('v3_vector.flows')
      .select('phase, tags, status, updated_at')

    if (flowsError) {
      result.issues.push({
        severity: 'critical',
        category: 'database',
        message: 'Failed to query flows table',
        details: flowsError
      })
    } else {
      result.summary.total_flows = flows?.length || 0
      result.summary.approved_flows = flows?.filter(f => f.status === 'approved').length || 0
      result.summary.untagged_flows = flows?.filter(f => !f.tags || f.tags.length === 0).length || 0

      // Group by phase
      flows?.forEach(flow => {
        const phase = flow.phase || 'unknown'
        if (!result.phase_coverage[phase]) {
          result.phase_coverage[phase] = {
            canonical: canonicalPhases.includes(phase),
            flows: 0,
            exemplars: 0
          }
        }
        result.phase_coverage[phase].flows++

        // Track latest update
        if (!result.phase_coverage[phase].last_updated ||
            flow.updated_at > result.phase_coverage[phase].last_updated!) {
          result.phase_coverage[phase].last_updated = flow.updated_at
        }
      })
    }

    // Audit exemplars table
    const { data: exemplars, error: exemplarsError } = await supabaseClient
      .from('v3_vector.exemplars')
      .select('phase, tags, status, updated_at, input_snippet, response_snippet')

    if (exemplarsError) {
      result.issues.push({
        severity: 'critical',
        category: 'database',
        message: 'Failed to query exemplars table',
        details: exemplarsError
      })
    } else {
      result.summary.total_exemplars = exemplars?.length || 0
      result.summary.approved_exemplars = exemplars?.filter(e => e.status === 'approved').length || 0
      result.summary.untagged_exemplars = exemplars?.filter(e => !e.tags || e.tags.length === 0).length || 0

      // Group by phase
      exemplars?.forEach(exemplar => {
        const phase = exemplar.phase || 'unknown'
        if (!result.phase_coverage[phase]) {
          result.phase_coverage[phase] = {
            canonical: canonicalPhases.includes(phase),
            flows: 0,
            exemplars: 0
          }
        }
        result.phase_coverage[phase].exemplars++

        // Track latest update
        if (!result.phase_coverage[phase].last_updated ||
            exemplar.updated_at > result.phase_coverage[phase].last_updated!) {
          result.phase_coverage[phase].last_updated = exemplar.updated_at
        }

        // Check for empty snippets
        if (!exemplar.input_snippet || !exemplar.response_snippet) {
          result.issues.push({
            severity: 'warning',
            category: 'data_quality',
            message: `Exemplar has empty snippet in phase ${phase}`,
            details: { phase, has_input: !!exemplar.input_snippet, has_response: !!exemplar.response_snippet }
          })
        }
      })
    }

    // Check for missing canonical phases
    canonicalPhases.forEach(phase => {
      if (!result.phase_coverage[phase]) {
        result.phase_coverage[phase] = {
          canonical: true,
          flows: 0,
          exemplars: 0,
          missing_canonical: true
        }
        result.issues.push({
          severity: 'critical',
          category: 'coverage',
          message: `Missing canonical phase: ${phase}`,
          details: { phase }
        })
      } else if (result.phase_coverage[phase].flows === 0 && result.phase_coverage[phase].exemplars === 0) {
        result.issues.push({
          severity: 'critical',
          category: 'coverage',
          message: `Canonical phase has zero content: ${phase}`,
          details: { phase }
        })
      } else if (result.phase_coverage[phase].flows === 0) {
        result.issues.push({
          severity: 'warning',
          category: 'coverage',
          message: `Canonical phase missing flow snippets: ${phase}`,
          details: { phase, exemplars: result.phase_coverage[phase].exemplars }
        })
      } else if (result.phase_coverage[phase].exemplars === 0) {
        result.issues.push({
          severity: 'warning',
          category: 'coverage',
          message: `Canonical phase missing exemplars: ${phase}`,
          details: { phase, flows: result.phase_coverage[phase].flows }
        })
      }
    })

    // Check for non-canonical phases (deprecated aliases still in use)
    Object.keys(result.phase_coverage).forEach(phase => {
      if (!result.phase_coverage[phase].canonical) {
        result.issues.push({
          severity: 'warning',
          category: 'deprecated',
          message: `Non-canonical phase found: ${phase}`,
          details: {
            phase,
            flows: result.phase_coverage[phase].flows,
            exemplars: result.phase_coverage[phase].exemplars
          }
        })
      }
    })

    // Check for untagged content
    if (result.summary.untagged_flows > 0) {
      result.issues.push({
        severity: 'warning',
        category: 'data_quality',
        message: `${result.summary.untagged_flows} flow snippets have no tags`,
        details: { count: result.summary.untagged_flows }
      })
    }

    if (result.summary.untagged_exemplars > 0) {
      result.issues.push({
        severity: 'warning',
        category: 'data_quality',
        message: `${result.summary.untagged_exemplars} exemplars have no tags`,
        details: { count: result.summary.untagged_exemplars }
      })
    }

    // Sort issues by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    result.issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    // Log summary
    console.log('📊 Audit Summary:')
    console.log(`  Total Flows: ${result.summary.total_flows} (${result.summary.approved_flows} approved)`)
    console.log(`  Total Exemplars: ${result.summary.total_exemplars} (${result.summary.approved_exemplars} approved)`)
    console.log(`  Issues Found: ${result.issues.length}`)
    console.log(`    Critical: ${result.issues.filter(i => i.severity === 'critical').length}`)
    console.log(`    Warnings: ${result.issues.filter(i => i.severity === 'warning').length}`)
    console.log(`    Info: ${result.issues.filter(i => i.severity === 'info').length}`)

    return new Response(
      JSON.stringify(result, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Audit error:', error)

    return new Response(
      JSON.stringify({
        error: 'Audit failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Enhanced Phase Prompt Interface (clean, no _gpt suffix)
export interface EnhancedPhasePrompt {
  id: string
  semantic_id: string
  phase_name: string
  phase_header: string
  welcome_prompt: string
  followup_prompts: string[]
  expected_intent: string
  ai_guidance: string
  transition_rules: Record<string, any>
  reflection_goal: string
  validation_keywords: string[]
  example_responses: string
  phase_number: number
  is_active: boolean
}

// Legacy compatibility interface (for existing UI code)
export interface ReflectionStep {
  number: number
  title: string
  description: string
  prompts: string[]
  validationCriteria: string[]
  helpText: string
}

interface UsePhasePromptsReturn {
  // Legacy compatibility (for existing code)
  phases: ReflectionStep[]
  loading: boolean
  error: string | null
  refreshPhases: () => Promise<void>

  // Enhanced capabilities
  enhancedPhases: EnhancedPhasePrompt[]
  getPhaseBySemanticId: (semanticId: string) => EnhancedPhasePrompt | undefined
  getPhaseByNumber: (phaseNumber: number) => EnhancedPhasePrompt | undefined
  getValidationKeywords: (phaseNumber: number) => string[]
  getAIGuidance: (phaseNumber: number) => string
  getExpectedIntent: (phaseNumber: number) => string
  getWelcomePrompt: (phaseNumber: number) => string
}

// Fallback data for offline/error scenarios
const FALLBACK_PHASES: ReflectionStep[] = [
  {
    number: 1,
    title: "🌿 PHASE 1: LET'S NAME IT",
    description: "What's the situation that's been sticking with you lately?",
    prompts: ['What specific situation would you like to reflect on?'],
    validationCriteria: ['Issue is stated clearly and briefly'],
    helpText: 'Start by expressing what\'s weighing on you, even if it feels messy.'
  },
  {
    number: 2,
    title: "🌊 PHASE 2: WHAT'S BENEATH THAT?",
    description: 'What feelings come up when you think about this?',
    prompts: ['What feelings are coming up for you?'],
    validationCriteria: ['Names specific emotions'],
    helpText: 'Strong emotions like anger often sit on the surface.'
  },
  {
    number: 3,
    title: '💫 PHASE 3: YOUR WHY',
    description: 'What is it about this that feels important to you?',
    prompts: ['Why does this matter to you?'],
    validationCriteria: ['Identifies core values or needs'],
    helpText: 'Your Why is about values, vision, and purpose.'
  },
  {
    number: 4,
    title: "👥 PHASE 4: STEP INTO YOUR CO-PARENT'S SHOES",
    description: 'If your co-parent described this, how might they see it?',
    prompts: ['If you were in their shoes, what might they be worried about?'],
    validationCriteria: ['Shows genuine attempt to understand other perspectives'],
    helpText: 'This isn\'t about agreement; it\'s about awareness.'
  },
  {
    number: 5,
    title: "👁️ PHASE 5: SEE THROUGH YOUR CHILD'S EYES",
    description: 'What might your child be noticing about this?',
    prompts: ['What might your child be noticing about this situation?'],
    validationCriteria: ['Considers child\'s perspective'],
    helpText: 'Center your child\'s experience and needs.'
  },
  {
    number: 6,
    title: '💡 PHASE 6: EXPLORE ALIGNED OPTIONS',
    description: "Given everything we've explored, what ideas come to mind?",
    prompts: ['What possibilities come to mind that might work for everyone?'],
    validationCriteria: ['Generates multiple options'],
    helpText: 'Multiple possibilities create space for creative collaboration.'
  },
  {
    number: 7,
    title: '✉️ PHASE 7: CHOOSE + COMMUNICATE',
    description: 'Which of these feels most aligned with everyone\'s needs?',
    prompts: ['Which approach feels most aligned for you?'],
    validationCriteria: ['Selects preferred approach'],
    helpText: 'Clear communication creates understanding and connection.'
  }
]

export function usePhasePromptsEnhanced(): UsePhasePromptsReturn {
  const [phases, setPhases] = useState<ReflectionStep[]>(FALLBACK_PHASES)
  const [enhancedPhases, setEnhancedPhases] = useState<EnhancedPhasePrompt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transformEnhancedToLegacy = (enhanced: EnhancedPhasePrompt[]): ReflectionStep[] => {
    return enhanced.map(phase => ({
      number: phase.phase_number,
      title: phase.phase_header,
      description: phase.welcome_prompt,
      prompts: [
        phase.welcome_prompt,
        ...(Array.isArray(phase.followup_prompts) ? phase.followup_prompts : [])
      ],
      validationCriteria: [
        phase.expected_intent
      ],
      helpText: phase.reflection_goal || phase.ai_guidance?.substring(0, 150) + '...' || ''
    }))
  }

  const loadPhases = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: enhancedData, error: dbError } = await supabase
        .from('phase_prompts')
        .select('*')
        .order('phase_number')

      if (dbError) {
        console.error('❌ Database error loading enhanced phases:', dbError)
        throw dbError
      }

      if (!enhancedData || enhancedData.length === 0) {
        console.warn('⚠️ No enhanced phases found, using fallback')
        setPhases(FALLBACK_PHASES)
        return
      }

      setEnhancedPhases(enhancedData)

      // Transform for legacy compatibility
      const legacyPhases = transformEnhancedToLegacy(enhancedData)
      setPhases(legacyPhases)

    } catch (err) {
      console.error('❌ Failed to load enhanced phases from database:', err)
      setError(err instanceof Error ? err.message : 'Failed to load enhanced phases')

      // Fallback to hardcoded phases
      setPhases(FALLBACK_PHASES)
      setEnhancedPhases([])

    } finally {
      setLoading(false)
    }
  }

  const refreshPhases = async () => {
    await loadPhases()
  }

  // Enhanced phase lookup functions
  const getPhaseBySemanticId = (semanticId: string): EnhancedPhasePrompt | undefined => {
    return enhancedPhases.find(phase => phase.semantic_id === semanticId)
  }

  const getPhaseByNumber = (phaseNumber: number): EnhancedPhasePrompt | undefined => {
    return enhancedPhases.find(phase => phase.phase_number === phaseNumber)
  }

  const getValidationKeywords = (phaseNumber: number): string[] => {
    const phase = getPhaseByNumber(phaseNumber)
    return phase?.validation_keywords || []
  }

  const getAIGuidance = (phaseNumber: number): string => {
    const phase = getPhaseByNumber(phaseNumber)
    return phase?.ai_guidance || ''
  }

  const getExpectedIntent = (phaseNumber: number): string => {
    const phase = getPhaseByNumber(phaseNumber)
    return phase?.expected_intent || ''
  }

  const getWelcomePrompt = (phaseNumber: number): string => {
    const phase = getPhaseByNumber(phaseNumber)
    return phase?.welcome_prompt || phases.find(p => p.number === phaseNumber)?.description || ''
  }

  useEffect(() => {
    loadPhases()
  }, [])

  return {
    // Legacy compatibility
    phases,
    loading,
    error,
    refreshPhases,

    // Enhanced capabilities
    enhancedPhases,
    getPhaseBySemanticId,
    getPhaseByNumber,
    getValidationKeywords,
    getAIGuidance,
    getExpectedIntent,
    getWelcomePrompt
  }
}

// Helper functions for direct use
export function findPhaseByNumber(phases: EnhancedPhasePrompt[], phaseNumber: number): EnhancedPhasePrompt | undefined {
  return phases.find(phase => phase.phase_number === phaseNumber)
}

export function findPhaseBySemanticId(phases: EnhancedPhasePrompt[], semanticId: string): EnhancedPhasePrompt | undefined {
  return phases.find(phase => phase.semantic_id === semanticId)
}
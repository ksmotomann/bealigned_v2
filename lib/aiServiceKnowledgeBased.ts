// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

import { config as appConfig } from './config'
import { getBeAlignedGPTSystem } from './content'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
  metadata?: {
    isPhaseHeader?: boolean
    phase?: number
  }
}

interface AIResponse {
  content: string
  error?: string
  model?: string
}

// BeAligned content is now loaded dynamically from the content system
import { REFLECTION_STEPS } from './chat'

// Helper to get phase title
const getPhaseTitle = (phaseNumber: number): string => {
  const step = REFLECTION_STEPS.find(s => s.number === phaseNumber)
  return step?.title || `Phase ${phaseNumber}`
}

export async function generateAIResponse(
  userInput: string,
  currentPhase: number,
  conversationHistory: Message[] = [],
  sessionContext: Record<string, any> = {}
): Promise<AIResponse> {
  try {
    console.log('🎯 Using vector-based AI response generation')
    
    // Use the new vector-based AI Edge Function
    const { supabase } = await import('./supabase')
    
    // Generate a session ID if not provided in context
    const sessionId = sessionContext.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        userInput,
        currentPhase,
        conversationHistory: conversationHistory.slice(-10), // Keep last 10 for context
        sessionContext: { ...sessionContext, sessionId },
        sessionId: sessionId
      }
    })

    if (error) {
      console.error('❌ Error calling vector AI Edge Function:', error)
      throw new Error(`Edge Function error: ${error.message}`)
    }

    console.log('✅ Vector-based AI response generated', {
      phase: data.metadata?.phase,
      relevantChunks: data.metadata?.relevantChunks,
      contentPieces: data.metadata?.contentPieces,
      model: data.model
    })
    
    return {
      content: data.content,
      model: data.model || 'gpt-4o-vector',
      metadata: {
        ...data.metadata,
        sessionId,
        vectorBased: true
      },
      // Forward structured phase transition data
      phase_advanced: data.phase_advanced,
      current_phase: data.current_phase,
      next_phase: data.next_phase,
      phase_status: data.phase_status,
      original_phase: data.original_phase,
      guidance_type: data.guidance_type,
      phase_data: data.phase_data
    }
  } catch (error) {
    console.error('❌ Error in vector-based AI generation, falling back to direct API:', error)
    console.error('❌ Full error details:', error.message, error.stack)

    // Fallback to direct API call if Edge Function fails but with structured responses
    try {
      console.log('🔄 Falling back to direct OpenAI API')
      
      // Use structured fallback to prevent phase header generation
      const systemContent = `You are Trina, a warm co-parenting coach using the BeH2O methodology.

Current Phase: ${currentPhase}

CRITICAL: Do NOT include phase headers like "PHASE 2: WHAT'S BENEATH THAT?" in your response.
Do NOT include emojis like 💬 or 🌊 in your response.
Be natural and conversational in your response.
Focus on the current phase objectives only.
Provide warm, reflective guidance without phase transitions.`

      const messages: Message[] = [
        {
          role: 'system',
          content: systemContent
        },
        ...conversationHistory.slice(-10),
        {
          role: 'user',
          content: userInput
        }
      ]

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appConfig.ai.openai.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          temperature: 0.7,
          max_tokens: currentPhase === 6 ? 600 : 300
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: data.choices[0].message.content,
        model: 'gpt-4o-fallback'
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError)
      
      return {
        content: "I'm having trouble connecting right now. Let's take a breath together. What's weighing on your heart today?",
        error: fallbackError.message,
        model: 'fallback-static'
      }
    }
  }
}

// Phase completion check - handled by Edge Function now
export async function checkPhaseCompletion(
  userInput: string,
  currentPhase: number,
  aiResponse: string,
  conversationHistory: Message[] = []
): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase')
    
    const { data, error } = await supabase.functions.invoke('check-phase-completion', {
      body: {
        userInput,
        currentPhase,
        aiResponse,
        conversationHistory: conversationHistory.slice(-20)
      }
    })

    if (error) {
      console.error('❌ Phase completion Edge Function error:', error)
      return false
    }
    
    return data.shouldAdvance || false

  } catch (error) {
    console.error('❌ Phase completion check failed:', error)
    return false
  }
}

// Export phase headers for UI use
// PHASE_HEADERS removed - now using REFLECTION_STEPS as single source of truth
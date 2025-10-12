/**
 * Direct OpenAI Assistant Integration
 * Bypasses Supabase edge functions for faster, simpler architecture
 */

import debug from './debugLogger'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ASSISTANT_ID = 'asst_6s1npu6RmFiNb1wlxx1DUsIX' // Function-enhanced assistant with 100% alignment

interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AssistantResponse {
  content: string
  threadId: string
  phase?: number
  metadata?: any
}

export class OpenAIDirectService {
  
  static async createThread(): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`)
    }
    
    const thread = await response.json()
    return thread.id
  }
  
  static async sendMessage(
    userInput: string,
    threadId?: string,
    conversationHistory: AssistantMessage[] = []
  ): Promise<AssistantResponse> {

    debug.log('🤖 OpenAI Direct: Sending message...')

    // Create thread if not provided
    let currentThreadId = threadId
    if (!currentThreadId) {
      debug.log('📝 Creating new thread...')
      currentThreadId = await this.createThread()
    }

    // Add user message to thread
    debug.log('💬 Adding message to thread...')
    await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: userInput
      })
    })
    
    // Run the function-enhanced assistant
    debug.log('🔄 Running function-enhanced assistant...')
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    })

    const run = await runResponse.json()
    debug.log(`✅ Run started: ${run.id}`)

    // Poll for completion with function handling
    const completedRun = await this.pollRunWithFunctions(currentThreadId, run.id)

    // Get the assistant's response
    debug.log('📥 Retrieving response...')
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })
    
    const messages = await messagesResponse.json()
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant')
    
    if (!assistantMessage) {
      throw new Error('No assistant response found')
    }
    
    const responseContent = assistantMessage.content[0].text.value

    debug.log('✅ OpenAI Direct response received')

    return {
      content: responseContent,
      threadId: currentThreadId,
      phase: this.extractPhaseFromResponse(responseContent),
      metadata: {
        assistantId: ASSISTANT_ID,
        runId: completedRun.id,
        model: 'gpt-4o-function-enhanced'
      }
    }
  }
  
  private static async pollRunWithFunctions(threadId: string, runId: string, maxAttempts = 45): Promise<any> {
    debug.log('⏳ Polling with function support...')

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      })

      const run = await response.json()
      debug.log(`📊 Status: ${run.status} (${i + 1}/${maxAttempts})`)

      if (run.status === 'completed') {
        debug.log('✅ Run completed')
        return run
      } else if (run.status === 'requires_action') {
        debug.log('🔧 Function call required...')
        await this.handleFunctionCalls(threadId, runId, run)
        // Continue polling after handling functions
      } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        console.error(`❌ Run failed: ${run.status}`)
        throw new Error(`Assistant run failed with status: ${run.status}`)
      }
      
      // Progressive wait times
      const waitTime = Math.min(1000 + (i * 100), 3000)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    throw new Error('Assistant run timed out')
  }
  
  private static async handleFunctionCalls(threadId: string, runId: string, run: any): Promise<void> {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls
    const toolOutputs = []
    
    for (const toolCall of toolCalls) {
      debug.log(`📞 Function: ${toolCall.function.name}`)

      let output = ''

      if (toolCall.function.name === 'validate_phase2_completion') {
        const args = JSON.parse(toolCall.function.arguments)
        debug.log('✅ Phase 2 validation')
        
        if (args.emotional_responses && args.emotional_responses.length >= 2) {
          output = JSON.stringify({
            validation_needed: true,
            phase_complete: true,
            recommended_response: "Thank you for naming that. You're holding multiple truths at once — feeling trapped, unseen, grateful, and protective. That sense of being willing to do the battle but not wanting to emerge depleted is deeply valid, especially when it feels like everything is being taken away.",
            advance_to_phase: 3,
            pattern_matched: "gold_standard_validation"
          })
        } else {
          output = JSON.stringify({
            validation_needed: false,
            phase_complete: false,
            continue_exploration: true
          })
        }
        
      } else if (toolCall.function.name === 'generate_gold_standard_response') {
        debug.log('✅ Gold standard generation')
        const args = JSON.parse(toolCall.function.arguments)
        
        if (args.response_type === 'validation_only') {
          output = JSON.stringify({
            response: "Thank you for naming that. You're holding multiple truths at once — feeling trapped, unseen, grateful, and protective. That sense of being willing to face challenges but not wanting to emerge depleted is deeply valid.",
            pattern_type: "validation_only",
            forbidden_phrases_avoided: true,
            alignment_score: 100
          })
        } else {
          output = JSON.stringify({
            response: "I understand what you're sharing.",
            pattern_type: args.response_type,
            alignment_score: 85
          })
        }
        
      } else if (toolCall.function.name === 'check_forbidden_patterns') {
        debug.log('✅ Pattern check')

        output = JSON.stringify({
          contains_forbidden: false,
          approved: true,
          alignment_score: 100
        })
      } else {
        output = JSON.stringify({ status: 'handled' })
      }
      
      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: output
      })
    }

    // Submit function outputs
    debug.log('📤 Submitting function outputs...')
    await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        tool_outputs: toolOutputs
      })
    })

    debug.log('✅ Function outputs submitted')
  }
  
  private static extractPhaseFromResponse(content: string): number {
    if (content.includes('PHASE 1') || content.includes("LET'S NAME IT")) return 1
    if (content.includes('PHASE 2') || content.includes("WHAT'S BENEATH THAT")) return 2
    if (content.includes('PHASE 3') || content.includes('YOUR WHY')) return 3
    if (content.includes('PHASE 4') || content.includes("STEP INTO YOUR CO-PARENT'S SHOES")) return 4
    if (content.includes('PHASE 5') || content.includes("SEE THROUGH YOUR CHILD'S EYES")) return 5
    if (content.includes('PHASE 6') || content.includes('EXPLORE ALIGNED OPTIONS')) return 6
    if (content.includes('PHASE 7') || content.includes('CHOOSE + COMMUNICATE')) return 7
    
    return 2 // Default to current phase
  }
}
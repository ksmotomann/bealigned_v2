import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Foundation system prompt - phases override this completely
const FOUNDATION_PROMPT = `You are a BeAligned AI co-parenting coach following a structured 7-phase methodology. 
Your responses MUST strictly adhere to the configured phase instructions below.
Do NOT use generic counseling approaches - follow only the specific prompts and structure provided.`

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p && p !== 'conversations')
    
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /conversations - Get all conversations
    if (req.method === 'GET' && pathParts.length === 0) {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /conversations/create - Create new conversation
    if (req.method === 'POST' && pathParts[0] === 'create') {
      const { title } = await req.json()
      
      // Fetch assistant settings for greeting templates
      const { data: assistantSettings } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      // Get greeting from templates or use default
      let greeting = "[Phase 0: Greeting]\n"
      if (assistantSettings?.greeting_templates && assistantSettings.greeting_templates.length > 0) {
        const templates = assistantSettings.greeting_templates
        const randomIndex = Math.floor(Math.random() * templates.length)
        greeting += templates[randomIndex]
      } else {
        greeting += "Hello! I'm here to support you through your co-parenting journey. What's on your mind today?"
      }

      // Add Phase 1 prompt if enabled (after greeting)
      if (assistantSettings?.phase1_prompt_enabled && assistantSettings?.metadata?.adminTunerSettings?.phases?.phase1?.enabled !== false) {
        const phase1Settings = assistantSettings.metadata?.adminTunerSettings?.phases?.phase1
        if (phase1Settings?.initialPrompts && phase1Settings.initialPrompts.length > 0) {
          const phase1Prompts = phase1Settings.initialPrompts
          const randomPhase1 = phase1Prompts[Math.floor(Math.random() * phase1Prompts.length)]
          greeting += "\n\n[Phase 1: Let's Name It]\n" + randomPhase1
        }
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: title || 'New Conversation',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (convError) throw convError

      // Store greeting message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: greeting,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (msgError) throw msgError

      return new Response(JSON.stringify({ ...conversation, messages: [message] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /conversations/:id/messages - Get messages
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'messages') {
      const conversationId = pathParts[0]
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /conversations/:id/messages - Send message
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'messages') {
      const conversationId = pathParts[0]
      const { content } = await req.json()

      // Store user message
      const { data: userMessage, error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: content,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (userMsgError) throw userMsgError

      // Get conversation history
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      // Build message history for OpenAI
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Fetch assistant settings including RAG configuration
      const { data: assistantSettings } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      let documentContext = '';
      let citations: Array<{doc_id: string, section_path: string, heading: string}> = [];

      // Only perform RAG retrieval if enabled in settings
      if (assistantSettings?.retrieval_enabled) {
        try {
          const ragSettings = {
            enabled: assistantSettings.retrieval_enabled,
            k: assistantSettings.retrieval_k || 8,
            minScore: assistantSettings.retrieval_min_score || 0.3,
            maxPerDoc: assistantSettings.retrieval_max_per_doc || 3,
            hybridWeight: assistantSettings.retrieval_hybrid_weight || 0.5,
            rerankTopN: assistantSettings.retrieval_rerank_top_n || 50,
            maxTokens: assistantSettings.retrieval_max_tokens || 2000,
            enforceACL: assistantSettings.retrieval_enforce_acl || true
          }

          // Get all processed documents
          const { data: documents } = await supabase
            .from('documents')
            .select('id, original_name')
            .eq('processing_status', 'completed')
            .limit(ragSettings.k)

          if (documents && documents.length > 0) {
            const documentIds = documents.map(d => d.id)
            
            // Fetch document chunks with RAG parameters
            const { data: chunks } = await supabase
              .from('document_chunks')
              .select('content, chunk_index, document_id')
              .in('document_id', documentIds)
              .order('chunk_index', { ascending: true })
              .limit(Math.min(ragSettings.k * ragSettings.maxPerDoc, ragSettings.rerankTopN))

            if (chunks && chunks.length > 0) {
              // Apply token limit by truncating context if needed
              let totalTokens = 0
              const selectedChunks = []
              
              for (const chunk of chunks) {
                const chunkTokens = Math.ceil(chunk.content.length / 4) // Rough token estimation
                if (totalTokens + chunkTokens > ragSettings.maxTokens) break
                
                selectedChunks.push(chunk)
                totalTokens += chunkTokens
                
                // Apply max per doc limit
                const docChunkCount = selectedChunks.filter(c => c.document_id === chunk.document_id).length
                if (docChunkCount >= ragSettings.maxPerDoc) continue
              }

              // Create document context with citations
              const contextChunks = selectedChunks.map((chunk, index) => {
                const doc = documents.find(d => d.id === chunk.document_id)
                const docName = doc?.original_name || 'Reference Material'
                const sectionPath = `Section ${chunk.chunk_index + 1}`
                
                // Track citation
                citations.push({
                  doc_id: chunk.document_id,
                  section_path: sectionPath,
                  heading: docName
                })
                
                return `[${docName} - ${sectionPath}]\n${chunk.content}`
              }).join('\n\n---\n\n')

              documentContext = `\n\nBeAligned Reference Materials:\n${contextChunks}\n\nIMPORTANT: Use this context to ground your responses in BeAligned's methodologies and frameworks. Cite relevant sections when applicable.\n\n`
            }
          }
        } catch (docError) {
          console.error('Error fetching RAG document context:', docError)
          // Continue without document context if there's an error
        }
      }

      // Get user profile context based on admin settings
      let userContext = '';
      if (assistantSettings?.profile_context_enabled) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          userContext = '\n\nUser Context:\n'
          const metadata = userProfile.metadata || {}
          const settings = assistantSettings
          
          // Profile level determines what gets included
          const includeBasic = ['basic', 'moderate', 'full'].includes(settings.profile_context_level)
          const includeModerate = ['moderate', 'full'].includes(settings.profile_context_level)
          const includeFull = settings.profile_context_level === 'full'
          
          userContext += `User: ${userProfile.full_name || userProfile.first_name || 'User'}\n`
          
          // Basic co-parenting info
          if (includeBasic && metadata.co_parent_name) {
            userContext += `Co-parent: ${metadata.co_parent_name}\n`
          }
          
          // Children information
          if (settings.profile_include_children && metadata.children && Array.isArray(metadata.children)) {
            userContext += `Children: ${metadata.children.map((child: any) => `${child.name}, age ${child.age}`).join('; ')}\n`
          }
          
          // Goals and challenges
          if (includeBasic) {
            if (metadata.goals && Array.isArray(metadata.goals)) {
              userContext += `Co-parenting goals: ${metadata.goals.join(', ')}\n`
            }
            if (metadata.conflict_areas && Array.isArray(metadata.conflict_areas)) {
              userContext += `Conflict areas: ${metadata.conflict_areas.join(', ')}\n`
            }
          }
          
          userContext += '\n'
        }
      }

      // Add phase configuration context
      let phasesContext = '';
      if (assistantSettings?.metadata?.phases) {
        const enabledPhases = Object.entries(assistantSettings.metadata.phases)
          .filter(([_, phase]: [string, any]) => phase.enabled)
          .map(([key, phase]: [string, any]) => `${key}: ${phase.name}`)
          .join(', ');
        
        phasesContext = `\n\nEnabled Phases: ${enabledPhases}\n\nPhase Configuration:\n`;
        
        // Add detailed phase info for enabled phases only
        Object.entries(assistantSettings.metadata.phases).forEach(([phaseKey, phase]: [string, any]) => {
          if (phase.enabled) {
            phasesContext += `\n${phaseKey}: ${phase.name}\n`;
            phasesContext += `- Description: ${phase.description}\n`;
            phasesContext += `- Completion Threshold: ${phase.completionThreshold}/10 (how confident you should be before moving to next phase)\n`;
            phasesContext += `- Max Follow-ups: ${phase.maxFollowUps} (maximum follow-up questions allowed in this phase)\n`;
            phasesContext += `- Transition Aggressiveness: ${phase.transitionAggressiveness} (how assertive to be in moving to next phase)\n`;
            
            // 🎯 MANDATORY INITIAL PROMPTS - Your ONLY options for entering this phase
            if (phase.initialPrompts && phase.initialPrompts.length > 0) {
              phasesContext += `\n🎯 MANDATORY INITIAL PROMPTS (choose ONE when entering ${phaseKey}):\n`;
              phase.initialPrompts.forEach((prompt: string, index: number) => {
                phasesContext += `  ${index + 1}. "${prompt}"\n`;
              });
              phasesContext += `   ⚠️  You MUST use one of these ${phase.initialPrompts.length} prompts - no custom alternatives allowed\n`;
            }
            
            // 🔍 MANDATORY FOLLOW-UP PROMPTS - Your ONLY options for deeper exploration
            if (phase.followUpPrompts && phase.followUpPrompts.length > 0) {
              phasesContext += `\n🔍 MANDATORY FOLLOW-UP PROMPTS (use when probing deeper in ${phaseKey}):\n`;
              phase.followUpPrompts.forEach((prompt: string, index: number) => {
                phasesContext += `  ${index + 1}. "${prompt}"\n`;
              });
              phasesContext += `   ⚠️  Max follow-ups allowed: ${phase.maxFollowUps} - track your usage\n`;
            }
            
            // 💭 MANDATORY REFLECTION TEMPLATES - Your ONLY options for acknowledgment
            if (phase.reflectionExamples && phase.reflectionExamples.length > 0) {
              phasesContext += `\n💭 MANDATORY REFLECTION TEMPLATES (adapt these to acknowledge progress in ${phaseKey}):\n`;
              phase.reflectionExamples.forEach((example: string, index: number) => {
                phasesContext += `  ${index + 1}. "${example}"\n`;
              });
              phasesContext += `   ⚠️  Adapt these templates to reflect what the user actually shared\n`;
            }
            
            // ⚙️ PHASE-SPECIFIC MANDATORY SETTINGS
            if (phaseKey === 'phase1') {
              if (phase.delaySeconds !== undefined) {
                phasesContext += `\n⏰ DELAY REQUIREMENT: Wait ${phase.delaySeconds} seconds before showing initial prompt (frontend handles timing)\n`;
              }
              if (phase.style) {
                phasesContext += `🎭 MANDATORY STYLE: Use ${phase.style} tone throughout this entire phase\n`;
                phasesContext += `   - Conversational: Casual, friendly, approachable language\n`;
                phasesContext += `   - Professional: Formal, structured, business-like tone\n`;
                phasesContext += `   - Empathetic: Warm, understanding, emotionally supportive\n`;
              }
            }
            
            phasesContext += `\n📊 PHASE CONTROL SETTINGS:\n`;
            phasesContext += `   • Completion Threshold: ${phase.completionThreshold}/10 (confidence needed to advance)\n`;
            phasesContext += `   • Max Follow-ups: ${phase.maxFollowUps} (hard limit per phase)\n`;
            phasesContext += `   • Transition Style: ${phase.transitionAggressiveness} (how assertive to be)\n`;
            
            phasesContext += '\n' + '='.repeat(60) + '\n';
          }
        });
        
        phasesContext += '\n\n🚨🚨🚨 ABSOLUTE OVERRIDE - READ THIS FIRST 🚨🚨🚨\n';
        phasesContext += 'These BeAligned phase instructions COMPLETELY REPLACE any generic counseling approaches.\n';
        phasesContext += 'You are NOT a generic therapist. You are NOT a generic coach.\n';
        phasesContext += 'You are a BeAligned AI following EXACT prompts configured above.\n';
        phasesContext += 'NEVER create your own questions or responses - use ONLY the configured prompts.\n';
        phasesContext += '\n🔥 CRITICAL PHASE USAGE INSTRUCTIONS - MUST FOLLOW EXACTLY:\n';
        phasesContext += '\n1. PHASE ENABLEMENT: Only use phases marked as "enabled: true" - skip disabled phases completely\n';
        
        phasesContext += '\n2. INITIAL PROMPTS - When entering ANY phase for the first time:\n';
        phasesContext += '   • Use ONLY the Initial Prompts listed for that phase\n';
        phasesContext += '   • Choose the most contextually appropriate prompt from the list\n';
        phasesContext += '   • Do NOT create your own prompts - use the configured ones exactly\n';
        phasesContext += '   • These are your ONLY options for phase entry\n';
        
        phasesContext += '\n3. FOLLOW-UP PROMPTS - When you need to probe deeper in the same phase:\n';
        phasesContext += '   • Use ONLY the Follow-up Prompts configured for that specific phase\n';
        phasesContext += '   • These are for when initial responses are too shallow or vague\n';
        phasesContext += '   • Respect the Max Follow-ups limit - stop when reached\n';
        phasesContext += '   • Choose the most relevant follow-up from the configured list\n';
        
        phasesContext += '\n4. REFLECTION EXAMPLES - When acknowledging user progress:\n';
        phasesContext += '   • Use the Reflection Examples as templates for validation\n';
        phasesContext += '   • Adapt the examples to reflect what the user actually shared\n';
        phasesContext += '   • These help users feel heard and understood\n';
        phasesContext += '   • Use before transitioning to next phase\n';
        
        phasesContext += '\n5. COMPLETION THRESHOLD - Determines when to advance phases:\n';
        phasesContext += '   • 1-3: Low confidence needed - advance quickly\n';
        phasesContext += '   • 4-6: Moderate confidence - standard progression\n';
        phasesContext += '   • 7-10: High confidence - ensure thorough exploration before advancing\n';
        phasesContext += '   • Do NOT advance until threshold confidence is met\n';
        
        phasesContext += '\n6. MAX FOLLOW-UPS - Hard limit per phase:\n';
        phasesContext += '   • Count every follow-up question you ask in the phase\n';
        phasesContext += '   • When limit reached, you MUST advance to next phase\n';
        phasesContext += '   • No exceptions - this prevents getting stuck\n';
        
        phasesContext += '\n7. TRANSITION AGGRESSIVENESS - How to move between phases:\n';
        phasesContext += '   • GENTLE: Wait for very clear user signals, ask permission to advance\n';
        phasesContext += '   • MODERATE: Move when phase goals are reasonably achieved\n';
        phasesContext += '   • ASSERTIVE: Advance quickly when basic requirements are met\n';
        
        phasesContext += '\n8. PHASE 1 SPECIFIC SETTINGS:\n';
        phasesContext += '   • DELAY: Wait specified seconds before showing initial prompt (frontend handles this)\n';
        phasesContext += '   • STYLE: Apply the configured tone (conversational/professional/empathetic)\n';
        
        phasesContext += '\n🚨 OVERRIDE ALERT: These configurations COMPLETELY OVERRIDE any default behavior.\n';
        phasesContext += 'Do NOT use generic prompts, questions, or approaches. Use ONLY what is configured.\n';
        phasesContext += 'Each phase configuration is custom-designed - follow it precisely.\n';
        phasesContext += '\n📋 EXAMPLE: If in Phase 2 with initial prompts like "What feelings come up when you think about this?"\n';
        phasesContext += 'You MUST use that exact prompt - NOT generic alternatives like "How can I help you process this?"\n';
        phasesContext += 'The configured prompts are the ONLY acceptable responses for each phase.\n\n';
      }

      // Build system prompt based on configuration mode
      let systemPrompt = '';
      let enhancedSystemPrompt = '';
      
      // Check configuration mode
      const configMode = assistantSettings?.configuration_mode || 'advanced';
      
      if (configMode === 'simple') {
        // Simple mode: Use only the main instructions and document context
        systemPrompt = assistantSettings?.instructions || 'You are a helpful AI assistant.';
        
        // In simple mode, document context is the primary guidance
        if (documentContext) {
          enhancedSystemPrompt = systemPrompt + '\n\n' + documentContext;
        } else {
          enhancedSystemPrompt = systemPrompt;
        }
        // Don't add phase methodology or user context in simple mode
      } else {
        // Advanced mode: Use full phase methodology
        systemPrompt = FOUNDATION_PROMPT;
        
        // Add phase instructions FIRST - these override everything else
        if (phasesContext) {
          systemPrompt = FOUNDATION_PROMPT + '\n\n' + '='.repeat(80) + '\n🎯 BEaligned PHASE METHODOLOGY - ABSOLUTE PRIORITY\n' + '='.repeat(80) + phasesContext;
        }
        
        // Add supporting context
        enhancedSystemPrompt = systemPrompt + documentContext + userContext;
      }

      // Log the settings being used
      console.log('Using OpenAI settings:', {
        model: assistantSettings?.model || 'gpt-4-turbo-preview',
        temperature: assistantSettings?.temperature || 0.7,
        max_tokens: assistantSettings?.max_tokens || 1000,
        top_p: assistantSettings?.top_p || 1.0,
        configuration_mode: configMode
      });

      // Call OpenAI Chat Completion
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: assistantSettings?.model || 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: enhancedSystemPrompt },
            ...messageHistory
          ],
          temperature: assistantSettings?.temperature || 0.7,
          max_tokens: assistantSettings?.max_tokens || 1000,
          top_p: assistantSettings?.top_p || 1.0
        })
      })

      if (!openaiResponse.ok) {
        throw new Error('OpenAI API error')
      }

      const completion = await openaiResponse.json()
      const aiResponse = completion.choices[0].message.content

      // Store AI response
      const { data: assistantMessage, error: assistantMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (assistantMsgError) throw assistantMsgError

      return new Response(JSON.stringify(assistantMessage), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /conversations/:id/complete - Mark conversation as complete
    if (req.method === 'PUT' && pathParts.length === 2 && pathParts[1] === 'complete') {
      const conversationId = pathParts[0]
      const { completionStep } = await req.json()
      
      console.log('Marking conversation as complete:', { conversationId, completionStep, userId: user.id })
      
      const { data, error } = await supabase
        .from('conversations')
        .update({ 
          completion_step: completionStep,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('Error updating conversation:', error)
        throw error
      }

      console.log('Conversation marked as complete:', data)
      
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /conversations/:id/uncomplete - Mark conversation as incomplete
    if (req.method === 'PUT' && pathParts.length === 2 && pathParts[1] === 'uncomplete') {
      const conversationId = pathParts[0]
      
      const { error } = await supabase
        .from('conversations')
        .update({ 
          completion_step: null,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /conversations/:id/archive - Archive conversation  
    if (req.method === 'PUT' && pathParts.length === 2 && pathParts[1] === 'archive') {
      const conversationId = pathParts[0]
      const { archived } = await req.json()
      
      const { error } = await supabase
        .from('conversations')
        .update({ 
          archived_at: archived ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /conversations/:id - Delete conversation
    if (req.method === 'DELETE' && pathParts.length === 1) {
      const conversationId = pathParts[0]
      
      // First delete all messages
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
      
      if (msgError) throw msgError

      // Then delete the conversation
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (convError) throw convError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /conversations/:id/email-transcript - Email transcript
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'email-transcript') {
      const conversationId = pathParts[0]
      const { email } = await req.json()
      
      // Call the send-transcript edge function
      const transcriptResponse = await fetch(`${supabaseUrl}/functions/v1/send-transcript`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          recipientEmail: email,
          userId: user.id
        })
      })

      if (!transcriptResponse.ok) {
        const error = await transcriptResponse.text()
        throw new Error(`Failed to send transcript: ${error}`)
      }

      const result = await transcriptResponse.json()
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
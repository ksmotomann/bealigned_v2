import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get custom auth token from header
    const authToken = req.headers.get('x-auth-token')
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'No auth token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify token in app_sessions table
    const tokenHash = btoa(authToken)
    
    const { data: session, error: sessionError } = await supabase
      .from('app_sessions')
      .select('*, user:users(*)')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      console.error('Session verification failed:', sessionError?.message)
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired token. Please log in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Update last activity
    await supabase
      .from('app_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id)

    const user = session.user
    const { title } = await req.json()

    // Generate a temporary thread_id
    const tempThreadId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: title || 'New Conversation',
        thread_id: tempThreadId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (convError) {
      throw new Error(`Failed to create conversation: ${convError.message}`)
    }

    // Get assistant settings with greeting configuration
    const { data: assistantSettings } = await supabase
      .from('assistant_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    // Determine user state for greeting selection
    let userState = 'first_time'
    
    // Check if user has previous conversations
    const { data: previousConvs, count } = await supabase
      .from('conversations')
      .select('id, created_at', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .neq('id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (count && count > 0) {
      const lastConvDate = new Date(previousConvs[0].created_at)
      const daysSinceLastConv = (Date.now() - lastConvDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceLastConv > 7) {
        userState = 'returning_after_break'
      } else {
        userState = 'returning_active'
      }
    }

    // Generate greeting based on settings
    let greeting = assistantSettings?.greeting_fallback || 
      "Hello! I'm here to support you through your co-parenting journey. What's on your mind today?"

    if (assistantSettings) {
      const settings = assistantSettings
      let greetingTemplate = ''

      // First try to use Phase 0 (Greeting) prompts if available and enabled
      if (settings.metadata?.phases?.phase0?.enabled && settings.metadata.phases.phase0.initialPrompts?.length > 0) {
        const phase0Prompts = settings.metadata.phases.phase0.initialPrompts
        const randomIndex = Math.floor(Math.random() * phase0Prompts.length)
        greetingTemplate = phase0Prompts[randomIndex]
        console.log('Using Phase 0 greeting prompt:', greetingTemplate)
      }
      // Fallback to user state templates if Phase 0 not available
      else if (settings.greeting_user_state_templates && settings.greeting_user_state_templates[userState]) {
        greetingTemplate = settings.greeting_user_state_templates[userState]
      } 
      // Fallback to general greeting templates
      else if (settings.greeting_templates && settings.greeting_templates.length > 0) {
        // Select from general greetings based on randomization mode
        switch (settings.greeting_randomization_mode) {
          case 'random':
            const randomIndex = Math.floor(Math.random() * settings.greeting_templates.length)
            greetingTemplate = settings.greeting_templates[randomIndex]
            break
          case 'sequential':
            // Use conversation count as index
            const index = (count || 0) % settings.greeting_templates.length
            greetingTemplate = settings.greeting_templates[index]
            break
          case 'time_based':
            // Select based on time of day
            const hour = new Date().getHours()
            const timeIndex = hour % settings.greeting_templates.length
            greetingTemplate = settings.greeting_templates[timeIndex]
            break
          default:
            greetingTemplate = settings.greeting_templates[0]
        }
      }

      // Build personalized greeting
      let finalGreeting = ''

      // Add time-based greeting
      if (settings.greeting_include_time && settings.greeting_time_ranges) {
        const currentTime = new Date()
        const currentHour = currentTime.getHours()
        const currentMinute = currentTime.getMinutes()
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
        
        for (const range of settings.greeting_time_ranges) {
          if (currentTimeStr >= range.start && currentTimeStr <= range.end) {
            finalGreeting = range.prefix
            break
          }
        }
      }

      // Add user name
      if (settings.greeting_include_user_name && user.first_name) {
        if (finalGreeting) {
          finalGreeting += `, ${user.first_name}`
        } else {
          finalGreeting = `Hello ${user.first_name}`
        }
      }

      // Add greeting punctuation
      if (finalGreeting) {
        finalGreeting += '! '
      }

      // Add main greeting template
      finalGreeting += greetingTemplate

      // Add phase reference if enabled
      if (settings.greeting_include_phase_reference && userState === 'first_time') {
        finalGreeting += " Throughout our conversations, we'll work through different phases to help you achieve clarity and develop effective co-parenting strategies."
      }

      // Add motivational quote if enabled
      if (settings.greeting_include_motivational_quote) {
        const quotes = [
          "\n\n💭 'The best security blanket a child can have is parents who respect each other.'",
          "\n\n💭 'Co-parenting is not a competition. It's a collaboration of two homes working together.'",
          "\n\n💭 'Your children need both of you to be the best parents you can be, not the best ex-partners.'",
          "\n\n💭 'Successful co-parenting means putting your children's needs before your own emotions.'",
          "\n\n💭 'Two homes united by love are better than one home divided by conflict.'"
        ]
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
        finalGreeting += randomQuote
      }

      greeting = finalGreeting || greetingTemplate || settings.greeting_fallback
    }

    // Store greeting as first message
    console.log('Attempting to store greeting message:', greeting)
    const { data: greetingMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: greeting,
        created_at: new Date().toISOString(),
        metadata: {
          is_greeting: true,
          user_state: userState,
          assistant_settings_id: assistantSettings?.id
        }
      })
      .select()
      .single()

    if (msgError) {
      console.error('Failed to store greeting:', msgError)
      // Return conversation with greeting even if storage failed
      return new Response(JSON.stringify({
        ...conversation,
        greeting: {
          content: greeting,
          role: 'assistant',
          error: 'Failed to store in database'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log('Greeting message stored successfully:', greetingMessage?.id)

    // Generate Phase 1 prompt if enabled
    let phase1Prompt = null
    if (assistantSettings?.phase1_prompt_enabled) {
      const phase1Templates = assistantSettings.phase1_prompt_templates || []
      if (phase1Templates.length > 0) {
        // Select a random Phase 1 prompt
        const randomIndex = Math.floor(Math.random() * phase1Templates.length)
        phase1Prompt = {
          content: phase1Templates[randomIndex],
          delaySeconds: assistantSettings.phase1_prompt_delay_seconds || 3,
          style: assistantSettings.phase1_prompt_style || 'conversational'
        }
        console.log('Generated Phase 1 prompt:', phase1Prompt)
      }
    }

    // Return conversation with greeting and Phase 1 prompt
    return new Response(JSON.stringify({
      ...conversation,
      greeting: greetingMessage,
      phase1Prompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Create conversation error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
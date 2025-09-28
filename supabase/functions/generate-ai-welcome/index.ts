import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Welcome prompts organized by tone (same as client-side)
const WELCOME_PROMPTS = {
  reflective: [
    "Being here isn't about having all the answers. It's about quieting the noise long enough to see what's really underneath. What's on your mind today?",
    "Sometimes the hardest part is slowing down enough to notice what matters. What's asking for your attention today?",
    "This is your pause button. What's the noise you most want to quiet?"
  ],
  validating: [
    "Some days feel like too much. What's the one thing weighing most on you right now?",
    "You showed up—that's already progress. Where do you want to start from here?",
    "I'm not here to hand you answers. I'm here to help you uncover the ones already within you. Where should we start?",
    "You made it here—that's something. What do you want to work through first?"
  ],
  sorting: [
    "You don't need to fix everything at once. What's the first piece you'd like to sort through?",
    "This space isn't about judgment—it's about finding clarity in the middle of the mess. What's showing up for you right now?",
    "Carrying a heavy load today? What can you set down here?",
    "You've got a lot on your plate. What's one piece we can clear off together?"
  ],
  direct: [
    "Have at me. Bring the mess, the questions, the weight of it all—this is where we make it lighter. What do you want to lay down first?",
    "Lay it on me. What do you want to get off your chest first?",
    "Hit me with it. What's taking up the most space in your head right now?",
    "Go ahead—get it out. What's the thing you want to let go of the most?",
    "Don't hold back. What's the first thing you need to say?",
    "Bring it. Big or small—what's on you that we can unpack here?"
  ]
}

type WelcomeTone = 'reflective' | 'validating' | 'sorting' | 'direct'

interface UserProfile {
  preferredTone?: WelcomeTone
  communicationStyle?: 'gentle' | 'direct' | 'supportive' | 'structured'
  sessionHistory?: {
    hasCompletedSessions: boolean
    lastSessionDays?: number
    commonChallenges?: string[]
  }
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'late'
}

function determineToneCategory(userProfile: UserProfile): WelcomeTone {
  // If user has explicit preference, use it (unless it's 'mixed')
  if (userProfile.preferredTone && userProfile.preferredTone !== 'mixed') {
    return userProfile.preferredTone
  }

  // Smart tone selection based on context
  const { communicationStyle, timeOfDay, sessionHistory } = userProfile

  // Time-based preferences
  if (timeOfDay === 'morning') return 'reflective'
  if (timeOfDay === 'late' || timeOfDay === 'evening') return 'validating'
  
  // Style-based preferences  
  if (communicationStyle === 'direct') return 'direct'
  if (communicationStyle === 'gentle') return 'validating'
  if (communicationStyle === 'structured') return 'sorting'
  
  // History-based preferences
  if (sessionHistory?.hasCompletedSessions) {
    // Returning users might appreciate more direct approach
    return Math.random() > 0.5 ? 'direct' : 'sorting'
  }
  
  // Default to validating for new users - most supportive
  return 'validating'
}

function getToneDescription(tone: WelcomeTone): string {
  const descriptions = {
    reflective: 'Contemplative, introspective, focuses on inner awareness and mindful reflection',
    validating: 'Supportive, acknowledging, emphasizes that showing up is progress',
    sorting: 'Practical, organizing, helps break down overwhelming situations into manageable pieces',
    direct: 'Straightforward, energetic, invites full expression without judgment'
  }
  return descriptions[tone] || descriptions.validating
}

async function generateAIWelcomeMessage(userProfile: UserProfile): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured in Edge Function environment')
  }

  // Determine the tone category to use
  const toneCategory = determineToneCategory(userProfile)

  // Get examples from static prompts as fallback
  const categoryExamples = WELCOME_PROMPTS[toneCategory] || WELCOME_PROMPTS.validating

  // Get BeH2O methodology and vector-guided content
  let vectorGuidedContent = ''
  let beh2oMethodology = ''

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabase = createClient(supabaseUrl, supabaseKey)

      console.log('🔧 Supabase client created successfully')
      console.log('🔧 Testing basic database access...')

      // Get BeH2O governance and methodology content
      console.log('🔧 Querying bealigned_content table...')
      const { data: beh2oContent, error: beh2oError } = await supabase
        .from('bealigned_content')
        .select('content')
        .in('content_type', ['governance', 'instructions'])
        .limit(2)

      if (beh2oError) {
        console.error('❌ BeH2O content query failed:', beh2oError)
      } else {
        console.log('✅ BeH2O content query successful, found:', beh2oContent?.length, 'items')
      }

      if (beh2oContent && beh2oContent.length > 0) {
        beh2oMethodology = beh2oContent.map(item => item.content.substring(0, 500)).join('\n\n')
        console.log('✅ BeH2O methodology content prepared, length:', beh2oMethodology.length)
      }

      // Get vector-guided welcome patterns for this tone
      const toneTagMap = {
        'reflective': 'grounding_reflective',
        'validating': 'validating_encouraging',
        'sorting': 'sorting_unpacking',
        'direct': 'direct_inviting'
      }

      const toneTag = toneTagMap[toneCategory] || 'validating_encouraging'
      console.log('🎨 Using tone tag:', toneTag, 'for category:', toneCategory)

      console.log('🔧 Querying bealigned_content_chunks table...')
      const { data: vectorChunks, error: vectorError } = await supabase
        .from('bealigned_content_chunks')
        .select('content')
        .eq('phase_number', 1)
        .contains('situation_tags', [toneTag, 'tone_samples'])
        .limit(1)

      if (vectorError) {
        console.error('❌ Vector chunks query failed:', vectorError)
      } else {
        console.log('✅ Vector chunks query successful, found:', vectorChunks?.length, 'chunks')
      }

      if (vectorChunks && vectorChunks.length > 0) {
        vectorGuidedContent = vectorChunks[0].content
        console.log('✅ Vector guided content prepared, length:', vectorGuidedContent.length)
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch vector content, using static examples:', error)
    }
  }
  
  // Create AI prompt for generating welcome message
  const systemPrompt = `You are BeAligned™'s welcome message generator powered by the BeH2O® methodology. Your job is to create a personalized welcome message for co-parenting reflection that integrates BeH2O principles with natural conversation.

${beh2oMethodology ? `BeH2O® CORE METHODOLOGY (integrate these principles naturally):
${beh2oMethodology}

` : ''}${vectorGuidedContent ? `VECTOR-GUIDED WELCOME PATTERNS (your gold standard examples):
${vectorGuidedContent}

` : ''}TONE CATEGORY: ${toneCategory.toUpperCase()}
- ${getToneDescription(toneCategory)}

STATIC FALLBACK EXAMPLES (for inspiration only - DO NOT COPY THESE):
${categoryExamples.map((example, i) => `${i + 1}. "${example}"`).join('\n')}

CRITICAL: Generate a UNIQUE message - DO NOT use the exact wording from the examples above. Use them only as inspiration for tone and style.

USER CONTEXT:
- Communication style: ${userProfile.communicationStyle || 'supportive'}
- Time: ${userProfile.timeOfDay || 'unknown'}
- Experience: ${userProfile.sessionHistory?.hasCompletedSessions ? 'returning user' : 'new user'}

BeH2O® INTEGRATION REQUIREMENTS:
1. Embody BeH2O principles: Strength (clarity), Stability (child-centered), Flow (responsive not reactive)
2. Reflect "Purpose over Position" - invite exploration of why, not just what
3. Center the child's wellbeing without explicitly mentioning it
4. Invite reflection before reaction
5. Create space for warmth, neutrality, and genuine care

CONVERSATIONAL REQUIREMENTS:
1. Generate EXACTLY ONE message (15-40 words max)
2. Match the natural, conversational tone from vector examples
3. End with a simple, direct question
4. Be authentic and approachable, never clinical
5. NO therapy-speak: avoid "journey", "sacred", "courage", "space", "connection", "welcome"
6. Sound like a caring friend, not a counselor
7. Integrate BeH2O wisdom naturally, not explicitly

Generate ONLY the welcome message, nothing else:`

  const userPrompt = `Generate a personalized welcome message in the ${toneCategory} tone for a co-parenting reflection session.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.9, // Higher temperature for more creative, varied responses
        max_tokens: 100,  // Allow more space for natural BeH2O expression
        top_p: 0.95       // More diverse sampling
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    let welcomeMessage = data.choices[0]?.message?.content?.trim() || ''
    
    // Clean up the response (remove quotes, extra formatting)
    welcomeMessage = welcomeMessage.replace(/^["']|["']$/g, '') // Remove surrounding quotes
    welcomeMessage = welcomeMessage.replace(/^\*\*.*?\*\*\s*/, '') // Remove bold headers
    
    return welcomeMessage
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    throw error
  }
}

function getStaticFallbackWelcome(userProfile: UserProfile): string {
  const toneCategory = determineToneCategory(userProfile)
  const categoryPrompts = WELCOME_PROMPTS[toneCategory] || WELCOME_PROMPTS.validating
  const randomIndex = Math.floor(Math.random() * categoryPrompts.length)
  return categoryPrompts[randomIndex]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎯 Generate AI Welcome - Function called')
    console.log('🔧 Request method:', req.method)
    console.log('🔧 Request headers:', Object.fromEntries(req.headers.entries()))

    // Note: Welcome messages are public and don't require authentication
    // However, Supabase may still require auth headers for consistency

    const { userProfile = {} } = await req.json()
    console.log('📝 User profile received:', userProfile)
    
    console.log('Edge Function: Generating AI welcome message with profile:', userProfile)
    
    let welcomeMessage: string
    let generatedBy: 'ai' | 'static' = 'static'

    try {
      // Try AI generation first
      welcomeMessage = await generateAIWelcomeMessage(userProfile)
      generatedBy = 'ai'
      console.log('Edge Function: AI welcome message generated successfully')
    } catch (error) {
      console.warn('Edge Function: AI generation failed, using static fallback:', error)
      welcomeMessage = getStaticFallbackWelcome(userProfile)
      generatedBy = 'static'
    }

    return new Response(
      JSON.stringify({
        welcomeMessage,
        toneCategory: determineToneCategory(userProfile),
        generatedBy,
        responseType: generatedBy === 'ai' ? 'ai_vector' : 'fallback'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate welcome message',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
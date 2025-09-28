import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// System prompt for the AI assistant with context awareness
const SYSTEM_PROMPT = `You are a helpful AI assistant integrated into the BeAligned platform, a co-parenting support application. 

You have access to:
1. The user's conversation history and previous interactions
2. BeAligned's guidebook and reference materials with frameworks, techniques, and best practices
3. Structured approaches for co-parenting conflict resolution and alignment

Your role is to:
- Provide personalized, contextual responses based on the user's journey
- Apply BeAligned's methodologies and frameworks from the guidebook when relevant
- Help users with co-parenting situations using evidence-based approaches
- Reference specific techniques, frameworks, and principles from the available materials
- Maintain BeAligned's calm, respectful tone while guiding toward alignment
- Encourage child-centered solutions and mutual respect

When you have access to guidebook content, incorporate those frameworks and techniques naturally into your responses. 
For new structured co-parenting conversations, you can also direct users to use the BeH2O Chat feature.
Always prioritize the child's well-being and work toward alignment between co-parents.`

// Function to analyze responses and auto-create issues for quality problems
async function checkAndCreateIssues(userId: string, query: string, response: string, supabase: any) {
  try {
    const issues = []
    
    // Pattern 1: Response is too short (might indicate insufficient response)
    if (response.length < 50) {
      issues.push({
        title: 'AI Assistant gave very short response',
        description: `User query: "${query}"\n\nAI Response: "${response}"\n\nResponse seems unusually brief and may not adequately address the user's question.`,
        type: 'improvement',
        urgency: 'low',
        tags: ['ai-assistant', 'response-quality', 'short-response'],
        submitted_by: userId
      })
    }
    
    // Pattern 2: Response contains error indicators
    const errorPatterns = [
      'I apologize', 'I\'m sorry', 'I cannot', 'I don\'t have access',
      'unable to', 'not available', 'try again later', 'having trouble'
    ]
    const hasErrorPattern = errorPatterns.some(pattern => 
      response.toLowerCase().includes(pattern.toLowerCase())
    )
    
    if (hasErrorPattern) {
      issues.push({
        title: 'AI Assistant response indicates system limitation',
        description: `User query: "${query}"\n\nAI Response: "${response}"\n\nResponse contains indicators of system limitations or errors that may need attention.`,
        type: 'bug',
        urgency: 'medium', 
        tags: ['ai-assistant', 'system-limitation', 'error-response'],
        submitted_by: userId
      })
    }
    
    // Pattern 3: Response seems off-topic (very basic check)
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 3)
    const responseWords = response.toLowerCase().split(' ')
    const relevanceScore = queryWords.filter(word => 
      responseWords.some(respWord => respWord.includes(word) || word.includes(respWord))
    ).length / queryWords.length
    
    if (relevanceScore < 0.2 && query.length > 20) {
      issues.push({
        title: 'AI Assistant response may be off-topic',
        description: `User query: "${query}"\n\nAI Response: "${response}"\n\nResponse appears to have low relevance to the user's question (relevance score: ${(relevanceScore * 100).toFixed(1)}%).`,
        type: 'improvement',
        urgency: 'low',
        tags: ['ai-assistant', 'response-quality', 'relevance'],
        submitted_by: userId
      })
    }
    
    // Pattern 4: User asking about repeated problems (frustration indicators)
    const frustrationPatterns = [
      'still not working', 'doesn\'t work', 'not helping', 'frustrated',
      'keep getting', 'same problem', 'broken', 'fix this'
    ]
    const hasFrustrationPattern = frustrationPatterns.some(pattern =>
      query.toLowerCase().includes(pattern.toLowerCase())
    )
    
    if (hasFrustrationPattern) {
      issues.push({
        title: 'User expressing frustration with system',
        description: `User query: "${query}"\n\nUser appears to be experiencing ongoing issues or frustration. This may indicate a systemic problem that needs attention.`,
        type: 'bug',
        urgency: 'high',
        tags: ['ai-assistant', 'user-experience', 'frustration'],
        submitted_by: userId
      })
    }
    
    // Create issues (but limit to prevent spam - max 1 per type per user per hour)
    for (const issueData of issues) {
      // Check if similar issue was recently created by this user
      const recentIssues = await supabase
        .from('issues')
        .select('id, created_at')
        .eq('submitted_by', userId)
        .contains('tags', [issueData.tags[0]]) // Check first tag
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Within last hour
        
      if (!recentIssues.data || recentIssues.data.length === 0) {
        // Create the issue
        await supabase
          .from('issues')
          .insert({
            ...issueData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'open'
          })
      }
    }
  } catch (error) {
    // Don't let issue creation failure break the main flow
    console.error('Error in auto-issue creation:', error)
  }
}

// Function to detect feature suggestions and guide users through structured feedback
async function handleFeatureSuggestions(userId: string, query: string, originalResponse: string, supabase: any) {
  try {
    // Feature suggestion detection patterns
    const featurePatterns = [
      'i have an idea', 'new feature', 'feature request', 'suggestion', 'could you add',
      'it would be great if', 'wish there was', 'would love to see', 'missing feature',
      'enhancement', 'improve by', 'add functionality', 'new capability'
    ]
    
    const hasFeatureSuggestion = featurePatterns.some(pattern =>
      query.toLowerCase().includes(pattern.toLowerCase())
    )
    
    if (!hasFeatureSuggestion) {
      return null // No feature suggestion detected
    }
    
    // Get user's previous AI Assistant queries to check for feature conversation flow
    const { data: recentLogs } = await supabase
      .from('ai_assistant_logs')
      .select('query, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)
    
    const recentQueries = (recentLogs || []).map(log => log.query.toLowerCase())
    
    // Check if user is already in feature submission flow
    const inFeatureFlow = recentQueries.some(q => 
      q.includes('feature') || q.includes('suggestion') || q.includes('idea')
    )
    
    // Extract potential feature details from the current query
    const featureDetails = extractFeatureDetails(query)
    
    // Determine what information is missing
    const missingInfo = []
    if (!featureDetails.title) missingInfo.push('title')
    if (!featureDetails.description) missingInfo.push('description') 
    if (!featureDetails.useCase) missingInfo.push('use case')
    
    // Generate response based on current state
    if (!inFeatureFlow) {
      // Initial feature suggestion detected
      return `Thank you for sharing your feature idea! I'd love to help you submit this to our development team for consideration.

To properly document your suggestion, I'll need to gather a few details:

${featureDetails.title ? `✓ **Feature Title:** ${featureDetails.title}` : '• **Feature Title:** What would you call this feature?'}
${featureDetails.description ? `✓ **Description:** ${featureDetails.description}` : '• **Description:** How would this feature work?'}
${featureDetails.useCase ? `✓ **Use Case:** ${featureDetails.useCase}` : '• **Use Case:** When and why would you use this feature?'}

${missingInfo.length === 0 
  ? 'I have all the details I need! Would you like me to submit this feature request to the team?' 
  : `Could you please provide ${missingInfo.length === 1 ? 'the missing' : 'these missing'} details: **${missingInfo.join(', ')}**?`
}

Just reply with the additional information, and I'll help you submit a complete feature request!`
    
    } else if (missingInfo.length > 0) {
      // Still collecting information
      return `Thanks for the additional details! 

${featureDetails.title ? `✓ **Feature Title:** ${featureDetails.title}` : '• **Feature Title:** Still needed'}
${featureDetails.description ? `✓ **Description:** ${featureDetails.description}` : '• **Description:** Still needed'}
${featureDetails.useCase ? `✓ **Use Case:** ${featureDetails.useCase}` : '• **Use Case:** Still needed'}

${missingInfo.length === 1 
  ? `I just need one more thing: **${missingInfo[0]}**. Can you provide that?`
  : `I still need: **${missingInfo.join(', ')}**. Can you provide these details?`
}`
    
    } else {
      // All information collected - create the feature request issue
      await supabase
        .from('issues')
        .insert({
          title: featureDetails.title,
          description: `**Feature Request from User**

**Description:**
${featureDetails.description}

**Use Case:**
${featureDetails.useCase}

**Original User Query:**
"${query}"

**Requested by:** User ID ${userId}`,
          type: 'feature',
          urgency: 'low',
          tags: ['feature-request', 'user-suggestion', 'ai-assistant'],
          submitted_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'open'
        })
      
      return `Perfect! I've submitted your feature request to our development team. Here's what I've recorded:

**Feature Title:** ${featureDetails.title}
**Description:** ${featureDetails.description}  
**Use Case:** ${featureDetails.useCase}

Your suggestion has been added to our feature backlog and will be reviewed by our development team. Thank you for helping us improve BeAligned!

You can track the status of feature requests and other feedback in the Issues section if you have admin access, or feel free to ask me about it anytime.`
    }
    
  } catch (error) {
    console.error('Error in feature suggestion handling:', error)
    return null // Fall back to original response
  }
}

// Helper function to extract feature details from user query
function extractFeatureDetails(query: string) {
  const details = {
    title: null as string | null,
    description: null as string | null,
    useCase: null as string | null
  }
  
  // Simple extraction logic - look for key phrases and patterns
  const queryLower = query.toLowerCase()
  
  // Extract title from common patterns
  const titlePatterns = [
    /(?:add|create|build|make)\s+(?:a\s+)?(.+?)(?:\s+that|\s+which|\s+to|\s+for|$)/i,
    /(?:feature|idea|suggestion).*?(?:for|to)\s+(.+?)(?:\s+that|\s+which|$)/i,
    /(?:i\s+)(?:want|need|wish|would like)\s+(?:a\s+)?(.+?)(?:\s+that|\s+which|\s+to|$)/i
  ]
  
  for (const pattern of titlePatterns) {
    const match = query.match(pattern)
    if (match && match[1] && match[1].trim().length > 5) {
      details.title = match[1].trim()
      break
    }
  }
  
  // Extract description from the overall query context
  if (query.length > 50) {
    details.description = query.replace(/^.*?(?:i have an idea|suggestion|feature request).*?[:.]?\s*/i, '').trim()
    if (details.description.length < 20) {
      details.description = null
    }
  }
  
  // Extract use case from common patterns
  const useCasePatterns = [
    /(?:when|because|since|so that|to help|for)\s+(.+)$/i,
    /(?:this would|it would|would help)\s+(.+)$/i,
    /(?:use case|scenario|situation).*?:?\s*(.+)$/i
  ]
  
  for (const pattern of useCasePatterns) {
    const match = query.match(pattern)
    if (match && match[1] && match[1].trim().length > 10) {
      details.useCase = match[1].trim()
      break
    }
  }
  
  return details
}

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

    // Get request body
    const { query } = await req.json()
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch assistant settings to determine profile context level
    const { data: assistantSettings } = await supabase
      .from('assistant_settings')
      .select('profile_context_enabled, profile_context_level, profile_include_children, profile_include_family, profile_include_professionals, profile_include_financial, profile_include_medical, profile_include_custody, profile_include_history')
      .eq('is_active', true)
      .single()

    // Fetch comprehensive user profile for personalization
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch user's recent conversation history for context
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, title, created_at, completed_at, completion_step')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch recent messages from those conversations
    let recentMessages = []
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id)
      const { data: messages } = await supabase
        .from('messages')
        .select('content, role, conversation_id, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(20)
      
      recentMessages = messages || []
    }

    // Fetch user's previous AI assistant interactions
    const { data: previousAILogs } = await supabase
      .from('ai_assistant_logs')
      .select('query, response, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch relevant document chunks for context enhancement
    let documentContext = '';
    try {
      // Get all processed documents (admin view - all documents available)
      const { data: documents } = await supabase
        .from('documents')
        .select('id, original_name')
        .eq('processing_status', 'completed')
        .limit(10)

      if (documents && documents.length > 0) {
        // Get chunks from all available documents
        const documentIds = documents.map(d => d.id)
        const { data: chunks } = await supabase
          .from('document_chunks')
          .select('content, chunk_index, document_id')
          .in('document_id', documentIds)
          .order('chunk_index', { ascending: true })
          .limit(8) // Limit total chunks for context window

        if (chunks && chunks.length > 0) {
          // Create document context with relevant content
          const contextChunks = chunks.map((chunk, index) => {
            const doc = documents.find(d => d.id === chunk.document_id)
            const docName = doc?.original_name || 'Document'
            return `[${docName} - Section ${chunk.chunk_index + 1}]\n${chunk.content}`
          }).join('\n\n---\n\n')

          documentContext = `\n\nGuidebook & Reference Materials:\n${contextChunks}\n\n`
        }
      }
    } catch (docError) {
      console.error('Error fetching document context:', docError)
      // Continue without document context if there's an error
    }

    // Build context for the AI
    let contextSummary = "\n\nUser Context:\n"
    
    // Add user profile information based on admin settings
    if (userProfile && assistantSettings?.profile_context_enabled) {
      contextSummary += `User: ${userProfile.full_name || userProfile.first_name || 'User'}\n`
      
      // Extract metadata for comprehensive profile
      const metadata = userProfile.metadata || {}
      const settings = assistantSettings
      
      // Profile level determines what gets included
      const includeBasic = ['basic', 'moderate', 'full'].includes(settings.profile_context_level)
      const includeModerate = ['moderate', 'full'].includes(settings.profile_context_level)
      const includeFull = settings.profile_context_level === 'full'
      
      // Basic co-parenting info (included in basic and above)
      if (includeBasic) {
        if (metadata.co_parent_name) {
          contextSummary += `Co-parent: ${metadata.co_parent_name}\n`
        }
        if (metadata.relationship_status) {
          contextSummary += `Relationship status: ${metadata.relationship_status}\n`
        }
      }
      
      // Children information
      if (settings.profile_include_children && metadata.children && Array.isArray(metadata.children)) {
        contextSummary += `Children:\n`
        metadata.children.forEach((child: any) => {
          contextSummary += `  - ${child.name}, age ${child.age}`
          if (child.grade) contextSummary += `, ${child.grade} grade`
          if (settings.profile_include_medical && child.medical_needs) {
            contextSummary += ` (medical: ${child.medical_needs})`
          }
          contextSummary += `\n`
        })
      }
      
      // Family members
      if (settings.profile_include_family && metadata.family_members) {
        contextSummary += `Extended family involved: ${JSON.stringify(metadata.family_members)}\n`
      }
      
      // Custody arrangements
      if (settings.profile_include_custody && metadata.custody_arrangement) {
        const custody = metadata.custody_arrangement
        contextSummary += `Custody: ${custody.type} - ${custody.schedule}\n`
        if (custody.exchange_location) {
          contextSummary += `Exchange location: ${custody.exchange_location}\n`
        }
      }
      
      // Professional support team
      if (settings.profile_include_professionals && metadata.professionals) {
        contextSummary += `Support team:\n`
        if (metadata.professionals.attorney) {
          contextSummary += `  - Attorney: ${metadata.professionals.attorney.name}\n`
        }
        if (metadata.professionals.mediator) {
          contextSummary += `  - Mediator: ${metadata.professionals.mediator.name}\n`
        }
        if (metadata.professionals.therapist) {
          contextSummary += `  - Therapist: ${metadata.professionals.therapist.name}\n`
        }
      }
      
      // Communication preferences (moderate and above)
      if (includeModerate && metadata.communication_preferences) {
        contextSummary += `Communication preference: ${metadata.communication_preferences.preferred_method}\n`
        if (metadata.communication_preferences.use_parenting_app) {
          contextSummary += `Uses app: ${metadata.communication_preferences.use_parenting_app}\n`
        }
      }
      
      // Goals and challenges (basic and above)
      if (includeBasic) {
        if (metadata.goals && Array.isArray(metadata.goals)) {
          contextSummary += `Co-parenting goals: ${metadata.goals.join(', ')}\n`
        }
        if (metadata.conflict_areas && Array.isArray(metadata.conflict_areas)) {
          contextSummary += `Conflict areas: ${metadata.conflict_areas.join(', ')}\n`
        }
      }
      
      // Financial arrangements
      if (settings.profile_include_financial && metadata.financial_arrangements) {
        if (metadata.financial_arrangements.child_support) {
          contextSummary += `Child support: $${metadata.financial_arrangements.child_support.amount} ${metadata.financial_arrangements.child_support.frequency}\n`
        }
      }
      
      // Medical information
      if (settings.profile_include_medical && metadata.medical_info) {
        if (metadata.medical_info.insurance_provider) {
          contextSummary += `Insurance: ${metadata.medical_info.insurance_provider}\n`
        }
        if (metadata.allergies) {
          contextSummary += `Allergies: ${metadata.allergies}\n`
        }
      }
      
      // History and background (full level only)
      if (settings.profile_include_history && includeFull) {
        if (metadata.separation_date) {
          contextSummary += `Separation date: ${metadata.separation_date}\n`
        }
        if (metadata.special_needs) {
          contextSummary += `Special needs: ${metadata.special_needs}\n`
        }
        if (metadata.cultural_considerations) {
          contextSummary += `Cultural considerations: ${metadata.cultural_considerations}\n`
        }
      }
      
      contextSummary += "\n"
    }
    
    if (conversations && conversations.length > 0) {
      contextSummary += `The user has ${conversations.length} recent conversations about co-parenting.\n`
      const completedConvs = conversations.filter(c => c.completed_at)
      if (completedConvs.length > 0) {
        contextSummary += `They have completed ${completedConvs.length} conversations.\n`
      }
    }
    
    if (recentMessages.length > 0) {
      contextSummary += "\nRecent conversation topics include:\n"
      const userMessages = recentMessages.filter(m => m.role === 'user').slice(0, 5)
      userMessages.forEach(msg => {
        contextSummary += `- ${msg.content.substring(0, 100)}...\n`
      })
    }

    if (previousAILogs && previousAILogs.length > 0) {
      contextSummary += "\nPrevious questions to AI Assistant:\n"
      previousAILogs.slice(0, 3).forEach(log => {
        contextSummary += `Q: ${log.query}\n`
      })
    }

    // Log the AI assistant query
    await supabase
      .from('ai_assistant_logs')
      .insert({
        user_id: user.id,
        query,
        created_at: new Date().toISOString()
      })

    // Call OpenAI API with context
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + documentContext + contextSummary },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error('Failed to get AI response')
    }

    const completion = await openaiResponse.json()
    let aiResponse = completion.choices[0].message.content

    // Check for feature suggestions and enhance response accordingly
    const featureResponse = await handleFeatureSuggestions(user.id, query, aiResponse, supabase)
    if (featureResponse) {
      aiResponse = featureResponse
    }

    // Auto-create issue if response quality seems poor or certain patterns detected
    await checkAndCreateIssues(user.id, query, aiResponse, supabase)

    // Log the response
    await supabase
      .from('ai_assistant_logs')
      .update({ 
        response: aiResponse,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('AI Assistant error:', error)
    
    // Auto-create issue for system errors
    try {
      const { data: { user: errorUser } } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '')
      
      if (errorUser) {
        await supabase
          .from('issues')
          .insert({
            title: 'AI Assistant system error',
            description: `System error occurred in AI Assistant:\n\nError: ${error.message}\n\nStack: ${error.stack || 'No stack trace available'}\n\nUser ID: ${errorUser.id}`,
            type: 'bug',
            urgency: 'high',
            tags: ['ai-assistant', 'system-error', 'edge-function'],
            submitted_by: errorUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'open'
          })
      }
    } catch (issueError) {
      console.error('Failed to create error issue:', issueError)
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble processing your request right now. Please try again later or use the BeH2O Chat for assistance."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
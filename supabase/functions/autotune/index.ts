import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id, x-user-email',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

interface AutoTuneRecommendation {
  setting: string;
  action: 'increase' | 'decrease' | 'set' | 'enable' | 'disable';
  from?: any;
  to: any;
  confidence: number;
  rationale: string;
}

interface AutoTuneProposal {
  profile: string;
  template?: string;
  window: { from: string; to: string };
  metrics: Record<string, number>;
  recommendations: AutoTuneRecommendation[];
  governance_links: string[];
  top_examples: Array<{ chatId: string; messageId: string; tags: string[] }>;
  dry_run: boolean;
}

// Governance rules mapping issues to solutions
const GOVERNANCE_RULES = {
  'too_long': {
    threshold: 0.3,
    recommendations: [
      { setting: 'max_tokens', action: 'decrease', factor: 0.75, rationale: 'Reduce verbosity', field: 'max_tokens' },
      { setting: 'instructions', action: 'append', value: '\n\n**IMPORTANT:** Keep responses concise and focused.', rationale: 'Add conciseness instruction', field: 'instructions' }
    ],
    governance_links: ['guide:clear/concise']
  },
  'drifted': {
    threshold: 0.15,
    recommendations: [
      { setting: 'temperature', action: 'decrease', factor: 0.8, rationale: 'Reduce response variability', field: 'temperature' },
      { setting: 'instructions', action: 'append', value: '\n\n**FOCUS:** Stay strictly on-topic with the seven-step process.', rationale: 'Add focus instruction', field: 'instructions' }
    ],
    governance_links: ['guardrail:scope/focus', 'process:guidance_adherence']
  },
  'too_sharp': {
    threshold: 0.1,
    recommendations: [
      { setting: 'temperature', action: 'increase', factor: 1.2, rationale: 'Soften tone with higher temperature', field: 'temperature' },
      { setting: 'instructions', action: 'append', value: '\n\n**TONE:** Use warm, empathetic language. Avoid directness that could seem harsh.', rationale: 'Add empathy instruction', field: 'instructions' }
    ],
    governance_links: ['guardrail:tone/calm', 'guide:empathy']
  },
  'too_theoretical': {
    threshold: 0.2,
    recommendations: [
      { setting: 'instructions', action: 'append', value: '\n\n**FORMAT:** Provide practical, actionable steps in bullet points.', rationale: 'Add practical format instruction', field: 'instructions' },
      { setting: 'top_p', action: 'decrease', factor: 0.9, rationale: 'Focus on more probable/practical suggestions', field: 'top_p' }
    ],
    governance_links: ['guide:practical_steps', 'process:actionable_outputs']
  },
  'parent_centric': {
    threshold: 0.05,
    recommendations: [
      { setting: 'instructions', action: 'append', value: '\n\n**PRIORITY:** Always center the child\'s needs and wellbeing in responses.', rationale: 'Add child-centered instruction', field: 'instructions' },
      { setting: 'presence_penalty', action: 'increase', value: 0.3, rationale: 'Reduce repetitive parent-focused patterns', field: 'presence_penalty' }
    ],
    governance_links: ['guardrail:child_centered', 'guide:balance/priorities']
  },
  'skipped_steps': {
    threshold: 0.1,
    recommendations: [
      { setting: 'phase1_prompt_enabled', action: 'set', value: true, rationale: 'Enable phase 1 prompting', field: 'phase1_prompt_enabled' },
      { setting: 'instructions', action: 'append', value: '\n\n**PROCESS:** Follow the seven-step process sequentially. Do not skip steps.', rationale: 'Add process enforcement', field: 'instructions' }
    ],
    governance_links: ['process:seven_step', 'guide:structured_approach']
  },
  'validation_needed': {
    threshold: 0.05,
    recommendations: [
      { setting: 'instructions', action: 'append', value: '\n\n**VALIDATION:** Begin responses by acknowledging and validating the user\'s feelings.', rationale: 'Add validation instruction', field: 'instructions' },
      { setting: 'temperature', action: 'increase', factor: 1.1, rationale: 'Increase warmth through temperature', field: 'temperature' }
    ],
    governance_links: ['guide:emotional_validation', 'process:acknowledgment']
  },
  'needs_empathy': {
    threshold: 0.05,
    recommendations: [
      { setting: 'temperature', action: 'increase', factor: 1.2, rationale: 'Increase empathetic warmth', field: 'temperature' },
      { setting: 'instructions', action: 'append', value: '\n\n**EMPATHY:** Show deep understanding and compassion. Use phrases like "I understand how difficult this must be"', rationale: 'Add empathy scaffolding', field: 'instructions' },
      { setting: 'frequency_penalty', action: 'decrease', value: -0.2, rationale: 'Allow more empathetic repetition', field: 'frequency_penalty' }
    ],
    governance_links: ['guardrail:tone/empathetic', 'guide:empathy']
  },
  'emotional_support': {
    threshold: 0.05,
    recommendations: [
      { setting: 'instructions', action: 'append', value: '\n\n**SUPPORT:** Provide emotional support and encouragement. Acknowledge strength and resilience.', rationale: 'Add supportive language', field: 'instructions' },
      { setting: 'max_tokens', action: 'increase', factor: 1.2, rationale: 'Allow space for supportive elaboration', field: 'max_tokens' },
      { setting: 'temperature', action: 'increase', factor: 1.15, rationale: 'Increase warmth in responses', field: 'temperature' }
    ],
    governance_links: ['guide:emotional_support', 'guardrail:tone/supportive']
  },
  'faith_based': {
    threshold: 0.05,
    recommendations: [
      { setting: 'instructions', action: 'append', value: '\n\n**SPIRITUALITY:** Be respectful of faith perspectives. Use inclusive spiritual language when appropriate.', rationale: 'Add spiritual sensitivity', field: 'instructions' },
      { setting: 'greeting_include_motivational_quote', action: 'set', value: true, rationale: 'Include inspirational elements', field: 'greeting_include_motivational_quote' }
    ],
    governance_links: ['guide:spiritual_sensitivity', 'process:inclusive_language']
  },
  // RAG-specific governance rules
  'insufficient_grounding': {
    threshold: 0.1,
    recommendations: [
      { setting: 'retrieval_min_score', action: 'increase', factor: 1.2, rationale: 'Increase relevance threshold to improve grounding', field: 'retrieval_min_score' },
      { setting: 'retrieval_k', action: 'increase', factor: 1.5, rationale: 'Retrieve more documents for better context', field: 'retrieval_k' }
    ],
    governance_links: ['rag:grounding', 'policy:citation_required']
  },
  'missing_citation': {
    threshold: 0.05,
    recommendations: [
      { setting: 'instructions', action: 'append', value: '\n\n**CITATIONS:** Always cite relevant sections from retrieved documents when using their content.', rationale: 'Enforce citation requirements', field: 'instructions' },
      { setting: 'retrieval_enabled', action: 'set', value: true, rationale: 'Enable retrieval to support citations', field: 'retrieval_enabled' }
    ],
    governance_links: ['rag:citations', 'policy:attribution']
  },
  'irrelevant_chunks': {
    threshold: 0.15,
    recommendations: [
      { setting: 'retrieval_max_per_doc', action: 'decrease', factor: 0.7, rationale: 'Reduce chunks per document to improve relevance', field: 'retrieval_max_per_doc' },
      { setting: 'retrieval_min_score', action: 'increase', factor: 1.3, rationale: 'Increase relevance threshold', field: 'retrieval_min_score' }
    ],
    governance_links: ['rag:relevance', 'process:quality_control']
  },
  'too_many_chunks': {
    threshold: 0.1,
    recommendations: [
      { setting: 'retrieval_max_tokens', action: 'decrease', factor: 0.8, rationale: 'Reduce context window for clearer responses', field: 'retrieval_max_tokens' },
      { setting: 'retrieval_k', action: 'decrease', factor: 0.7, rationale: 'Retrieve fewer documents to reduce noise', field: 'retrieval_k' }
    ],
    governance_links: ['rag:context_management', 'guide:clarity']
  }
}

// Simple XML parsing without DOM dependency
async function parseBeAlignedXML(xmlContent: string): Promise<{
  source: string;
  conversations: Array<{
    id: string;
    profile: string;
    template: string;
    messages: Array<{
      id: string;
      role: string;
      timestamp: string;
      content?: string;
      phase?: number;
      reflection?: string;
      feedback?: { tags: string[] };
      refinements?: Array<{ category: string; text: string }>;
    }>;
  }>;
}> {
  // Simple XML extraction using regex for BeAligned format
  const isBeAligned = xmlContent.includes('<BeAlignedReflection>');
  
  if (isBeAligned) {
    const messages: any[] = [];
    const timestamp = new Date().toISOString();
    
    // Extract content between tags using regex
    const extractContent = (tag: string, xml: string): string | null => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };
    
    // Parse each phase
    for (let i = 1; i <= 7; i++) {
      const phaseRegex = new RegExp(`<Phase${i}>([\\s\\S]*?)<\\/Phase${i}>`, 'i');
      const phaseMatch = xmlContent.match(phaseRegex);
      
      if (!phaseMatch) continue;
      
      const phaseContent = phaseMatch[1];
      const prompt = extractContent('Prompt', phaseContent);
      const userResponse = extractContent('UserResponse', phaseContent);
      const reflection = extractContent('Reflection', phaseContent);
      const reflectionMessage = extractContent('ReflectionMessage', phaseContent);
      const finalNote = extractContent('FinalNote', phaseContent);
      const closureReflection = extractContent('ClosureReflection', phaseContent);
      
      // Add user message if exists
      if (userResponse) {
        messages.push({
          id: `phase${i}_user`,
          role: 'user',
          timestamp,
          content: userResponse,
          phase: i
        });
      }
      
      // Add assistant response (reflection or message)
      if (reflection || reflectionMessage || closureReflection) {
        const assistantMessage: any = {
          id: `phase${i}_assistant`,
          role: 'assistant',
          timestamp,
          content: reflectionMessage || closureReflection || reflection,
          phase: i,
          reflection
        };
        
        // Analyze reflection for feedback tags
        if (reflection) {
          const tags: string[] = [];
          const lowerReflection = reflection.toLowerCase();
          
          // Analyze for common issues based on the reflection
          if (lowerReflection.includes('unseen') || lowerReflection.includes('unheard')) {
            tags.push('validation_needed');
          }
          if (lowerReflection.includes('complex') || lowerReflection.includes('vulnerable')) {
            tags.push('needs_empathy');
          }
          if (lowerReflection.includes('spiritual') || lowerReflection.includes('faith')) {
            tags.push('faith_based');
          }
          if (lowerReflection.includes('emotional')) {
            tags.push('emotional_support');
          }
          
          if (tags.length > 0) {
            assistantMessage.feedback = { tags };
          }
        }
        
        messages.push(assistantMessage);
      }
      
      // Add final note as separate message if exists
      if (finalNote) {
        messages.push({
          id: `phase${i}_final`,
          role: 'user',
          timestamp,
          content: finalNote,
          phase: i
        });
      }
    }
    
    return {
      source: 'BeAligned',
      conversations: [{
        id: `reflection_${Date.now()}`,
        profile: 'co-parenting',
        template: 'seven-phase',
        messages
      }]
    };
  }
  
  // Otherwise try to parse as generic XML
  const result = await parseGenericXMLChatLog(xmlContent);
  if (result.source === 'generic-xml-needs-ai') {
    throw new Error('Generic XML format not recognized. Using AI parsing instead.');
  }
  return result;
}

async function parseGenericXMLChatLog(xmlContent: string): Promise<{
  source: string;
  conversations: Array<{
    id: string;
    profile: string;
    template: string;
    messages: Array<{
      id: string;
      role: string;
      timestamp: string;
      content?: string;
      model?: string;
      latencyMs?: number;
      feedback?: { tags: string[] };
      refinements?: Array<{ category: string; text: string }>;
    }>;
  }>;
}> {
  // For generic XML, we'll just use the AI to parse it
  // This avoids DOM dependency issues
  // Instead of throwing an error, we'll return a signal to use AI parsing
  return {
    source: 'generic-xml-needs-ai',
    conversations: []
  };
}

async function ingestXMLData(
  supabase: any,
  parsedData: any,
  importId: string,
  userId: string
): Promise<{
  messagesCount: number;
  feedbackCount: number;
  refinementsCount: number;
}> {
  let messagesCount = 0;
  let feedbackCount = 0;
  let refinementsCount = 0;
  
  for (const conv of parsedData.conversations) {
    for (const msg of conv.messages) {
      messagesCount++;
      
      // If there's feedback, insert it
      if (msg.feedback && msg.feedback.tags.length > 0) {
        try {
          await supabase
            .from('message_feedback')
            .insert({
              chat_id: `xml_${conv.id}`,
              message_id: `xml_${msg.id}`,
              rater_user_id: userId,
              category: 'quality', // Default category for XML imports
              tags: msg.feedback.tags,
              source_type: 'external',
              source_import_id: importId,
              created_at: msg.timestamp
            });
          feedbackCount++;
        } catch (error) {
          console.error('Error inserting feedback:', error);
        }
      }
      
      // If there are refinements, insert them
      if (msg.refinements && msg.refinements.length > 0) {
        for (const ref of msg.refinements) {
          try {
            await supabase
              .from('message_refinements')
              .insert({
                chat_id: `xml_${conv.id}`,
                message_id: `xml_${msg.id}`,
                rater_user_id: userId,
                category: ref.category,
                primary_text: ref.text,
                governance_tags: [], // Could be enhanced to extract from text
                source_type: 'external',
                source_import_id: importId,
                created_at: msg.timestamp
              });
            refinementsCount++;
          } catch (error) {
            console.error('Error inserting refinement:', error);
          }
        }
      }
    }
  }
  
  return { messagesCount, feedbackCount, refinementsCount };
}

async function analyzeImportedData(supabase: any, importId: string): Promise<any> {
  // Analyze the imported data and generate recommendations
  const { data: feedback } = await supabase
    .from('message_feedback')
    .select('tags')
    .eq('source_import_id', importId)
  
  const { data: refinements } = await supabase
    .from('message_refinements')
    .select('category, governance_tags')
    .eq('source_import_id', importId)
  
  // Aggregate patterns
  const patterns = {
    phaseTransitions: 0,
    empathyNeeded: 0,
    tooVerbose: 0,
    offTopic: 0,
    validationMissed: 0
  }
  
  feedback?.forEach(f => {
    f.tags?.forEach((tag: string) => {
      if (tag === 'too_long') patterns.tooVerbose++
      if (tag === 'drifted') patterns.offTopic++
      if (tag === 'validation_needed') patterns.validationMissed++
      if (tag === 'needs_empathy') patterns.empathyNeeded++
    })
  })
  
  // Generate recommendations for Admin Tuner settings
  const recommendations = []
  
  if (patterns.tooVerbose > 2) {
    recommendations.push({
      setting: 'Model / Max Tokens',
      current: '4000',
      suggested: '500',
      reason: 'Multiple instances of verbose responses detected'
    })
  }
  
  if (patterns.offTopic > 1) {
    recommendations.push({
      setting: 'Instructions / Phase Recognition',
      action: 'Add explicit phase transition triggers',
      reason: 'Responses not following phase structure properly'
    })
  }
  
  if (patterns.empathyNeeded > 2) {
    recommendations.push({
      setting: 'Temperature',
      current: '0.7',
      suggested: '0.8',
      reason: 'Increase warmth and empathy in responses'
    })
  }
  
  if (patterns.validationMissed > 1) {
    recommendations.push({
      setting: 'Instructions / Response Style',
      action: 'Add validation acknowledgment requirements',
      reason: 'User feelings not being acknowledged'
    })
  }
  
  return {
    patterns,
    recommendations
  }
}

// Document analysis function to generate settings proposals
async function analyzeDocuments(supabase: any): Promise<AutoTuneRecommendation[]> {
  // Get all completed documents and their chunks
  const { data: documents } = await supabase
    .from('documents')
    .select('id, original_name, chunk_count')
    .eq('processing_status', 'completed');

  if (!documents || documents.length === 0) {
    return [];
  }

  // Get document chunks for analysis
  const { data: chunks } = await supabase
    .from('document_chunks')
    .select('content, document_id')
    .in('document_id', documents.map(d => d.id))
    .order('chunk_index')
    .limit(50); // Limit to prevent token overload

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // Prepare document content for AI analysis
  const documentContent = documents.map(doc => {
    const docChunks = chunks.filter(c => c.document_id === doc.id);
    return {
      name: doc.original_name,
      content: docChunks.map(c => c.content).join('\n\n').slice(0, 3000) // Limit per document
    };
  }).map(doc => `Document: ${doc.name}\n${doc.content}`).join('\n\n---\n\n');

  // Use OpenAI to analyze documents and suggest settings
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: `You are a BeAligned™ expert analyzing uploaded documents to recommend optimal AI assistant settings.

Analyze the provided BeAligned™ documents and recommend specific settings adjustments based on:

1. **Communication Style**: How formal/casual should responses be?
2. **Phase Structure**: Are there specific phase instructions to incorporate?
3. **Tone Requirements**: What tone is emphasized in the methodology?
4. **Citation Needs**: How much should AI cite the documents?
5. **Response Length**: What level of detail is appropriate?
6. **Empathy Level**: How much emotional validation is needed?

Return ONLY a JSON array of recommendations in this exact format:
[
  {
    "setting": "temperature",
    "action": "set",
    "to": 0.7,
    "confidence": 0.85,
    "rationale": "Documents emphasize warm, consistent responses"
  },
  {
    "setting": "instructions", 
    "action": "append",
    "to": "\n\nFollow BeAligned 7-phase methodology as outlined in the guidebook.",
    "confidence": 0.90,
    "rationale": "Documents contain specific phase instructions"
  }
]

Focus on settings that directly improve alignment with the uploaded methodology.`
      }, {
        role: 'user',
        content: `Analyze these BeAligned™ documents and recommend settings:\n\n${documentContent}`
      }],
      temperature: 0.3,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    const recommendations = JSON.parse(content);
    return Array.isArray(recommendations) ? recommendations : [];
  } catch (parseError) {
    console.error('Failed to parse AI recommendations:', parseError);
    return [];
  }
}

// Function to update pending proposals when documents change
async function updatePendingProposals(supabase: any): Promise<void> {
  // Get all pending proposals
  const { data: pendingProposals } = await supabase
    .from('autotune_proposals')
    .select('*')
    .eq('status', 'pending')
    .eq('dry_run', true);

  if (!pendingProposals || pendingProposals.length === 0) {
    return;
  }

  console.log(`Updating ${pendingProposals.length} pending proposals due to document changes`);

  for (const proposal of pendingProposals) {
    try {
      // Re-analyze documents for this proposal
      const documentRecommendations = await analyzeDocuments(supabase);
      
      if (documentRecommendations.length === 0) {
        continue;
      }

      // Merge new document recommendations with existing ones
      // Remove old document-based recommendations and add new ones
      const existingRecs = proposal.recommendations || [];
      const nonDocRecs = existingRecs.filter((rec: any) => 
        !rec.rationale?.includes('Documents') && 
        !rec.rationale?.includes('methodology') &&
        !rec.rationale?.includes('guidebook')
      );
      
      const updatedRecommendations = [...nonDocRecs, ...documentRecommendations];
      
      // Update governance links
      const existingLinks = proposal.governance_links || [];
      const updatedLinks = [...new Set([...existingLinks, 'document:analysis', 'methodology:alignment'])];

      // Update the proposal
      await supabase
        .from('autotune_proposals')
        .update({
          recommendations: updatedRecommendations,
          governance_links: updatedLinks,
          updated_at: new Date().toISOString(),
          metadata: {
            ...proposal.metadata,
            auto_updated_documents: new Date().toISOString(),
            document_recommendations_count: documentRecommendations.length
          }
        })
        .eq('id', proposal.id);

      console.log(`Updated proposal ${proposal.id} with ${documentRecommendations.length} document recommendations`);
    } catch (error) {
      console.error(`Error updating proposal ${proposal.id}:`, error);
    }
  }
}

async function analyzeWithAI(content: string): Promise<{
  normalizedData: any;
  detectedFormat: string;
  confidence: number;
}> {
  // Use OpenAI to analyze and normalize any chat format (XML, JSON, text, CSV, etc.)
  const openAIKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured')
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a chat conversation analyzer that can parse ANY format (XML, JSON, plain text, CSV, chat logs, etc.) and normalize them.
          
          Analyze the content for:
          1. Conversation structure (phases, turns, threads)
          2. User messages and AI/assistant responses
          3. Any feedback, ratings, annotations, or quality indicators
          4. Issues or problems to tune:
             - "too_long": verbose/lengthy responses
             - "drifted": off-topic or unfocused
             - "needs_empathy": lacking emotional validation
             - "skipped_steps": didn't follow process/phases
             - "too_sharp": harsh tone
             - "parent_centric": not child-focused
             - "validation_needed": didn't acknowledge feelings
          
          For BeAligned 7-phase conversations, identify phase transitions.
          
          Return a JSON object with:
          {
            "format": "XML|JSON|text|CSV|chat_log|BeAligned|unknown",
            "conversations": [{
              "id": "conv_1",
              "messages": [{
                "role": "user|assistant",
                "content": "message text",
                "phase": 1-7 if applicable,
                "issues": ["too_long", "drifted", etc],
                "quality_score": 1-5 if available
              }]
            }],
            "patterns": {
              "avgResponseLength": number,
              "phaseCompletionRate": 0.0-1.0,
              "empathyScore": 0.0-1.0
            },
            "confidence": 0.0-1.0
          }`
        },
        {
          role: 'user',
          content: `Parse this chat export (could be any format):\n\n${content.substring(0, 8000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to analyze content with AI')
  }
  
  const result = await response.json()
  const parsed = JSON.parse(result.choices[0].message.content)
  
  return {
    normalizedData: parsed,
    detectedFormat: parsed.format,
    confidence: parsed.confidence
  }
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
    
    // Get user info from headers (custom auth)
    const userEmail = req.headers.get('x-user-email')
    const userId = req.headers.get('x-user-id')
    
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'No user email provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user exists and is admin using email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, user_type')
      .eq('email', userEmail)
      .single()

    if (userError || !userData?.user_type || !['admin', 'super_admin'].includes(userData.user_type)) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(p => p)

    if (req.method === 'POST' && path[path.length - 1] === 'run') {
      // Run auto-tune analysis
      const { window, dryRun = true } = await req.json()
      
      const fromDate = window?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const toDate = window?.to || new Date().toISOString()

      console.log('Analysis window:', { fromDate, toDate })
      
      // Analyze feedback and refinements
      const { data: feedback, error: feedbackError } = await supabase
        .from('message_feedback')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

      if (feedbackError) {
        throw feedbackError
      }

      const { data: refinements, error: refinementError } = await supabase
        .from('message_refinements')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

      if (refinementError) {
        throw refinementError
      }

      console.log(`Found ${feedback.length} feedback items and ${refinements.length} refinements`)

      // Get unique import IDs from the feedback
      const importIds = new Set([
        ...feedback.map(f => f.source_import_id).filter(Boolean),
        ...refinements.map(r => r.source_import_id).filter(Boolean)
      ])

      // Calculate metrics
      const totalFeedback = feedback.length + refinements.length
      if (totalFeedback === 0) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'No feedback data to analyze in the selected time window',
          proposals: [],
          debug: {
            window: { from: fromDate, to: toDate },
            feedbackCount: feedback.length,
            refinementCount: refinements.length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Aggregate tag frequencies
      const tagFrequency: Record<string, number> = {}
      
      feedback.forEach(f => {
        f.tags?.forEach((tag: string) => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
          
          // Map to RAG-specific issues if applicable
          const ragTagMap: Record<string, string> = {
            'drifted': 'insufficient_grounding',
            'missing_citation': 'missing_citation', 
            'too_theoretical': 'irrelevant_chunks',
            'unclear': 'too_many_chunks'
          }
          
          if (ragTagMap[tag]) {
            tagFrequency[ragTagMap[tag]] = (tagFrequency[ragTagMap[tag]] || 0) + 1
          }
        })
      })

      refinements.forEach(r => {
        // Map refinement categories to feedback tags
        const categoryTagMap: Record<string, string> = {
          'correction': 'accuracy_issue',
          'missing_followup_prompt': 'skipped_steps',
          'alternative_response': 'tone_issue',
          'insert_prompt_before': 'missing_context',
          'guidance_for_future': 'process_improvement'
        }
        
        // Map feedback tags to RAG-specific issues
        const ragTagMap: Record<string, string> = {
          'drifted': 'insufficient_grounding',
          'missing_citation': 'missing_citation',
          'too_theoretical': 'irrelevant_chunks',
          'unclear': 'too_many_chunks'
        }
        
        const tag = categoryTagMap[r.category] || 'general_improvement'
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1

        r.governance_tags?.forEach((gtag: string) => {
          tagFrequency[gtag] = (tagFrequency[gtag] || 0) + 1
        })
      })

      // Calculate issue rates
      const issueRates: Record<string, number> = {}
      Object.keys(tagFrequency).forEach(tag => {
        issueRates[tag] = tagFrequency[tag] / totalFeedback
      })

      // Fetch current assistant settings to show before/after
      const { data: currentSettings } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      // Generate recommendations based on governance rules
      const recommendations: AutoTuneRecommendation[] = []
      const governanceLinks: string[] = []
      const topExamples: Array<{ chatId: string; messageId: string; tags: string[] }> = []

      Object.entries(GOVERNANCE_RULES).forEach(([issue, rule]) => {
        const rate = issueRates[issue] || 0
        if (rate >= rule.threshold) {
          rule.recommendations.forEach(rec => {
            const recommendation: AutoTuneRecommendation = {
              setting: rec.setting,
              action: rec.action,
              confidence: Math.min(rate / rule.threshold, 1.0),
              rationale: `${rec.rationale} (${issue} rate: ${(rate * 100).toFixed(1)}%)`
            }

            // Get current value if we have a field mapping
            if (rec.field && currentSettings) {
              recommendation.from = currentSettings[rec.field]
            }

            // Calculate the new value based on action
            if (rec.action === 'append') {
              // For append action, always append to existing value
              const fieldName = rec.field || rec.setting
              const currentValue = currentSettings ? currentSettings[fieldName] || '' : ''
              recommendation.from = currentValue
              recommendation.to = currentValue + (rec.value || '')
            } else if (rec.factor) {
              if (rec.action === 'increase' || rec.action === 'decrease') {
                const currentValue = recommendation.from || 1.0
                recommendation.to = typeof currentValue === 'number' ? 
                  currentValue * rec.factor : rec.factor
              }
            } else if (rec.value !== undefined) {
              recommendation.to = rec.value
            }

            recommendations.push(recommendation)
          })
          
          governanceLinks.push(...rule.governance_links)
        }
      })

      // Analyze uploaded documents for additional recommendations
      try {
        console.log('Analyzing uploaded documents for settings recommendations...');
        const documentRecommendations = await analyzeDocuments(supabase);
        
        if (documentRecommendations.length > 0) {
          console.log(`Generated ${documentRecommendations.length} document-based recommendations`);
          recommendations.push(...documentRecommendations);
          governanceLinks.push('document:analysis', 'methodology:alignment');
        }
      } catch (docError) {
        console.error('Error analyzing documents:', docError);
        // Continue without document analysis if it fails
      }

      // Get top examples for high-frequency issues
      const topIssues = Object.entries(issueRates)
        .filter(([_, rate]) => rate >= 0.1)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3)

      for (const [issue, _] of topIssues) {
        const exampleFeedback = feedback.find(f => f.tags?.includes(issue))
        const exampleRefinement = refinements.find(r => 
          r.governance_tags?.includes(issue) || 
          (issue === 'skipped_steps' && r.category === 'missing_followup_prompt')
        )

        const example = exampleFeedback || exampleRefinement
        if (example) {
          topExamples.push({
            chatId: example.chat_id,
            messageId: example.message_id,
            tags: [issue]
          })
        }
      }

      // Create proposal
      const proposal: AutoTuneProposal = {
        profile: 'default', // Could be extracted from system_profile_id
        window: { from: fromDate, to: toDate },
        metrics: issueRates,
        recommendations,
        governance_links: [...new Set(governanceLinks)],
        top_examples: topExamples,
        dry_run: dryRun
      }

      console.log('Creating proposal with:', {
        recommendations_count: recommendations.length,
        metrics: Object.keys(issueRates),
        governance_links_count: proposal.governance_links.length
      })

      // If no recommendations, still save the proposal with the metrics
      if (recommendations.length === 0) {
        console.log('No recommendations generated based on current thresholds')
        // Still save proposal to show metrics even without recommendations
      }

      // Save proposal to database with import tracking
      const { data: savedProposal, error: saveError } = await supabase
        .from('autotune_proposals')
        .insert({
          profile_id: proposal.profile,
          recommendations: proposal.recommendations || [],  // Ensure it's at least an empty array
          metrics: proposal.metrics || {},
          governance_links: proposal.governance_links || [],
          window_start: fromDate,
          window_end: toDate,
          status: 'pending',
          created_by: userData.id,
          dry_run: dryRun,
          metadata: {
            import_ids: Array.from(importIds),
            feedback_count: feedback.length,
            refinement_count: refinements.length
          }
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving proposal:', saveError)
        throw saveError
      }

      console.log('Proposal saved successfully:', savedProposal?.id)

      // Log auto-tune event
      await supabase
        .from('autotune_events')
        .insert({
          event_type: 'proposal_generated',
          profile_id: proposal.profile,
          payload: {
            proposal_id: savedProposal.id,
            metrics_count: Object.keys(issueRates).length,
            recommendations_count: recommendations.length
          },
          created_by: userData.id
        })

      return new Response(JSON.stringify({ 
        success: true, 
        proposal: { ...proposal, id: savedProposal.id }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'GET' && path[path.length - 1] === 'proposals') {
      // Get all proposals
      const { data, error } = await supabase
        .from('autotune_proposals')
        .select('*, creator:users!created_by(email), reviewer:users!reviewed_by(email)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'PATCH' && path.includes('proposals')) {
      // Accept/reject/apply proposal
      const proposalId = path[path.indexOf('proposals') + 1]
      const { status, notes, apply = false, selectedRecommendations } = await req.json()

      if (!['accepted', 'rejected', 'applied'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get the proposal details
      const { data: proposal, error: fetchError } = await supabase
        .from('autotune_proposals')
        .select('*')
        .eq('id', proposalId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // If applying the proposal, actually update the settings
      if (status === 'accepted' && apply) {
        // Get current settings for backup
        const { data: currentSettings, error: settingsError } = await supabase
          .from('assistant_settings')
          .select('*')
          .eq('is_active', true)
          .single()

        if (!settingsError && currentSettings) {
          // Apply only selected recommendations (or all if none specified)
          const indicesToApply = selectedRecommendations || proposal.recommendations.map((_, i) => i)
          
          // Create a backup of current settings in autotune_events
          await supabase
            .from('autotune_events')
            .insert({
              event_type: 'settings_backup',
              profile_id: proposal.profile_id || 'default',
              payload: {
                proposal_id: proposalId,
                backup_settings: currentSettings,
                applied_at: new Date().toISOString(),
                selected_indices: indicesToApply
              },
              created_by: userData.id
            })

          const updates: Record<string, any> = {}
          const appliedRecommendations: any[] = []
          
          for (let i = 0; i < proposal.recommendations.length; i++) {
            if (!indicesToApply.includes(i)) continue // Skip unselected recommendations
            
            const rec = proposal.recommendations[i]
            appliedRecommendations.push({
              ...rec,
              index: i,
              previousValue: currentSettings[rec.setting] || currentSettings[rec.field] || null
            })
            
            const fieldName = rec.field || rec.setting // Use the field mapping if available
            
            if (rec.action === 'append' && fieldName === 'instructions') {
              // For instructions, append to existing
              const currentInstructions = currentSettings.instructions || ''
              const appendText = rec.to || ''
              updates.instructions = currentInstructions + (appendText.replace ? appendText.replace(currentInstructions, '') : appendText)
            } else if (rec.action === 'set' || rec.action === 'enable') {
              // For other settings, set the new value
              updates[fieldName] = rec.to
            } else if ((rec.action === 'increase' || rec.action === 'decrease') && fieldName) {
              // For numeric changes
              updates[fieldName] = rec.to
            }
          }

          // Update the assistant settings
          const { error: updateError } = await supabase
            .from('assistant_settings')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
              updated_by: userData.id
            })
            .eq('id', currentSettings.id)

          if (updateError) {
            console.error('Failed to apply settings:', updateError)
            return new Response(JSON.stringify({ 
              error: 'Failed to apply settings', 
              details: updateError 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          console.log('Applied proposal settings:', { 
            proposalId, 
            updates,
            appliedCount: appliedRecommendations.length,
            selectedIndices: indicesToApply
          })
        }
      }

      // Update proposal status
      const { data, error } = await supabase
        .from('autotune_proposals')
        .update({
          status: apply ? 'applied' : status,
          reviewed_by: userData.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', proposalId)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Log the decision
      await supabase
        .from('autotune_events')
        .insert({
          event_type: apply ? 'proposal_applied' : `proposal_${status}`,
          profile_id: data.profile_id,
          payload: {
            proposal_id: proposalId,
            notes,
            applied: apply
          },
          created_by: userData.id
        })

      return new Response(JSON.stringify({ success: true, data, applied: apply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST' && path[path.length - 1] === 'revert') {
      // Revert to previous settings from backup
      const { proposalId } = await req.json()
      
      // Find the backup for this proposal
      const { data: backup, error: backupError } = await supabase
        .from('autotune_events')
        .select('*')
        .eq('event_type', 'settings_backup')
        .eq('payload->proposal_id', proposalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (backupError || !backup) {
        return new Response(JSON.stringify({ error: 'No backup found for this proposal' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const backupSettings = backup.payload.backup_settings
      
      // Restore the backup settings
      const { error: restoreError } = await supabase
        .from('assistant_settings')
        .update({
          instructions: backupSettings.instructions,
          model: backupSettings.model,
          temperature: backupSettings.temperature,
          max_tokens: backupSettings.max_tokens,
          top_p: backupSettings.top_p,
          frequency_penalty: backupSettings.frequency_penalty,
          presence_penalty: backupSettings.presence_penalty,
          phase1_prompt_enabled: backupSettings.phase1_prompt_enabled,
          greeting_include_motivational_quote: backupSettings.greeting_include_motivational_quote,
          updated_at: new Date().toISOString(),
          updated_by: userData.id
        })
        .eq('id', backupSettings.id)
      
      if (restoreError) {
        return new Response(JSON.stringify({ error: 'Failed to restore settings', details: restoreError }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Update proposal status to show it was reverted
      await supabase
        .from('autotune_proposals')
        .update({
          status: 'reverted',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', proposalId)
      
      // Log the revert
      await supabase
        .from('autotune_events')
        .insert({
          event_type: 'proposal_reverted',
          profile_id: backup.profile_id,
          payload: {
            proposal_id: proposalId,
            restored_from_backup: backup.id
          },
          created_by: userData.id
        })
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Settings reverted successfully',
        restored_settings: backupSettings
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST' && path[path.length - 1] === 'import') {
      // Import chat data for analysis (any format: XML, JSON, text, etc.)
      const { content, filename = 'imported_chat.txt', useAI = true } = await req.json()
      
      if (!content) {
        return new Response(JSON.stringify({ error: 'Content required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      try {
        let parsedData
        let detectedFormat = 'unknown'
        
        // Try to detect format first
        const trimmedContent = content.trim()
        
        // Always try native parsing first, fall back to AI if it fails
        let parseError = null
        
        try {
          if (trimmedContent.includes('<BeAlignedReflection>') || trimmedContent.includes('<Phase1>')) {
            // Try BeAligned XML parsing
            parsedData = await parseBeAlignedXML(content)
            detectedFormat = parsedData.source
          } else if (trimmedContent.startsWith('<')) {
            // Generic XML - use AI
            throw new Error('Generic XML needs AI parsing')
          } else if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
            // Try JSON parsing
            const jsonData = JSON.parse(content)
            // Convert JSON to our format
            parsedData = {
              source: 'JSON',
              conversations: Array.isArray(jsonData) ? jsonData : [jsonData]
            }
            detectedFormat = 'JSON'
          } else {
            // Plain text or unknown format - use AI
            throw new Error('Unknown format needs AI parsing')
          }
        } catch (e) {
          parseError = e.message
          console.log('Native parsing failed, using AI:', parseError)
          
          // Fall back to AI parsing
          try {
            const aiResult = await analyzeWithAI(content)
            parsedData = {
              source: aiResult.detectedFormat,
              conversations: aiResult.normalizedData.conversations.map((conv: any) => ({
                ...conv,
                messages: conv.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: msg.timestamp || new Date().toISOString(),
                  feedback: msg.issues?.length > 0 ? { tags: msg.issues } : undefined
                }))
              }))
            }
            detectedFormat = aiResult.detectedFormat
          } catch (aiError) {
            console.error('AI parsing also failed:', aiError)
            throw new Error(`Failed to parse content. Native parser: ${parseError}. AI parser: ${aiError.message}`)
          }
        }
        
        // Calculate checksum for audit and duplicate detection
        const encoder = new TextEncoder()
        const data = encoder.encode(content)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        // Check for duplicate imports
        const { data: existingImport, error: dupCheckError } = await supabase
          .from('autotune_xml_imports')
          .select('id, filename, created_at, status')
          .eq('checksum', checksum)
          .single()
        
        if (existingImport) {
          console.log('Duplicate import detected:', { 
            originalFile: existingImport.filename,
            originalDate: existingImport.created_at,
            attemptedFile: filename
          })
          
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Duplicate content detected',
            message: `This content was already imported as "${existingImport.filename}" on ${new Date(existingImport.created_at).toLocaleDateString()}`,
            existingImport: {
              id: existingImport.id,
              filename: existingImport.filename,
              importedAt: existingImport.created_at,
              status: existingImport.status
            }
          }), {
            status: 409, // Conflict status code
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        // Create import record
        const { data: importRecord, error: importError } = await supabase
          .from('autotune_xml_imports')
          .insert({
            filename,
            source: parsedData.source,
            file_path: `inline/${Date.now()}/${filename}`,
            file_size: content.length,
            checksum,
            status: 'processing',
            conversations_count: parsedData.conversations.length,
            uploaded_by: userData.id
          })
          .select()
          .single()
        
        if (importError) {
          throw importError
        }
        
        // Ingest the data
        const { messagesCount, feedbackCount, refinementsCount } = await ingestXMLData(
          supabase,
          parsedData,
          importRecord.id,
          userData.id
        )
        
        // Update import record with counts
        await supabase
          .from('autotune_xml_imports')
          .update({
            status: 'completed',
            messages_count: messagesCount,
            feedback_count: feedbackCount,
            refinements_count: refinementsCount,
            processed_at: new Date().toISOString()
          })
          .eq('id', importRecord.id)
        
        // Analyze imported data for recommendations
        const analysis = await analyzeImportedData(supabase, importRecord.id)
        
        return new Response(JSON.stringify({ 
          success: true,
          importId: importRecord.id,
          stats: {
            conversations: parsedData.conversations.length,
            messages: messagesCount,
            feedback: feedbackCount,
            refinements: refinementsCount
          },
          analysis
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
        
      } catch (parseError) {
        console.error('XML parsing error:', parseError)
        return new Response(JSON.stringify({ 
          error: 'Failed to parse XML',
          details: parseError.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    
    if (req.method === 'GET' && path[path.length - 1] === 'imports') {
      // Get all XML imports
      const { data, error } = await supabase
        .from('autotune_xml_imports')
        .select('*, uploader:users!uploaded_by(email)')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        throw error
      }
      
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST' && path[path.length - 1] === 'refresh-proposals') {
      // Update pending proposals due to document changes
      try {
        await updatePendingProposals(supabase);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Pending proposals updated with document changes' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to refresh proposals' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in autotune function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
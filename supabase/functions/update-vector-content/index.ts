// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VectorUpdateRequest {
  originalContent: string
  improvedContent: string
  feedbackType: 'alternative_response' | 'thumbs_down' | 'content_improvement' | 'admin_suggestion'
  context: {
    phase?: number
    messageType?: 'ai_response' | 'phase_header' | 'welcome' | 'closing'
    userInput?: string
    sessionContext?: any
  }
  updateType: 'user_improvement' | 'negative_weighting' | 'positive_reinforcement' | 'content_replacement'
  confidence?: number // How confident we are in this improvement (0-1)
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

    const request = await req.json() as VectorUpdateRequest

    console.log('🔄 Vector content update request:', {
      updateType: request.updateType,
      feedbackType: request.feedbackType,
      phase: request.context.phase,
      messageType: request.context.messageType
    })

    const results = await processVectorUpdate(supabaseClient, request)

    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )

  } catch (error) {
    console.error('❌ Error updating vector content:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    )
  }
})

async function processVectorUpdate(supabase: any, request: VectorUpdateRequest) {
  const actions = []
  
  switch (request.updateType) {
    case 'user_improvement':
      // User provided better alternative - add it as new content and downweight original
      await addImprovedContent(supabase, request)
      await downweightOriginalContent(supabase, request)
      actions.push('Added improved content', 'Downweighted original')
      break
      
    case 'negative_weighting':
      // Thumbs down - reduce the likelihood of similar content being selected
      await downweightOriginalContent(supabase, request)
      await flagForReview(supabase, request)
      actions.push('Downweighted content', 'Flagged for review')
      break
      
    case 'positive_reinforcement':
      // Thumbs up - increase likelihood and create variations
      await reinforcePositiveContent(supabase, request)
      await generateSimilarContent(supabase, request)
      actions.push('Reinforced positive content', 'Generated variations')
      break
      
    case 'content_replacement':
      // Admin/high-confidence replacement - replace existing content
      await replaceContent(supabase, request)
      actions.push('Replaced content directly')
      break
  }
  
  // Update learning metrics
  await updateLearningMetrics(supabase, request, actions)
  
  return {
    actionsExecuted: actions,
    contentUpdated: true,
    learningCycleCompleted: true
  }
}

// Add improved content based on user feedback
async function addImprovedContent(supabase: any, request: VectorUpdateRequest) {
  // Generate embedding for the improved content
  const improvedEmbedding = await generateEmbedding(request.improvedContent)
  
  // Determine which table to update based on context
  const contentType = determineContentType(request.context)
  const tableName = getTableForContentType(contentType)
  
  if (tableName === 'bealigned_content_chunks') {
    // Add as new chunk with high relevance score
    await supabase
      .from('bealigned_content_chunks')
      .insert({
        parent_content_id: await getParentContentId(supabase, request.context),
        chunk_index: 9999 + Math.floor(Math.random() * 1000), // High index for user improvements
        content: request.improvedContent,
        embedding: improvedEmbedding,
        phase_number: request.context.phase,
        situation_tags: [...(await extractSituationTags(request)), 'user_improved', 'feedback_enhanced'],
        feedback_source: {
          type: request.feedbackType,
          original_content: request.originalContent,
          improvement_confidence: request.confidence || 0.8,
          context: request.context
        }
      })
  } else if (tableName === 'session_closing_content') {
    // Add as improved closing content
    await supabase
      .from('session_closing_content')
      .insert({
        closing_type_id: await getClosingTypeId(supabase, request.context),
        title: `User-Improved ${request.context.messageType || 'Content'}`,
        content_template: request.improvedContent,
        situation_tags: ['user_improved', 'feedback_enhanced'],
        emotional_context: await extractEmotionalContext(request),
        embedding: improvedEmbedding,
        effectiveness_rating: request.confidence || 0.8,
        generation_method: 'user_feedback',
        is_active: true
      })
  }
  
  console.log('✅ Added improved content to vector database')
}

// Downweight original content that received negative feedback
async function downweightOriginalContent(supabase: any, request: VectorUpdateRequest) {
  // Find matching content in vector database
  const originalEmbedding = await generateEmbedding(request.originalContent)
  
  // Search for similar content to downweight
  const { data: similarChunks } = await supabase
    .rpc('search_chunks_by_similarity', {
      query_embedding: originalEmbedding,
      p_phase_number: request.context.phase,
      similarity_threshold: 0.9, // Very high threshold to find exact/near-exact matches
      match_count: 3
    })
  
  if (similarChunks && similarChunks.length > 0) {
    for (const chunk of similarChunks) {
      // Add negative feedback marker
      await supabase
        .from('bealigned_content_chunks')
        .update({
          situation_tags: [...(chunk.situation_tags || []), 'negative_feedback'],
          feedback_metadata: {
            ...chunk.feedback_metadata,
            negative_feedback_count: (chunk.feedback_metadata?.negative_feedback_count || 0) + 1,
            last_negative_feedback: new Date().toISOString(),
            downweight_factor: Math.min((chunk.feedback_metadata?.downweight_factor || 1) * 0.8, 0.3) // Progressive downweighting
          }
        })
        .eq('id', chunk.id)
    }
    console.log(`✅ Downweighted ${similarChunks.length} similar content pieces`)
  }
}

// Reinforce positive content
async function reinforcePositiveContent(supabase: any, request: VectorUpdateRequest) {
  const originalEmbedding = await generateEmbedding(request.originalContent)
  
  const { data: similarChunks } = await supabase
    .rpc('search_chunks_by_similarity', {
      query_embedding: originalEmbedding,
      p_phase_number: request.context.phase,
      similarity_threshold: 0.9,
      match_count: 3
    })
  
  if (similarChunks && similarChunks.length > 0) {
    for (const chunk of similarChunks) {
      await supabase
        .from('bealigned_content_chunks')
        .update({
          situation_tags: [...(chunk.situation_tags || []), 'positive_feedback'],
          feedback_metadata: {
            ...chunk.feedback_metadata,
            positive_feedback_count: (chunk.feedback_metadata?.positive_feedback_count || 0) + 1,
            last_positive_feedback: new Date().toISOString(),
            boost_factor: Math.min((chunk.feedback_metadata?.boost_factor || 1) * 1.2, 2.0) // Progressive boosting
          }
        })
        .eq('id', chunk.id)
    }
    console.log(`✅ Reinforced ${similarChunks.length} similar positive content pieces`)
  }
}

// Generate similar content based on positive feedback
async function generateSimilarContent(supabase: any, request: VectorUpdateRequest) {
  try {
    // Use AI to generate variations of successful content
    const prompt = `
Based on this successful BeAligned response that received positive feedback:
"${request.originalContent}"

Context: Phase ${request.context.phase}, ${request.context.messageType}

Generate 2 variations that:
- Maintain the same core message and tone
- Use slightly different language/approach
- Keep the BeAligned methodology intact
- Include Jacob's courage theme subtly if appropriate

Return as JSON array: ["variation1", "variation2"]
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are BeAligned AI, creating variations of successful responses while maintaining the core methodology and tone.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 400
      })
    })

    if (response.ok) {
      const data = await response.json()
      const variations = JSON.parse(data.choices[0].message.content)
      
      // Add each variation to the vector database
      for (const variation of variations) {
        const variationEmbedding = await generateEmbedding(variation)
        
        await supabase
          .from('bealigned_content_chunks')
          .insert({
            parent_content_id: await getParentContentId(supabase, request.context),
            chunk_index: 8000 + Math.floor(Math.random() * 1000), // Variation range
            content: variation,
            embedding: variationEmbedding,
            phase_number: request.context.phase,
            situation_tags: ['ai_generated_variation', 'positive_feedback_derived'],
            feedback_source: {
              type: 'positive_variation',
              source_content: request.originalContent,
              generation_method: 'ai_variation'
            }
          })
      }
      
      console.log(`✅ Generated and added ${variations.length} content variations`)
    }
  } catch (error) {
    console.error('Error generating similar content:', error)
  }
}

// Flag content for manual review
async function flagForReview(supabase: any, request: VectorUpdateRequest) {
  await supabase
    .from('content_review_queue')
    .insert({
      content: request.originalContent,
      content_type: determineContentType(request.context),
      flag_reason: `Negative feedback: ${request.feedbackType}`,
      context: request.context,
      priority: request.confidence && request.confidence > 0.8 ? 'high' : 'medium',
      status: 'pending',
      flagged_at: new Date().toISOString()
    })
  
  console.log('✅ Flagged content for manual review')
}

// Replace content directly (high confidence changes)
async function replaceContent(supabase: any, request: VectorUpdateRequest) {
  const originalEmbedding = await generateEmbedding(request.originalContent)
  const improvedEmbedding = await generateEmbedding(request.improvedContent)
  
  // Find and update the exact content
  const { data: matchingChunks } = await supabase
    .rpc('search_chunks_by_similarity', {
      query_embedding: originalEmbedding,
      p_phase_number: request.context.phase,
      similarity_threshold: 0.95, // Very high threshold for exact replacement
      match_count: 1
    })
  
  if (matchingChunks && matchingChunks.length > 0) {
    await supabase
      .from('bealigned_content_chunks')
      .update({
        content: request.improvedContent,
        embedding: improvedEmbedding,
        situation_tags: [...(matchingChunks[0].situation_tags || []), 'admin_replaced'],
        feedback_source: {
          type: 'content_replacement',
          original_content: request.originalContent,
          replaced_by: request.feedbackType,
          replacement_date: new Date().toISOString()
        }
      })
      .eq('id', matchingChunks[0].id)
    
    console.log('✅ Replaced content directly in vector database')
  }
}

// Update learning metrics
async function updateLearningMetrics(supabase: any, request: VectorUpdateRequest, actions: string[]) {
  await supabase
    .from('vector_learning_metrics')
    .insert({
      update_type: request.updateType,
      feedback_type: request.feedbackType,
      context: request.context,
      actions_executed: actions,
      confidence_level: request.confidence || 0.5,
      processed_at: new Date().toISOString()
    })
}

// Helper functions
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002',
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

function determineContentType(context: any): string {
  if (context.messageType === 'closing') return 'session_closing'
  if (context.messageType === 'welcome') return 'welcome'
  if (context.messageType === 'phase_header') return 'phase_guidance'
  return 'general_guidance'
}

function getTableForContentType(contentType: string): string {
  if (contentType === 'session_closing') return 'session_closing_content'
  return 'bealigned_content_chunks'
}

async function getParentContentId(supabase: any, context: any): Promise<number> {
  // Get the main instructions content ID as default parent
  const { data } = await supabase
    .from('bealigned_content')
    .select('id')
    .eq('content_type', 'instructions')
    .eq('status', 'active')
    .single()
  
  return data?.id || 1
}

async function getClosingTypeId(supabase: any, context: any): Promise<number> {
  // Default to closing_reflection type
  const { data } = await supabase
    .from('session_closing_types')
    .select('id')
    .eq('closing_type', 'closing_reflection')
    .single()
  
  return data?.id || 1
}

async function extractSituationTags(request: VectorUpdateRequest): Promise<string[]> {
  const tags = []
  if (request.context.phase) tags.push(`phase_${request.context.phase}`)
  if (request.context.messageType) tags.push(request.context.messageType)
  tags.push('feedback_derived')
  return tags
}

async function extractEmotionalContext(request: VectorUpdateRequest): Promise<string[]> {
  // Extract emotional context from the improved content
  const content = request.improvedContent.toLowerCase()
  const emotions = []
  
  if (/empowerment|strength|courage/.test(content)) emotions.push('empowered')
  if (/peace|calm|grounded/.test(content)) emotions.push('peaceful')
  if (/clarity|understand|clear/.test(content)) emotions.push('clarity')
  if (/support|help|guidance/.test(content)) emotions.push('supportive')
  
  return emotions.length > 0 ? emotions : ['supportive']
}
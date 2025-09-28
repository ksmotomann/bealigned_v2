import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id, x-user-email',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface MessageFeedback {
  chatId: string;
  messageId: string;
  category: string;
  rating?: number;
  tags?: string[];
  comment?: string;
}

interface MessageRefinement {
  chatId: string;
  messageId: string;
  category: string;
  primaryText: string;
  notes?: string;
  governanceTags?: string[];
  systemProfileId?: string;
  promptTemplateId?: string;
  model?: string;
  applyAsOverride?: boolean;
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
    const action = url.searchParams.get('action')

    // Handle different endpoints
    // Check for refinements endpoint FIRST (more specific path)
    if (req.method === 'POST' && path[path.length - 1] === 'refinements') {
      // Create/update message refinement
      console.log('Processing refinement submission:', { userEmail, userId, userData })
      
      const refinement: MessageRefinement = await req.json()
      console.log('Refinement data:', refinement)
      
      const insertData = {
        chat_id: refinement.chatId,
        message_id: refinement.messageId,
        rater_user_id: userData.id,
        category: refinement.category,
        primary_text: refinement.primaryText,
        notes: refinement.notes,
        governance_tags: refinement.governanceTags || [],
        system_profile_id: refinement.systemProfileId,
        prompt_template_id: refinement.promptTemplateId,
        model: refinement.model,
        apply_as_override: refinement.applyAsOverride || false
      }
      console.log('Insert data:', insertData)
      
      const { data, error } = await supabase
        .from('message_refinements')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        throw error
      }

      console.log('Refinement inserted successfully:', data)
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // General feedback endpoint (less specific, check after refinements)
    if (req.method === 'POST' && !action) {
      // Create/update message feedback
      const feedback: MessageFeedback = await req.json()
      
      const { data, error } = await supabase
        .from('message_feedback')
        .upsert({
          chat_id: feedback.chatId,
          message_id: feedback.messageId,
          rater_user_id: userData.id,
          category: feedback.category,
          rating: feedback.rating,
          tags: feedback.tags || [],
          comment: feedback.comment,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'chat_id,message_id,rater_user_id,category'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'GET' && action === 'aggregate') {
      // Get feedback aggregates for Auto-Tune
      const fromDate = url.searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const toDate = url.searchParams.get('to') || new Date().toISOString()
      
      // Get feedback aggregates
      const { data: feedback, error: feedbackError } = await supabase
        .from('message_feedback')
        .select('category, tags, rating, created_at')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

      if (feedbackError) {
        throw feedbackError
      }

      // Get refinement aggregates
      const { data: refinements, error: refinementError } = await supabase
        .from('message_refinements')
        .select('category, governance_tags, system_profile_id, prompt_template_id, created_at')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

      if (refinementError) {
        throw refinementError
      }

      // Aggregate metrics
      const metrics = {
        feedback: {
          total: feedback.length,
          by_category: {},
          avg_rating: 0,
          tag_frequency: {}
        },
        refinements: {
          total: refinements.length,
          by_category: {},
          governance_tag_frequency: {},
          by_profile: {}
        }
      }

      // Process feedback
      feedback.forEach(f => {
        metrics.feedback.by_category[f.category] = (metrics.feedback.by_category[f.category] || 0) + 1
        
        if (f.rating) {
          metrics.feedback.avg_rating += f.rating
        }

        f.tags?.forEach(tag => {
          metrics.feedback.tag_frequency[tag] = (metrics.feedback.tag_frequency[tag] || 0) + 1
        })
      })

      if (feedback.length > 0) {
        metrics.feedback.avg_rating = metrics.feedback.avg_rating / feedback.length
      }

      // Process refinements
      refinements.forEach(r => {
        metrics.refinements.by_category[r.category] = (metrics.refinements.by_category[r.category] || 0) + 1
        
        if (r.system_profile_id) {
          metrics.refinements.by_profile[r.system_profile_id] = (metrics.refinements.by_profile[r.system_profile_id] || 0) + 1
        }

        r.governance_tags?.forEach(tag => {
          metrics.refinements.governance_tag_frequency[tag] = (metrics.refinements.governance_tag_frequency[tag] || 0) + 1
        })
      })

      return new Response(JSON.stringify({ 
        success: true, 
        data: metrics,
        window: { from: fromDate, to: toDate }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'GET' && path.includes('refinements')) {
      // Get refinements for a specific message
      const chatId = url.searchParams.get('chatId')
      const messageId = url.searchParams.get('messageId')

      if (!chatId || !messageId) {
        return new Response(JSON.stringify({ error: 'chatId and messageId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase
        .from('message_refinements')
        .select('*, rater:users(email)')
        .eq('chat_id', chatId)
        .eq('message_id', messageId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in feedback function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
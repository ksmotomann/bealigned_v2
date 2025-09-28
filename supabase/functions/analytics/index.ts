import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const timeRange = url.searchParams.get('timeRange') || 'month'
    
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.user_type !== 'admin' && profile.user_type !== 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    // Get conversation stats
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, created_at, archived_at, user_id')
      .order('created_at', { ascending: false })

    const { data: messages } = await supabase
      .from('messages')
      .select('id, conversation_id, created_at')

    // Get user stats
    const { data: users } = await supabase
      .from('users')
      .select('id, created_at, user_type, is_active')

    // Get AI assistant stats
    const { data: aiQueries } = await supabase
      .from('ai_assistant_logs')
      .select('id, user_id, query, response_time_ms, created_at')
      .order('created_at', { ascending: false })

    // Get issues stats
    const { data: issues } = await supabase
      .from('issues')
      .select('id, status, type, created_at, resolved_at, urgency')

    // Calculate analytics
    const totalConversations = conversations?.length || 0
    const completedConversations = conversations?.filter(c => c.archived_at).length || 0
    const thisWeekConversations = conversations?.filter(c => 
      new Date(c.created_at) >= startOfWeek
    ).length || 0
    const lastWeekConversations = conversations?.filter(c => 
      new Date(c.created_at) >= startOfLastWeek && 
      new Date(c.created_at) < startOfWeek
    ).length || 0

    const activeUsers = new Set(conversations?.map(c => c.user_id)).size
    const totalUsers = users?.filter(u => u.user_type === 'user').length || 0
    const newUsersThisMonth = users?.filter(u => 
      new Date(u.created_at) >= startOfMonth
    ).length || 0
    const newUsersLastMonth = users?.filter(u => 
      new Date(u.created_at) >= startOfLastMonth && 
      new Date(u.created_at) < startOfMonth
    ).length || 0

    // Calculate message stats
    const messagesByConversation = messages?.reduce((acc, msg) => {
      acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const avgMessagesPerConversation = Object.values(messagesByConversation).length > 0
      ? Object.values(messagesByConversation).reduce((a, b) => a + b, 0) / Object.values(messagesByConversation).length
      : 0

    // AI Assistant stats
    const totalAiQueries = aiQueries?.length || 0
    const uniqueAiUsers = new Set(aiQueries?.map(q => q.user_id)).size
    const avgResponseTime = aiQueries?.length > 0
      ? aiQueries.reduce((acc, q) => acc + (q.response_time_ms || 0), 0) / aiQueries.length
      : 0

    // Issues stats
    const totalIssues = issues?.length || 0
    const openIssues = issues?.filter(i => i.status === 'open').length || 0
    const resolvedIssues = issues?.filter(i => i.status === 'resolved').length || 0
    const criticalIssues = issues?.filter(i => i.urgency === 'critical').length || 0
    
    const issuesByType = issues?.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate growth rates
    const userGrowthRate = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
      : 0

    const conversationsThisMonth = conversations?.filter(c => 
      new Date(c.created_at) >= startOfMonth
    ).length || 0
    const conversationsLastMonth = conversations?.filter(c => 
      new Date(c.created_at) >= startOfLastMonth && 
      new Date(c.created_at) < startOfMonth
    ).length || 0
    const conversationGrowthRate = conversationsLastMonth > 0
      ? ((conversationsThisMonth - conversationsLastMonth) / conversationsLastMonth) * 100
      : 0

    // Generate insights
    const insights = []
    
    if (userGrowthRate > 20) {
      insights.push({
        type: 'positive',
        message: `User growth is up ${userGrowthRate.toFixed(1)}% this month!`,
        metric: 'User Growth'
      })
    }
    
    if (completedConversations / totalConversations > 0.7) {
      insights.push({
        type: 'positive',
        message: `High completion rate: ${((completedConversations / totalConversations) * 100).toFixed(1)}% of conversations completed`,
        metric: 'Completion Rate'
      })
    }
    
    if (criticalIssues > 0) {
      insights.push({
        type: 'negative',
        message: `${criticalIssues} critical issue${criticalIssues > 1 ? 's' : ''} need attention`,
        metric: 'Critical Issues'
      })
    }
    
    if (insights.length === 0) {
      insights.push({
        type: 'neutral',
        message: `System is running smoothly with ${totalConversations} conversation${totalConversations !== 1 ? 's' : ''} tracked`,
        metric: 'System Status'
      })
    }

    const analyticsData = {
      conversationStats: {
        total: totalConversations,
        completed: completedConversations,
        averageDuration: 30, // Placeholder - would need to calculate from messages
        thisWeek: thisWeekConversations,
        lastWeek: lastWeekConversations,
        averageMessagesPerConversation: Math.round(avgMessagesPerConversation),
        completionRate: totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0
      },
      userEngagement: {
        activeUsers,
        totalUsers,
        averageConversationsPerUser: totalUsers > 0 ? totalConversations / totalUsers : 0,
        mostActiveDay: 'Wednesday', // Placeholder - would need to calculate
        mostActiveHour: 14, // Placeholder - would need to calculate
        userRetention30Days: 75 // Placeholder - would need to calculate
      },
      aiAssistant: {
        totalQueries: totalAiQueries,
        uniqueUsers: uniqueAiUsers,
        averageResponseTime: avgResponseTime,
        popularTopics: [
          { topic: 'Co-parenting communication', count: 45 },
          { topic: 'Conflict resolution', count: 38 },
          { topic: 'Emotional support', count: 32 }
        ], // Placeholder - would need NLP analysis
        satisfactionRate: 88 // Placeholder - would need feedback data
      },
      issues: {
        total: totalIssues,
        open: openIssues,
        resolved: resolvedIssues,
        byType: issuesByType,
        averageResolutionTime: 24, // Placeholder - would need to calculate
        criticalIssues
      },
      growth: {
        newUsersThisMonth,
        newUsersLastMonth,
        conversationsThisMonth,
        conversationsLastMonth,
        userGrowthRate,
        conversationGrowthRate
      },
      insights
    }

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
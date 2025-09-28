import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  const { timeRange = 'week' } = req.query;

  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get user's conversations in the time range
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*, messages(*)')
      .eq('user_id', req.userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (convError) throw convError;

    // Calculate analytics
    const totalConversations = conversations?.length || 0;
    const completedConversations = conversations?.filter(c => c.is_completed).length || 0;
    const totalMessages = conversations?.reduce((sum, c) => sum + (c.messages?.length || 0), 0) || 0;
    
    // Calculate average session duration for completed conversations
    const completedWithDuration = conversations?.filter(c => c.session_duration_minutes) || [];
    const avgSessionDuration = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, c) => sum + (c.session_duration_minutes || 0), 0) / completedWithDuration.length
      : 0;

    // Group conversations by day for chart data
    const conversationsByDay: Record<string, number> = {};
    const messagesByDay: Record<string, number> = {};
    
    conversations?.forEach(conv => {
      const date = new Date(conv.created_at).toISOString().split('T')[0];
      conversationsByDay[date] = (conversationsByDay[date] || 0) + 1;
      messagesByDay[date] = (messagesByDay[date] || 0) + (conv.messages?.length || 0);
    });

    // Generate date range for chart
    const chartData = [];
    const current = new Date(startDate);
    while (current <= now) {
      const dateStr = current.toISOString().split('T')[0];
      chartData.push({
        date: dateStr,
        conversations: conversationsByDay[dateStr] || 0,
        messages: messagesByDay[dateStr] || 0
      });
      current.setDate(current.getDate() + 1);
    }

    // Get completion rate by step
    const completionsByStep: Record<number, number> = {};
    conversations?.forEach(conv => {
      if (conv.completion_step) {
        completionsByStep[conv.completion_step] = (completionsByStep[conv.completion_step] || 0) + 1;
      }
    });

    res.json({
      summary: {
        totalConversations,
        completedConversations,
        completionRate: totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0,
        totalMessages,
        avgSessionDuration,
        avgMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0
      },
      chartData,
      completionsByStep,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get admin analytics (requires admin)
router.get('/admin', async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, is_super_admin')
      .eq('id', req.userId)
      .single();

    if (!profile?.is_admin && !profile?.is_super_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { timeRange = 'week' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get all conversations in the time range
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*, messages(*), profiles!conversations_user_id_fkey(email, full_name)')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (convError) throw convError;

    // Get user statistics
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (userError) throw userError;

    // Calculate admin-specific analytics
    const totalUsers = users?.length || 0;
    const activeUsers = new Set(conversations?.map(c => c.user_id)).size;
    const totalConversations = conversations?.length || 0;
    const completedConversations = conversations?.filter(c => c.is_completed).length || 0;
    const totalMessages = conversations?.reduce((sum, c) => sum + (c.messages?.length || 0), 0) || 0;

    // Get refinements count
    const { count: refinementsCount } = await supabaseAdmin
      .from('refinements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    res.json({
      summary: {
        totalUsers,
        newUsers: users?.length || 0,
        activeUsers,
        totalConversations,
        completedConversations,
        completionRate: totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0,
        totalMessages,
        refinementsCount: refinementsCount || 0
      },
      topUsers: conversations?.reduce((acc: any[], conv: any) => {
        const existing = acc.find(u => u.user_id === conv.user_id);
        if (existing) {
          existing.conversationCount++;
          existing.messageCount += conv.messages?.length || 0;
        } else {
          acc.push({
            user_id: conv.user_id,
            email: conv.profiles?.email,
            name: conv.profiles?.full_name,
            conversationCount: 1,
            messageCount: conv.messages?.length || 0
          });
        }
        return acc;
      }, []).sort((a, b) => b.conversationCount - a.conversationCount).slice(0, 10),
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch admin analytics:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

export default router;
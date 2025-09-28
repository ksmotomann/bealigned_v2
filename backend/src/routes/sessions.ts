import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

// Get current user's sessions
router.get('/my-sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', req.userId)
      .order('login_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get active sessions for current user
router.get('/active', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', req.userId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Terminate a specific session
router.post('/terminate/:sessionId', authenticate, async (req: AuthRequest, res) => {
  const { sessionId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({
        logout_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', sessionId)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// Admin: Get all sessions
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select(`
        *,
        profiles!user_sessions_user_id_fkey(email, full_name)
      `)
      .order('login_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all sessions' });
  }
});

// Admin: Get login attempts
router.get('/login-attempts', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login attempts' });
  }
});

// Admin: Get session statistics
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get active sessions count
    const { count: activeSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get today's logins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayLogins } = await supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('login_at', today.toISOString());

    // Get failed login attempts today
    const { count: failedAttempts } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('success', false)
      .gte('attempted_at', today.toISOString());

    // Get unique users logged in today
    const { data: uniqueUsers } = await supabaseAdmin
      .from('user_sessions')
      .select('user_id')
      .gte('login_at', today.toISOString());

    const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

    res.json({
      activeSessions,
      todayLogins,
      failedAttempts,
      uniqueUsersToday: uniqueUserCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session stats' });
  }
});

export default router;
import { Router, Request } from 'express';
import { createSupabaseClient, supabaseAdmin } from '../services/supabase';

const router = Router();

// Helper function to get client IP
const getClientIp = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.socket.remoteAddress || 
         'unknown';
};

// Helper function to track session
const trackSession = async (userId: string, sessionToken: string, req: Request) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  try {
    await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        ip_address: ip,
        user_agent: userAgent,
        login_method: 'password',
        device_info: {
          platform: req.headers['sec-ch-ua-platform'],
          mobile: req.headers['sec-ch-ua-mobile']
        }
      });
  } catch (error) {
    console.error('Failed to track session:', error);
  }
};

// Helper function to track login attempt
const trackLoginAttempt = async (email: string, success: boolean, req: Request, reason?: string) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  try {
    await supabaseAdmin
      .from('login_attempts')
      .insert({
        email,
        ip_address: ip,
        user_agent: userAgent,
        success,
        failure_reason: reason
      });
  } catch (error) {
    console.error('Failed to track login attempt:', error);
  }
};

router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`
        }
      }
    });

    if (error) {
      await trackLoginAttempt(email, false, req, error.message);
      return res.status(400).json({ error: error.message });
    }

    // Track successful registration as a session
    if (data.user && data.session) {
      await trackSession(data.user.id, data.session.access_token, req);
      await trackLoginAttempt(email, true, req);
    }

    res.json({ user: data.user, session: data.session });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      await trackLoginAttempt(email, false, req, error.message);
      return res.status(400).json({ error: error.message });
    }

    // Track successful login
    if (data.user && data.session) {
      await trackSession(data.user.id, data.session.access_token, req);
      await trackLoginAttempt(email, true, req);
    }

    res.json({ user: data.user, session: data.session });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const supabase = createSupabaseClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Mark session as logged out
      await supabaseAdmin
        .from('user_sessions')
        .update({ 
          logout_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('user_id', user.id)
        .eq('session_token', token)
        .eq('is_active', true);
    }
    
    await supabase.auth.signOut();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
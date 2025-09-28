import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

router.use(authenticate);

// Get all users (for regular users, returns limited info)
router.get('/', async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, is_super_admin')
      .eq('id', req.userId)
      .single();

    // Non-admins can only see basic info
    const selectFields = (!profile?.is_admin && !profile?.is_super_admin) 
      ? 'id, full_name'
      : 'id, email, first_name, last_name, full_name, created_at';

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(selectFields)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user profile
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/me', async (req: AuthRequest, res) => {
  const { first_name, last_name, phone } = req.body;

  try {
    const full_name = `${first_name || ''} ${last_name || ''}`.trim();
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name,
        last_name,
        full_name,
        phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
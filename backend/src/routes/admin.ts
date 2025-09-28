import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, full_name')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:userId/conversations', async (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  try {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        messages(*)
      `)
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user conversations' });
  }
});

router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        profiles!conversations_user_id_fkey(email, full_name),
        messages(*)
      `)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:conversationId', async (req: AuthRequest, res) => {
  const { conversationId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        profiles!conversations_user_id_fkey(email, full_name),
        messages(*, refinements(*))
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.post('/refinements', async (req: AuthRequest, res) => {
  const { messageId, refinedContent, notes, refinementType = 'alternative' } = req.body;

  console.log('Creating refinement:', { messageId, refinementType, userId: req.userId });

  try {
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('content')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      console.error('Message not found:', msgError);
      return res.status(404).json({ error: 'Message not found', details: msgError });
    }

    const { data, error } = await supabaseAdmin
      .from('refinements')
      .insert({
        message_id: messageId,
        admin_id: req.userId,
        original_content: message.content,
        refined_content: refinedContent,
        notes,
        refinement_type: refinementType
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to insert refinement:', error);
      throw error;
    }
    
    console.log('Refinement created successfully:', data?.id);
    res.json(data);
  } catch (error: any) {
    console.error('Failed to create refinement:', error);
    res.status(500).json({ error: 'Failed to create refinement', details: error.message });
  }
});

router.get('/refinements/:messageId', async (req: AuthRequest, res) => {
  const { messageId } = req.params;
  
  try {
    // First, just get the refinements without the join
    const { data: refinements, error: refError } = await supabaseAdmin
      .from('refinements')
      .select('*')
      .eq('message_id', messageId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (refError) {
      console.error('Error fetching refinements:', refError);
      // Return empty array if no refinements found
      return res.json([]);
    }

    // If we have refinements, get the admin info separately
    if (refinements && refinements.length > 0) {
      const adminIds = [...new Set(refinements.map(r => r.admin_id))];
      
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', adminIds);

      if (!profileError && profiles) {
        // Map profiles to refinements
        const profileMap = profiles.reduce((acc: any, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        refinements.forEach((refinement: any) => {
          refinement.profiles = profileMap[refinement.admin_id] || null;
        });
      }
    }
    
    res.json(refinements || []);
  } catch (error: any) {
    console.error('Failed to fetch refinements:', error);
    res.status(500).json({ error: 'Failed to fetch refinements', details: error.message });
  }
});

router.put('/refinements/:refinementId', async (req: AuthRequest, res) => {
  const { refinementId } = req.params;
  const { refinedContent, notes, isActive } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('refinements')
      .update({
        refined_content: refinedContent,
        notes,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', refinementId)
      .eq('admin_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update refinement' });
  }
});

router.delete('/refinements/:refinementId', async (req: AuthRequest, res) => {
  const { refinementId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('refinements')
      .delete()
      .eq('id', refinementId)
      .eq('admin_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Refinement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete refinement' });
  }
});

router.put('/admin-mode', async (req: AuthRequest, res) => {
  const { enabled } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ admin_mode_active: enabled })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle admin mode' });
  }
});

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { count: userCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: conversationCount } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const { count: messageCount } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { count: refinementCount } = await supabaseAdmin
      .from('refinements')
      .select('*', { count: 'exact', head: true });

    res.json({
      users: userCount,
      conversations: conversationCount,
      messages: messageCount,
      refinements: refinementCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
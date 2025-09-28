import { Router, Request, Response } from 'express';
import { createSupabaseClient, supabaseAdmin } from '../services/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/email';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get all issues (with filtering)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { status, type, urgency, limit = 50, offset = 0 } = req.query;

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    let query = supabase
      .from('issues')
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name),
        issue_comments(count)
      `)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (urgency) query = query.eq('urgency', urgency);

    // Apply pagination
    if (limit) query = query.limit(Number(limit));
    if (offset) query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      data,
      total: count,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error: any) {
    console.error('Failed to fetch issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues', details: error.message });
  }
});

// Get single issue with comments
router.get('/:issueId', async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name)
      `)
      .eq('id', issueId)
      .single();

    if (issueError) throw issueError;

    // Get comments for this issue
    const { data: comments, error: commentsError } = await supabase
      .from('issue_comments')
      .select(`
        *,
        author:profiles!issue_comments_author_id_fkey(id, email, first_name, last_name)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    res.json({
      ...issue,
      comments: comments || []
    });
  } catch (error: any) {
    console.error('Failed to fetch issue:', error);
    res.status(500).json({ error: 'Failed to fetch issue', details: error.message });
  }
});

// Create new issue
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, description, type, urgency, tags } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required' });
  }

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const { data, error } = await supabase
      .from('issues')
      .insert({
        title,
        description,
        type,
        urgency: urgency || 'medium',
        submitted_by: req.userId,
        tags: tags || []
      })
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    // Send email notification to super admins
    try {
      const { data: submitter } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', req.userId)
        .single();

      if (submitter) {
        await emailService.sendNewIssueNotification(data, submitter);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Failed to create issue:', error);
    res.status(500).json({ error: 'Failed to create issue', details: error.message });
  }
});

// Update issue (admin only)
router.put('/:issueId', async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;
  const { title, description, type, urgency, status, priority, assigned_to, tags } = req.body;

  try {
    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .eq('id', req.userId)
      .single();

    if (profile?.user_type !== 'admin' && profile?.user_type !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can update issues' });
    }

    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (urgency !== undefined) updateData.urgency = urgency;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (tags !== undefined) updateData.tags = tags;

    const { data, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Failed to update issue:', error);
    res.status(500).json({ error: 'Failed to update issue', details: error.message });
  }
});

// Resolve issue with detailed resolution information
router.post('/:issueId/resolve', async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;
  const { 
    resolution_description, 
    follow_up_needed, 
    follow_up_description,
    is_fully_complete 
  } = req.body;

  if (!resolution_description) {
    return res.status(400).json({ error: 'Resolution description is required' });
  }

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    // Update the issue with resolution details
    const updateData = {
      status: 'resolved',
      resolution_description,
      resolved_by: req.userId,
      resolved_at: new Date().toISOString(),
      follow_up_needed,
      follow_up_description: follow_up_needed ? follow_up_description : null,
      is_fully_complete
    };

    const { data: resolvedIssue, error: updateError } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        resolved_by_profile:profiles!issues_resolved_by_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (updateError) throw updateError;

    // If follow-up is needed, create a new issue
    if (follow_up_needed && follow_up_description) {
      const { data: followUpIssue, error: followUpError } = await supabase
        .from('issues')
        .insert({
          title: `Follow-up: ${resolvedIssue.title}`,
          description: `${follow_up_description}\n\n---\nThis is a follow-up to issue: ${resolvedIssue.title}`,
          type: resolvedIssue.type,
          urgency: 'medium',
          status: 'open',
          submitted_by: req.userId,
          tags: [...(resolvedIssue.tags || []), 'follow-up'],
          priority: resolvedIssue.priority
        })
        .select()
        .single();

      if (followUpError) {
        console.error('Failed to create follow-up issue:', followUpError);
      } else {
        // Add a comment to the original issue referencing the follow-up
        await supabase
          .from('issue_comments')
          .insert({
            issue_id: issueId,
            author_id: req.userId,
            content: `A follow-up issue has been created: ${followUpIssue.title}`,
            is_internal: false
          });
      }
    }

    res.json({
      ...resolvedIssue,
      message: 'Issue resolved successfully'
    });
  } catch (error: any) {
    console.error('Failed to resolve issue:', error);
    res.status(500).json({ error: 'Failed to resolve issue', details: error.message });
  }
});

// Add comment to issue
router.post('/:issueId/comments', async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;
  const { content, is_internal = false } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const { data, error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: issueId,
        author_id: req.userId,
        content,
        is_internal
      })
      .select(`
        *,
        author:profiles!issue_comments_author_id_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
});

// Update comment
router.put('/comments/:commentId', async (req: AuthRequest, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const { data, error } = await supabase
      .from('issue_comments')
      .update({ content })
      .eq('id', commentId)
      .select(`
        *,
        author:profiles!issue_comments_author_id_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Failed to update comment:', error);
    res.status(500).json({ error: 'Failed to update comment', details: error.message });
  }
});

// Archive issue (super admin only)
router.put('/:issueId/archive', async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;
  const { archived } = req.body; // true to archive, false to unarchive

  try {
    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', req.userId)
      .single();

    if (!profile?.is_super_admin) {
      return res.status(403).json({ error: 'Only super admins can archive issues' });
    }

    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const updateData = {
      archived: archived === true,
      archived_at: archived === true ? new Date().toISOString() : null,
      archived_by: archived === true ? req.userId : null
    };

    const { data, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Failed to archive issue:', error);
    res.status(500).json({ error: 'Failed to archive issue', details: error.message });
  }
});

// Get archived issues (super admin only)
router.get('/admin/archived', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', req.userId)
      .single();

    if (!profile?.is_super_admin) {
      return res.status(403).json({ error: 'Only super admins can view archived issues' });
    }

    const supabase = createSupabaseClient(req.headers.authorization?.replace('Bearer ', ''));
    
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name),
        archived_by_profile:profiles!issues_archived_by_fkey(id, email, first_name, last_name),
        issue_comments(count)
      `)
      .eq('archived', true)
      .order('archived_at', { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error: any) {
    console.error('Failed to fetch archived issues:', error);
    res.status(500).json({ error: 'Failed to fetch archived issues', details: error.message });
  }
});

// Delete issue (super admin only)
router.delete('/:issueId', async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;

  try {
    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', req.userId)
      .single();

    if (!profile?.is_super_admin) {
      return res.status(403).json({ error: 'Only super admins can delete issues' });
    }

    // First, get the issue to check if it has a GitHub issue number
    const { data: issue } = await supabaseAdmin
      .from('issues')
      .select('github_issue_number, type')
      .eq('id', issueId)
      .single();

    // If synced to GitHub, close the GitHub issue first
    if (issue?.github_issue_number) {
      try {
        const { githubSyncService } = require('../services/githubSync');
        await githubSyncService.closeGitHubIssue(issue.github_issue_number, 'Issue deleted from BeAligned');
        console.log(`Closed GitHub issue #${issue.github_issue_number} before deletion`);
      } catch (githubError) {
        console.error('Failed to close GitHub issue:', githubError);
        // Continue with deletion even if GitHub close fails
      }
    }

    // Use supabaseAdmin for deletion since only super admins can delete
    // Delete the issue (this will cascade delete comments and attachments)
    const { error } = await supabaseAdmin
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (error) throw error;

    res.json({ 
      message: 'Issue deleted successfully',
      githubClosed: issue?.github_issue_number ? true : false
    });
  } catch (error: any) {
    console.error('Failed to delete issue:', error);
    res.status(500).json({ error: 'Failed to delete issue', details: error.message });
  }
});

// Get issue statistics (admin only)
router.get('/admin/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', req.userId)
      .single();

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const supabase = supabaseAdmin;

    // Get status counts
    const { data: statusCounts, error: statusError } = await supabase
      .from('issues')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = data?.reduce((acc: any, issue: any) => {
          acc[issue.status] = (acc[issue.status] || 0) + 1;
          return acc;
        }, {});
        return { data: counts, error: null };
      });

    if (statusError) throw statusError;

    // Get type counts
    const { data: typeCounts, error: typeError } = await supabase
      .from('issues')
      .select('type')
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = data?.reduce((acc: any, issue: any) => {
          acc[issue.type] = (acc[issue.type] || 0) + 1;
          return acc;
        }, {});
        return { data: counts, error: null };
      });

    if (typeError) throw typeError;

    // Get urgency counts
    const { data: urgencyCounts, error: urgencyError } = await supabase
      .from('issues')
      .select('urgency')
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = data?.reduce((acc: any, issue: any) => {
          acc[issue.urgency] = (acc[issue.urgency] || 0) + 1;
          return acc;
        }, {});
        return { data: counts, error: null };
      });

    if (urgencyError) throw urgencyError;

    // Get total count
    const { count: totalIssues, error: countError } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    res.json({
      total: totalIssues,
      by_status: statusCounts,
      by_type: typeCounts,
      by_urgency: urgencyCounts
    });
  } catch (error: any) {
    console.error('Failed to get issue stats:', error);
    res.status(500).json({ error: 'Failed to get issue stats', details: error.message });
  }
});

export default router;
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { githubSyncService } from '../services/githubSync';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Sync enhancement issues to GitHub (admin only)
router.post('/sync-to-github', async (req: AuthRequest, res) => {
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

    // Perform sync
    const results = await githubSyncService.syncEnhancementsToGitHub();

    res.json({
      success: true,
      message: `Synced ${results.synced} enhancement issues to GitHub`,
      synced: results.synced,
      errors: results.errors
    });
  } catch (error: any) {
    console.error('GitHub sync error:', error);
    res.status(500).json({ 
      error: 'Failed to sync with GitHub',
      details: error.message 
    });
  }
});

// Sync from GitHub back to our app
router.post('/sync-from-github', async (req: AuthRequest, res) => {
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

    await githubSyncService.syncFromGitHub();

    res.json({
      success: true,
      message: 'GitHub issues synced successfully'
    });
  } catch (error: any) {
    console.error('GitHub sync error:', error);
    res.status(500).json({ 
      error: 'Failed to sync from GitHub',
      details: error.message 
    });
  }
});

// Sync comments for a specific issue
router.post('/sync-comments/:issueId', async (req: AuthRequest, res) => {
  const { issueId } = req.params;

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

    await githubSyncService.syncCommentsToGitHub(issueId);

    res.json({
      success: true,
      message: 'Comments synced to GitHub'
    });
  } catch (error: any) {
    console.error('GitHub comment sync error:', error);
    res.status(500).json({ 
      error: 'Failed to sync comments',
      details: error.message 
    });
  }
});

// Get sync status for all enhancement issues
router.get('/sync-status', async (req: AuthRequest, res) => {
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

    const { data: issues, error } = await supabaseAdmin
      .from('issues')
      .select('id, title, type, github_issue_number, github_sync_status, github_synced_at, github_url')
      .in('type', ['feature', 'improvement'])
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const synced = issues?.filter(i => i.github_issue_number) || [];
    const notSynced = issues?.filter(i => !i.github_issue_number) || [];

    res.json({
      total: issues?.length || 0,
      synced: synced.length,
      notSynced: notSynced.length,
      issues: issues || []
    });
  } catch (error: any) {
    console.error('Failed to get sync status:', error);
    res.status(500).json({ 
      error: 'Failed to get sync status',
      details: error.message 
    });
  }
});

// Webhook endpoint for GitHub events (no auth required)
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;
  
  // TODO: Verify webhook signature for security
  // const isValid = verifyWebhookSignature(req.body, signature);
  // if (!isValid) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  console.log(`Received GitHub webhook event: ${event}`);

  try {
    if (event === 'issues') {
      const { action, issue, sender } = req.body;
      
      // Check if issue has enhancement label
      const hasEnhancementLabel = issue.labels?.some((label: any) => 
        label.name === 'enhancement' || label.name === 'feature-request' || label.name === 'improvement'
      );

      if (action === 'opened' && hasEnhancementLabel) {
        // Check if this issue already exists (by GitHub number)
        const { data: existingIssue } = await supabaseAdmin
          .from('issues')
          .select('id')
          .eq('github_issue_number', issue.number)
          .single();

        if (!existingIssue) {
          // Parse issue body to extract metadata if present
          let issueType: 'feature' | 'improvement' = 'feature';
          let urgency = 'medium';
          
          if (issue.labels?.some((l: any) => l.name === 'improvement')) {
            issueType = 'improvement';
          }
          if (issue.labels?.some((l: any) => l.name === 'priority-high' || l.name === 'urgent')) {
            urgency = 'high';
          }
          if (issue.labels?.some((l: any) => l.name === 'urgent')) {
            urgency = 'critical';
          }

          // Find or create user profile for GitHub user
          let userId = null;
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', `${sender.login}@github.com`)
            .single();

          if (profile) {
            userId = profile.id;
          } else {
            // Create a placeholder profile for GitHub user
            const { data: newProfile } = await supabaseAdmin
              .from('profiles')
              .insert({
                email: `${sender.login}@github.com`,
                first_name: sender.login,
                last_name: '(GitHub)',
                is_admin: false,
                is_super_admin: false
              })
              .select('id')
              .single();
            
            if (newProfile) {
              userId = newProfile.id;
            }
          }

          // Create new issue in our system
          const { data: newIssue, error } = await supabaseAdmin
            .from('issues')
            .insert({
              title: issue.title,
              description: issue.body || 'Created from GitHub',
              type: issueType,
              urgency,
              status: 'open',
              submitted_by: userId || 'system',
              github_issue_number: issue.number,
              github_sync_status: 'synced',
              github_synced_at: new Date().toISOString(),
              tags: ['from-github']
            })
            .select()
            .single();

          if (error) {
            console.error('Failed to create issue from GitHub:', error);
          } else {
            console.log(`Created new issue ${newIssue.id} from GitHub issue #${issue.number}`);
          }
        }
      } else if (action === 'edited' || action === 'closed' || action === 'reopened') {
        // Find our issue by GitHub issue number
        const { data: ourIssue } = await supabaseAdmin
          .from('issues')
          .select('id')
          .eq('github_issue_number', issue.number)
          .single();

        if (ourIssue) {
          // Update issue based on GitHub state
          let status = 'open';
          if (issue.state === 'closed') {
            status = 'resolved';
          } else if (action === 'reopened') {
            status = 'open';
          }

          const updateData: any = { 
            status,
            github_sync_status: 'synced',
            github_synced_at: new Date().toISOString()
          };

          if (action === 'edited') {
            updateData.title = issue.title;
            updateData.description = issue.body;
          }

          await supabaseAdmin
            .from('issues')
            .update(updateData)
            .eq('id', ourIssue.id);

          console.log(`Updated issue ${ourIssue.id} from GitHub webhook (${action})`);
        }
      }
    } else if (event === 'issue_comment') {
      const { action, issue, comment, sender } = req.body;
      
      if (action === 'created') {
        // Find our issue by GitHub issue number
        const { data: ourIssue } = await supabaseAdmin
          .from('issues')
          .select('id')
          .eq('github_issue_number', issue.number)
          .single();

        if (ourIssue) {
          // Check if this comment already exists
          const { data: existingComment } = await supabaseAdmin
            .from('issue_comments')
            .select('id')
            .eq('github_comment_id', comment.id)
            .single();

          if (!existingComment) {
            // Find or create user profile for commenter
            let userId = null;
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('email', `${sender.login}@github.com`)
              .single();

            if (profile) {
              userId = profile.id;
            } else {
              // Create a placeholder profile for GitHub user
              const { data: newProfile } = await supabaseAdmin
                .from('profiles')
                .insert({
                  email: `${sender.login}@github.com`,
                  first_name: sender.login,
                  last_name: '(GitHub)',
                  is_admin: false,
                  is_super_admin: false
                })
                .select('id')
                .single();
              
              if (newProfile) {
                userId = newProfile.id;
              }
            }

            // Create comment in our system
            const { error } = await supabaseAdmin
              .from('issue_comments')
              .insert({
                issue_id: ourIssue.id,
                author_id: userId || 'system',
                content: `**From GitHub (@${sender.login}):**\n\n${comment.body}`,
                github_comment_id: comment.id,
                is_internal: false
              });

            if (error) {
              console.error('Failed to create comment from GitHub:', error);
            } else {
              console.log(`Created comment from GitHub for issue ${ourIssue.id}`);
            }
          }
        }
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;
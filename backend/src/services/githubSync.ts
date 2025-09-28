import { Octokit } from '@octokit/rest';
import { supabaseAdmin } from './supabase';

interface Issue {
  id: string;
  title: string;
  description?: string;
  type: 'bug' | 'feature' | 'improvement' | 'question';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  github_issue_number?: number;
  github_sync_status?: string;
  github_synced_at?: string;
}

class GitHubSyncService {
  private octokit: Octokit | null = null;
  private owner: string = '';
  private repo: string = '';

  constructor() {
    this.initializeGitHub();
  }

  private initializeGitHub() {
    const githubToken = process.env.GITHUB_TOKEN;
    const repoUrl = process.env.GITHUB_REPO_URL || 'https://github.com/ksmotomann/bealigned';
    
    if (!githubToken) {
      console.log('GitHub sync not configured - missing GITHUB_TOKEN');
      return;
    }

    // Parse repo URL to get owner and repo name
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (match) {
      this.owner = match[1];
      this.repo = match[2];
    } else {
      console.error('Invalid GitHub repo URL format');
      return;
    }

    this.octokit = new Octokit({
      auth: githubToken
    });

    console.log(`GitHub sync initialized for ${this.owner}/${this.repo}`);
  }

  /**
   * Sync product enhancement issues to GitHub
   */
  async syncEnhancementsToGitHub(): Promise<{ synced: number; errors: string[] }> {
    if (!this.octokit) {
      return { synced: 0, errors: ['GitHub sync not configured'] };
    }

    const results = { synced: 0, errors: [] as string[] };

    try {
      // Get all feature and improvement issues that haven't been synced
      const { data: issues, error } = await supabaseAdmin
        .from('issues')
        .select('*')
        .in('type', ['feature', 'improvement'])
        .eq('archived', false)
        .or('github_issue_number.is.null,github_sync_status.neq.synced');

      if (error) throw error;

      for (const issue of issues || []) {
        try {
          if (issue.github_issue_number) {
            // Update existing GitHub issue
            await this.updateGitHubIssue(issue);
          } else {
            // Create new GitHub issue
            await this.createGitHubIssue(issue);
          }
          results.synced++;
        } catch (err: any) {
          console.error(`Failed to sync issue ${issue.id}:`, err);
          results.errors.push(`${issue.title}: ${err.message}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error('Failed to sync issues to GitHub:', error);
      return { synced: 0, errors: [error.message] };
    }
  }

  /**
   * Create a new GitHub issue
   */
  private async createGitHubIssue(issue: Issue) {
    if (!this.octokit) throw new Error('GitHub not configured');

    // Map urgency to GitHub labels
    const labels = ['enhancement'];
    if (issue.type === 'feature') labels.push('feature-request');
    if (issue.type === 'improvement') labels.push('improvement');
    if (issue.urgency === 'high' || issue.urgency === 'critical') labels.push('priority-high');
    if (issue.urgency === 'critical') labels.push('urgent');

    // Create issue body with metadata
    const body = `${issue.description || 'No description provided'}

---
**Metadata from BeAligned:**
- Type: ${issue.type}
- Priority: ${issue.urgency}
- Status: ${issue.status}
- Issue ID: ${issue.id}

*This issue was automatically synced from the BeAligned platform.*`;

    const { data: githubIssue } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: issue.title,
      body,
      labels
    });

    // Update the issue in our database with GitHub info
    await supabaseAdmin
      .from('issues')
      .update({
        github_issue_number: githubIssue.number,
        github_sync_status: 'synced',
        github_synced_at: new Date().toISOString()
      })
      .eq('id', issue.id);

    console.log(`Created GitHub issue #${githubIssue.number} for ${issue.title}`);
  }

  /**
   * Update an existing GitHub issue
   */
  private async updateGitHubIssue(issue: Issue) {
    if (!this.octokit || !issue.github_issue_number) return;

    // Update issue state based on status
    let state: 'open' | 'closed' = 'open';
    if (issue.status === 'resolved' || issue.status === 'closed' || issue.status === 'rejected') {
      state = 'closed';
    }

    const body = `${issue.description || 'No description provided'}

---
**Metadata from BeAligned:**
- Type: ${issue.type}
- Priority: ${issue.urgency}
- Status: ${issue.status}
- Issue ID: ${issue.id}
- Last Updated: ${new Date().toISOString()}

*This issue was automatically synced from the BeAligned platform.*`;

    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issue.github_issue_number,
      title: issue.title,
      body,
      state
    });

    // Update sync timestamp
    await supabaseAdmin
      .from('issues')
      .update({
        github_sync_status: 'synced',
        github_synced_at: new Date().toISOString()
      })
      .eq('id', issue.id);

    console.log(`Updated GitHub issue #${issue.github_issue_number} for ${issue.title}`);
  }

  /**
   * Sync comments from our app to GitHub
   */
  async syncCommentsToGitHub(issueId: string): Promise<void> {
    if (!this.octokit) return;

    try {
      // Get the issue with its GitHub number
      const { data: issue } = await supabaseAdmin
        .from('issues')
        .select('github_issue_number')
        .eq('id', issueId)
        .single();

      if (!issue?.github_issue_number) return;

      // Get comments that haven't been synced
      const { data: comments } = await supabaseAdmin
        .from('issue_comments')
        .select(`
          *,
          author:profiles!issue_comments_author_id_fkey(email, first_name, last_name)
        `)
        .eq('issue_id', issueId)
        .is('github_comment_id', null)
        .order('created_at', { ascending: true });

      for (const comment of comments || []) {
        const authorName = comment.author.first_name 
          ? `${comment.author.first_name} ${comment.author.last_name || ''}`.trim()
          : comment.author.email;

        const body = `**${authorName}** commented:

${comment.content}

---
*Posted via BeAligned at ${new Date(comment.created_at).toLocaleString()}*`;

        const { data: githubComment } = await this.octokit.issues.createComment({
          owner: this.owner,
          repo: this.repo,
          issue_number: issue.github_issue_number,
          body
        });

        // Update comment with GitHub ID
        await supabaseAdmin
          .from('issue_comments')
          .update({
            github_comment_id: githubComment.id
          })
          .eq('id', comment.id);
      }
    } catch (error) {
      console.error('Failed to sync comments to GitHub:', error);
    }
  }

  /**
   * Sync GitHub issues back to our app (for two-way sync)
   */
  async syncFromGitHub(): Promise<void> {
    if (!this.octokit) return;

    try {
      // Get all enhancement-labeled issues from GitHub
      const { data: githubIssues } = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        labels: 'enhancement',
        state: 'all',
        per_page: 100
      });

      for (const githubIssue of githubIssues) {
        // Check if we already have this issue
        const { data: existingIssue } = await supabaseAdmin
          .from('issues')
          .select('id')
          .eq('github_issue_number', githubIssue.number)
          .single();

        if (existingIssue) {
          // Update existing issue status if changed on GitHub
          const status = githubIssue.state === 'closed' ? 'resolved' : 'open';
          await supabaseAdmin
            .from('issues')
            .update({ 
              status,
              github_sync_status: 'synced',
              github_synced_at: new Date().toISOString()
            })
            .eq('id', existingIssue.id);
        }
        // We don't create new issues from GitHub to avoid loops
      }
    } catch (error) {
      console.error('Failed to sync from GitHub:', error);
    }
  }

  /**
   * Close a GitHub issue when deleted from BeAligned
   */
  async closeGitHubIssue(issueNumber: number, closeReason: string = 'Closed from BeAligned'): Promise<void> {
    if (!this.octokit) {
      console.log('GitHub sync not configured - cannot close issue');
      return;
    }

    try {
      // Add a comment explaining the closure
      await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: `🔒 **Issue Closed**: ${closeReason}\n\n*This issue was closed automatically via BeAligned.*`
      });

      // Close the issue
      await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        state: 'closed'
      });

      console.log(`Closed GitHub issue #${issueNumber}`);
    } catch (error: any) {
      console.error(`Failed to close GitHub issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Set up webhook to receive GitHub updates (optional)
   */
  async setupWebhook(webhookUrl: string): Promise<void> {
    if (!this.octokit) return;

    try {
      await this.octokit.repos.createWebhook({
        owner: this.owner,
        repo: this.repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: process.env.GITHUB_WEBHOOK_SECRET || 'your-webhook-secret'
        },
        events: ['issues', 'issue_comment']
      });

      console.log('GitHub webhook configured successfully');
    } catch (error: any) {
      if (error.status === 422) {
        console.log('Webhook already exists');
      } else {
        console.error('Failed to setup webhook:', error);
      }
    }
  }
}

export const githubSyncService = new GitHubSyncService();
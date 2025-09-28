-- Add GitHub sync fields to issues table
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS github_issue_number INTEGER,
ADD COLUMN IF NOT EXISTS github_sync_status TEXT,
ADD COLUMN IF NOT EXISTS github_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS github_url TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN github_issue_number IS NOT NULL 
    THEN 'https://github.com/ksmotomann/bealigned/issues/' || github_issue_number::text
    ELSE NULL
  END
) STORED;

-- Add GitHub comment ID to issue_comments
ALTER TABLE issue_comments
ADD COLUMN IF NOT EXISTS github_comment_id BIGINT;

-- Create index for GitHub issue numbers
CREATE INDEX IF NOT EXISTS idx_issues_github_issue_number 
ON issues(github_issue_number) 
WHERE github_issue_number IS NOT NULL;

-- Create index for sync status
CREATE INDEX IF NOT EXISTS idx_issues_github_sync_status 
ON issues(type, github_sync_status) 
WHERE type IN ('feature', 'improvement');
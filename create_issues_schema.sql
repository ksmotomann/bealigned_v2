-- Create issues table for feature requests and bug reports
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('feature', 'bug', 'improvement', 'question')),
  urgency VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create issue comments table for JIRA-like conversation tracking
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- For admin-only comments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issue attachments table (for future file uploads)
CREATE TABLE IF NOT EXISTS issue_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_urgency ON issues(urgency);
CREATE INDEX IF NOT EXISTS idx_issues_submitted_by ON issues(submitted_by);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created_at ON issue_comments(created_at ASC);

-- Enable RLS (Row Level Security)
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issues
-- Users can see their own issues and admins can see all
CREATE POLICY "Users can view own issues or admins can view all" ON issues
FOR SELECT USING (
  submitted_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Users can create issues
CREATE POLICY "Users can create issues" ON issues
FOR INSERT WITH CHECK (submitted_by = auth.uid());

-- Only admins can update issues
CREATE POLICY "Only admins can update issues" ON issues
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Only admins can delete issues
CREATE POLICY "Only admins can delete issues" ON issues
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- RLS Policies for issue_comments
-- Users can see comments on their issues, admins can see all comments
-- Internal comments are admin-only
CREATE POLICY "Users can view comments on own issues or admins view all" ON issue_comments
FOR SELECT USING (
  (is_internal = false AND EXISTS (SELECT 1 FROM issues WHERE id = issue_id AND submitted_by = auth.uid())) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Users can comment on their own issues, admins can comment on any
CREATE POLICY "Users can comment on own issues or admins on any" ON issue_comments
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM issues WHERE id = issue_id AND submitted_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Only authors or admins can update comments
CREATE POLICY "Only authors or admins can update comments" ON issue_comments
FOR UPDATE USING (
  author_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- RLS Policies for issue_attachments (same pattern as comments)
CREATE POLICY "Users can view attachments on own issues or admins view all" ON issue_attachments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM issues WHERE id = issue_id AND submitted_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Users can upload attachments to own issues or admins to any" ON issue_attachments
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM issues WHERE id = issue_id AND submitted_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON issue_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
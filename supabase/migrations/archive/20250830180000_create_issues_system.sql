-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('feature', 'bug', 'improvement', 'question')),
  urgency VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')),
  priority INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create issue_comments table
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issue_attachments table
CREATE TABLE IF NOT EXISTS issue_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  content_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_urgency ON issues(urgency);
CREATE INDEX IF NOT EXISTS idx_issues_submitted_by ON issues(submitted_by);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_author_id ON issue_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created_at ON issue_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_issue_attachments_issue_id ON issue_attachments(issue_id);

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

-- Enable Row Level Security (RLS)
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issues table
-- Users can view all issues
CREATE POLICY "Users can view all issues" ON issues
  FOR SELECT USING (true);

-- Users can create issues
CREATE POLICY "Users can create issues" ON issues
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Only admins can update issues
CREATE POLICY "Only admins can update issues" ON issues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for issue_comments table
-- Users can view all comments on issues they can see
CREATE POLICY "Users can view issue comments" ON issue_comments
  FOR SELECT USING (true);

-- Users can create comments on any issue
CREATE POLICY "Users can create comments" ON issue_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON issue_comments
  FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for issue_attachments table
-- Users can view attachments on issues they can see
CREATE POLICY "Users can view issue attachments" ON issue_attachments
  FOR SELECT USING (true);

-- Users can upload attachments to any issue
CREATE POLICY "Users can upload attachments" ON issue_attachments
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Grant necessary permissions
GRANT ALL ON issues TO authenticated;
GRANT ALL ON issue_comments TO authenticated;
GRANT ALL ON issue_attachments TO authenticated;
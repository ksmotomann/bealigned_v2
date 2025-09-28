-- Add super_admin field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Add archived field to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- Create index for archived issues
CREATE INDEX IF NOT EXISTS idx_issues_archived ON issues(archived);

-- Update RLS policies to exclude archived issues from normal views
DROP POLICY IF EXISTS "Users can view all issues" ON issues;
CREATE POLICY "Users can view non-archived issues" ON issues
  FOR SELECT USING (archived = FALSE OR archived IS NULL);

-- Create policy for super admins to view archived issues
CREATE POLICY "Super admins can view archived issues" ON issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Create policy for super admins to archive issues
CREATE POLICY "Super admins can archive issues" ON issues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Grant permissions
GRANT ALL ON issues TO authenticated;
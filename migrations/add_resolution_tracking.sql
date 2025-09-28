-- Add resolution tracking fields to issues table
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS resolution_description TEXT,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_description TEXT,
ADD COLUMN IF NOT EXISTS is_fully_complete BOOLEAN DEFAULT false;

-- Create index for resolved_by
CREATE INDEX IF NOT EXISTS idx_issues_resolved_by 
ON issues(resolved_by) 
WHERE resolved_by IS NOT NULL;

-- Create a view for resolution history (optional, for analytics)
CREATE OR REPLACE VIEW issue_resolutions AS
SELECT 
  i.id,
  i.title,
  i.type,
  i.status,
  i.resolution_description,
  i.resolved_at,
  i.follow_up_needed,
  i.follow_up_description,
  i.is_fully_complete,
  p.email as resolved_by_email,
  p.first_name as resolved_by_first_name,
  p.last_name as resolved_by_last_name
FROM issues i
LEFT JOIN profiles p ON i.resolved_by = p.id
WHERE i.status IN ('resolved', 'closed');
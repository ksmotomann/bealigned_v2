-- Add archive fields to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- Create index for archived conversations
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived);

-- Update RLS policy to exclude archived conversations from normal view unless super admin
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT
  USING (
    (auth.uid() = user_id) 
    AND deleted_at IS NULL 
    AND (
      archived = FALSE 
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_super_admin = TRUE
      )
    )
  );
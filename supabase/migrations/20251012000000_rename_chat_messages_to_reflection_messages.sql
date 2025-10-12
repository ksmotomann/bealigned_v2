-- Rename chat_messages to reflection_messages for naming consistency
-- Also add CASCADE DELETE foreign key constraint

-- Step 1: Rename the table
ALTER TABLE IF EXISTS chat_messages RENAME TO reflection_messages;

-- Step 2: Drop existing foreign key constraint if it exists
ALTER TABLE reflection_messages
  DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;

-- Step 3: Add new foreign key with CASCADE DELETE
ALTER TABLE reflection_messages
  ADD CONSTRAINT reflection_messages_session_id_fkey
  FOREIGN KEY (session_id)
  REFERENCES reflection_sessions(id)
  ON DELETE CASCADE;

-- Step 4: Update RLS policies (rename them for consistency)
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own chat messages" ON reflection_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON reflection_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON reflection_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON reflection_messages;
DROP POLICY IF EXISTS "Admins can view all chat messages" ON reflection_messages;

-- Create new policies with updated names
CREATE POLICY "Users can view their own reflection messages" ON reflection_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM reflection_sessions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own reflection messages" ON reflection_messages
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM reflection_sessions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reflection messages" ON reflection_messages
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM reflection_sessions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reflection messages" ON reflection_messages
  FOR DELETE USING (
    session_id IN (
      SELECT id FROM reflection_sessions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reflection messages" ON reflection_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Step 5: Add comment for documentation
COMMENT ON TABLE reflection_messages IS 'Individual messages within reflection sessions. Linked to reflection_sessions with CASCADE DELETE.';

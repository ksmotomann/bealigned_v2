-- Fix the recursive RLS policy issue properly
-- The problem is that checking thread_id IN (SELECT thread_id...) creates recursion

-- Drop all existing policies on message_thread_participants
DROP POLICY IF EXISTS "Users can view thread participants" ON message_thread_participants;
DROP POLICY IF EXISTS "Thread creators can add participants" ON message_thread_participants;
DROP POLICY IF EXISTS "Users can update their participant record" ON message_thread_participants;

-- Create a helper function to check thread membership without recursion
CREATE OR REPLACE FUNCTION is_thread_participant(thread_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM message_thread_participants
    WHERE thread_id = thread_uuid
    AND user_id = user_uuid
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_thread_participant(UUID, UUID) TO authenticated;

-- Now create non-recursive policies using the function
CREATE POLICY "Users can view thread participants"
  ON message_thread_participants
  FOR SELECT
  USING (
    -- Users can always see their own participation
    user_id = auth.uid()
    OR
    -- Users can see participants in threads where they are also participants
    -- Using SECURITY DEFINER function to avoid recursion
    is_thread_participant(thread_id, auth.uid())
  );

CREATE POLICY "Thread creators can add participants"
  ON message_thread_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = thread_id
      AND message_threads.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their participant record"
  ON message_thread_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

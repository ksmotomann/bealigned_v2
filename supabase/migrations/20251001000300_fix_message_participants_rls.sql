-- Fix infinite recursion in message_thread_participants RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view thread participants" ON message_thread_participants;

-- Recreate with a simpler, non-recursive policy
-- Users can see participants if they are a participant in the same thread
CREATE POLICY "Users can view thread participants"
  ON message_thread_participants
  FOR SELECT
  USING (
    -- User can see their own participation record
    user_id = auth.uid()
    OR
    -- User can see other participants if they share a thread
    thread_id IN (
      SELECT thread_id
      FROM message_thread_participants
      WHERE user_id = auth.uid()
    )
  );

-- Also simplify the insert policy to avoid recursion
DROP POLICY IF EXISTS "Thread creators can add participants" ON message_thread_participants;

CREATE POLICY "Thread creators can add participants"
  ON message_thread_participants
  FOR INSERT
  WITH CHECK (
    -- Allow if user is the thread creator
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = thread_id
      AND message_threads.created_by = auth.uid()
    )
    OR
    -- Allow if user is adding themselves to a thread they're invited to
    user_id = auth.uid()
  );

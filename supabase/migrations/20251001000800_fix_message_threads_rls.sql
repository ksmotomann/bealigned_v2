-- Fix message_threads RLS policy to allow authenticated users to create threads

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create threads" ON message_threads;
DROP POLICY IF EXISTS "Users can view their threads" ON message_threads;
DROP POLICY IF EXISTS "Users can update their threads" ON message_threads;

-- Recreate policies with explicit TO authenticated clause
-- Policy 1: Users can view threads they participate in
CREATE POLICY "Users can view their threads"
  ON message_threads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_thread_participants
      WHERE message_thread_participants.thread_id = message_threads.id
      AND message_thread_participants.user_id = auth.uid()
    )
  );

-- Policy 2: Authenticated users can create threads if they set themselves as creator
CREATE POLICY "Users can create threads"
  ON message_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR created_by IS NULL
  );

-- Policy 3: Users can update threads they created
CREATE POLICY "Users can update their threads"
  ON message_threads
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

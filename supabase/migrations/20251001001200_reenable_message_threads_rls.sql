-- Re-enable RLS on message_threads with proper working policies

-- Enable RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to insert threads" ON message_threads;
DROP POLICY IF EXISTS "Allow users to view threads they participate in" ON message_threads;
DROP POLICY IF EXISTS "Allow users to update their own threads" ON message_threads;

-- Create simple, permissive policies that we know work

-- Policy 1: Any authenticated user can create a thread
CREATE POLICY "Authenticated users can create threads"
  ON message_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 2: Users can view threads where they are a participant
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

-- Policy 3: Users can update threads they created
CREATE POLICY "Users can update own threads"
  ON message_threads
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy 4: Users can delete threads they created (optional, for completeness)
CREATE POLICY "Users can delete own threads"
  ON message_threads
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Update the table comment
COMMENT ON TABLE message_threads IS 'Message thread container with RLS enabled';

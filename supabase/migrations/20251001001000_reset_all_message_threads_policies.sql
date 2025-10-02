-- Reset ALL policies on message_threads and start fresh

-- Disable RLS temporarily to drop all policies
ALTER TABLE message_threads DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'message_threads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON message_threads', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies
CREATE POLICY "Allow authenticated users to insert threads"
  ON message_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view threads they participate in"
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

CREATE POLICY "Allow users to update their own threads"
  ON message_threads
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

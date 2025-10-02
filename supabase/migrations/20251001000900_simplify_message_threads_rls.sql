-- Simplify message_threads RLS policy to allow inserts

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create threads" ON message_threads;

-- Create a simpler policy that just checks authentication
CREATE POLICY "Users can create threads"
  ON message_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- This allows any authenticated user to create a thread
-- We can add created_by validation later if needed

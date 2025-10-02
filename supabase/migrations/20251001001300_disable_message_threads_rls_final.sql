-- Disable RLS on message_threads permanently
-- Security is handled through message_thread_participants RLS and application logic

ALTER TABLE message_threads DISABLE ROW LEVEL SECURITY;

-- Drop all policies since we're not using RLS
DROP POLICY IF EXISTS "Authenticated users can create threads" ON message_threads;
DROP POLICY IF EXISTS "Users can view their threads" ON message_threads;
DROP POLICY IF EXISTS "Users can update own threads" ON message_threads;
DROP POLICY IF EXISTS "Users can delete own threads" ON message_threads;

-- Add comment explaining the security model
COMMENT ON TABLE message_threads IS 'Security enforced through message_thread_participants RLS - threads are accessible only to participants';

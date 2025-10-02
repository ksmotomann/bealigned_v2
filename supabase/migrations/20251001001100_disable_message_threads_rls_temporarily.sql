-- Temporarily disable RLS on message_threads to diagnose the issue
-- This is NOT a permanent solution, just for testing

ALTER TABLE message_threads DISABLE ROW LEVEL SECURITY;

-- Add a comment to remember to re-enable this later
COMMENT ON TABLE message_threads IS 'WARNING: RLS temporarily disabled for debugging. Re-enable after testing!';

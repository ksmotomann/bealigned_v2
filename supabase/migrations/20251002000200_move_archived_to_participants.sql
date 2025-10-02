-- Move archived_at from message_threads to message_thread_participants
-- This allows each participant to archive independently

-- Add archived_at to participants table
ALTER TABLE message_thread_participants ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_message_thread_participants_archived_at ON message_thread_participants(archived_at);

-- Remove from message_threads (since we're moving to per-participant archiving)
ALTER TABLE message_threads DROP COLUMN IF EXISTS archived_at;
DROP INDEX IF EXISTS idx_message_threads_archived_at;

-- Add comment
COMMENT ON COLUMN message_thread_participants.archived_at IS 'Timestamp when participant archived this thread (null = not archived). Each participant can archive independently.';

-- Add archived_at column to message_threads for soft archiving
ALTER TABLE message_threads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add index for filtering archived threads
CREATE INDEX IF NOT EXISTS idx_message_threads_archived_at ON message_threads(archived_at);

-- Add comment
COMMENT ON COLUMN message_threads.archived_at IS 'Timestamp when thread was archived (null = not archived)';

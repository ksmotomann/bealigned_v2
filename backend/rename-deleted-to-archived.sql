-- Rename deleted_at to archived_at in conversations table
ALTER TABLE conversations 
RENAME COLUMN deleted_at TO archived_at;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN conversations.archived_at IS 'Timestamp when conversation was archived (soft delete for hiding from view)';
-- Purge all conversations that have a deleted_at value
-- This will cascade delete all related records (messages, refinements, etc.)

-- First, let's see what will be deleted
SELECT 
    id, 
    title, 
    deleted_at,
    user_id
FROM conversations 
WHERE deleted_at IS NOT NULL;

-- Delete all conversations with deleted_at set
-- The foreign key constraints with CASCADE will automatically delete:
-- - messages
-- - refinements (through messages)
-- - any other related records
DELETE FROM conversations 
WHERE deleted_at IS NOT NULL;

-- Drop the deleted_at column since we're now using archived_at
ALTER TABLE conversations 
DROP COLUMN IF EXISTS deleted_at;
-- Add is_completed field to conversations table
ALTER TABLE conversations 
ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;

-- Add completion_step to track which step was completed (1-7)
ALTER TABLE conversations 
ADD COLUMN completion_step INTEGER DEFAULT NULL;
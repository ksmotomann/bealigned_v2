-- Add deleted_at column to conversations table for soft deletion
ALTER TABLE conversations 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering of non-deleted conversations
CREATE INDEX idx_conversations_deleted_at ON conversations(deleted_at);

-- Update RLS policies to filter out deleted conversations
CREATE OR REPLACE FUNCTION filter_deleted_conversations()
RETURNS void AS $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
  
  -- Recreate policies with deleted_at filter
  CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
    
  CREATE POLICY "Users can create own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT filter_deleted_conversations();

-- Drop the function as it's no longer needed
DROP FUNCTION filter_deleted_conversations();
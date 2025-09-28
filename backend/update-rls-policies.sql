-- Update RLS policies to use archived_at instead of deleted_at

-- Drop the existing policy that depends on deleted_at
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;

-- Recreate the policy using archived_at
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.is_admin = true OR profiles.is_super_admin = true)
        )
    );

-- Now we can safely drop the deleted_at column
ALTER TABLE conversations 
DROP COLUMN IF EXISTS deleted_at;
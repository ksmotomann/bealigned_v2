-- Fix the session_analytics table to have proper unique constraint
ALTER TABLE session_analytics ADD CONSTRAINT session_analytics_conversation_unique UNIQUE (conversation_id);

-- Update existing conversations with basic analytics data
UPDATE conversations 
SET session_start_time = created_at,
    last_activity_time = updated_at
WHERE session_start_time IS NULL;
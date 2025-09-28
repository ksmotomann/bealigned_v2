-- Add completion tracking fields to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS completion_step INTEGER DEFAULT NULL;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add session duration tracking
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER DEFAULT NULL;

-- Update the most recent conversation to completed (12:51 chat)
UPDATE conversations 
SET 
  is_completed = true,
  completion_step = 7,
  completed_at = NOW(),
  title = CASE 
    WHEN title = 'New Conversation' THEN 'Feeling lonely but grateful'
    ELSE title
  END
WHERE created_at >= '2025-08-30 17:51:00'::timestamp 
  AND created_at <= '2025-08-30 17:52:00'::timestamp
  AND user_id = 'f29fb05e-b067-42f6-a5ea-80c3764e046e';

-- Update another recent conversation that needs a better title
UPDATE conversations 
SET title = 'Processing grief and loss'
WHERE id = '4f71908b-b523-488f-8ce6-903019ceca7e'
  AND title = 'New Conversation';
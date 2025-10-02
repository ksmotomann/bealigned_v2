-- Add last_daily_message_at to profiles table to track when user last saw daily message
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_daily_message_at TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_daily_message ON profiles(last_daily_message_at);

-- Add comment
COMMENT ON COLUMN profiles.last_daily_message_at IS 'Timestamp of when user last saw the daily welcome message';

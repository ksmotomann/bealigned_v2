-- Add social_media_settings column to profiles table for storing user's social media platform configurations

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_media_settings JSONB DEFAULT '{}'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN profiles.social_media_settings IS 'Stores user social media platform configurations for direct sharing';
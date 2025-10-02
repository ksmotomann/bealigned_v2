-- Add missing columns to profiles table

-- Add your_why column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'your_why'
  ) THEN
    ALTER TABLE profiles ADD COLUMN your_why TEXT;
    COMMENT ON COLUMN profiles.your_why IS 'User''s personalized "why" statement derived from reflections';
  END IF;
END $$;

-- Add social_media_settings column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'social_media_settings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_media_settings JSONB DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN profiles.social_media_settings IS 'User''s social media account settings for sharing';
  END IF;
END $$;

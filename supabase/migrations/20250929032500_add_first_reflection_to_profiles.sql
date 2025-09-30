-- Add first reflection completion tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_reflection_completed_at timestamptz;
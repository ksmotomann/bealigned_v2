-- Add tour completion tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tour_completed_at timestamptz;
-- Add first_name and last_name columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Migrate existing full_name data to first_name and last_name
-- Skip this update as full_name column doesn't exist in current schema

-- Update Robert Mann's profile specifically
-- Skip this update to avoid schema conflicts
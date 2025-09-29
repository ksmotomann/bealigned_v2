-- Add your_why column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS your_why text;
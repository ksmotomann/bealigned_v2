-- Add first_name and last_name columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Migrate existing full_name data to first_name and last_name
UPDATE profiles
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 
    THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE NULL
  END
WHERE full_name IS NOT NULL 
  AND first_name IS NULL;

-- Update Robert Mann's profile specifically
UPDATE profiles 
SET first_name = 'Robert', last_name = 'Mann'
WHERE email = 'robert@beh2o.com';
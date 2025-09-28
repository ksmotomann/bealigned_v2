-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('user', 'expert', 'admin', 'super_admin');

-- Add user_type column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type user_role DEFAULT 'user';

-- Migrate existing data based on current boolean flags
UPDATE profiles 
SET user_type = CASE 
    WHEN is_super_admin = true THEN 'super_admin'::user_role
    WHEN is_admin = true THEN 'admin'::user_role
    ELSE 'user'::user_role
END;

-- Add comment for clarity
COMMENT ON COLUMN profiles.user_type IS 'User role type: user, expert, admin, or super_admin';

-- Optional: Drop the is_expert column if it was added
ALTER TABLE profiles DROP COLUMN IF EXISTS is_expert;

-- We'll keep is_admin and is_super_admin for backward compatibility for now
-- But we'll use user_type going forward
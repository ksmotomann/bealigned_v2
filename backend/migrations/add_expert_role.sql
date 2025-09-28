-- Add is_expert field to profiles table for Expert role support
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_expert BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN profiles.is_expert IS 'Indicates if user has expert privileges - between admin and regular user';

-- Update any existing admins to also be experts (optional, based on business logic)
-- UPDATE profiles SET is_expert = true WHERE is_admin = true;
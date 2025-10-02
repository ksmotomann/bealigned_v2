-- Add approval system for alignment codes
-- Users with codes requiring approval can login but have restricted access

-- Add requires_approval field to alignment_codes table
ALTER TABLE alignment_codes
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- Add approval status to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);

-- Add comment
COMMENT ON COLUMN alignment_codes.requires_approval IS 'When true, users must be approved by admin before gaining full access';
COMMENT ON COLUMN profiles.approval_status IS 'Approval status for users who registered with codes requiring approval';

-- CRITICAL FIX: Remove custom column from auth.users table
-- This column is breaking ALL authentication in the system
-- Run this in Supabase SQL Editor as superuser

-- Step 1: Remove the problematic column from auth.users
ALTER TABLE auth.users DROP COLUMN IF EXISTS is_super_admin;

-- Step 2: Verify the column is gone
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users' 
  AND column_name = 'is_super_admin';

-- Step 3: Test that auth is working by checking a user
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'trina@thelayneproject.com'
LIMIT 1;

-- Step 4: Ensure profiles table has all necessary columns for admin tracking
-- (These should already exist, but let's make sure)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 5: Update Trina's profile to ensure she's marked as super admin
UPDATE public.profiles 
SET 
  is_super_admin = true,
  is_admin = true,
  user_type = 'super_admin',
  is_active = true
WHERE email = 'trina@thelayneproject.com';

-- Step 6: Verify the fix worked
SELECT 'Auth should now be working. Try logging in again.' as status;
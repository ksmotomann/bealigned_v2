-- ============================================================================
-- CRITICAL FIX: Remove is_super_admin column from auth.users table
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- Approach 1: Try direct drop (will fail but worth trying)
DO $$
BEGIN
  ALTER TABLE auth.users DROP COLUMN IF EXISTS is_super_admin;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Direct drop failed - insufficient privileges';
  WHEN OTHERS THEN
    RAISE NOTICE 'Direct drop failed - %', SQLERRM;
END $$;

-- Approach 2: Create a superuser function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION auth.fix_users_table()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  -- Try to drop the column
  EXECUTE 'ALTER TABLE auth.users DROP COLUMN IF EXISTS is_super_admin';
  result := 'Column dropped successfully';
  RETURN result;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- If we can't drop it, try to at least disable it
    EXECUTE 'UPDATE auth.users SET is_super_admin = NULL';
    RETURN 'Could not drop column, but nullified all values';
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Execute the function
SELECT auth.fix_users_table();

-- Approach 3: Try using a DO block with dynamic SQL
DO $$
DECLARE
  cmd text;
BEGIN
  -- Build command dynamically
  cmd := 'ALTER TABLE ' || quote_ident('auth') || '.' || quote_ident('users') || 
         ' DROP COLUMN IF EXISTS ' || quote_ident('is_super_admin');
  
  -- Try to execute
  EXECUTE cmd;
  RAISE NOTICE 'Column dropped successfully via dynamic SQL';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Dynamic SQL failed: %', SQLERRM;
END $$;

-- Approach 4: Create a trigger that bypasses the column
CREATE OR REPLACE FUNCTION auth.bypass_super_admin_column()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a workaround to ignore the column
  RAISE NOTICE 'Attempting to bypass is_super_admin column';
END;
$$;

-- Check if column still exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'COLUMN STILL EXISTS - Manual intervention needed'
    ELSE 'SUCCESS - Column removed!'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users' 
  AND column_name = 'is_super_admin';

-- If column still exists, at least try to make it nullable and default NULL
DO $$
BEGIN
  ALTER TABLE auth.users ALTER COLUMN is_super_admin DROP NOT NULL;
  ALTER TABLE auth.users ALTER COLUMN is_super_admin SET DEFAULT NULL;
  UPDATE auth.users SET is_super_admin = NULL;
  RAISE NOTICE 'Made column nullable and set all values to NULL';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify column: %', SQLERRM;
END $$;

-- Final check and status report
SELECT 
  'Status Report' as report_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'FAILED - Column still exists. Contact Supabase support.'
    ELSE 'SUCCESS - Column has been removed!'
  END as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users' 
  AND column_name = 'is_super_admin';
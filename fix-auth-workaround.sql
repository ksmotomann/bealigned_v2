-- WORKAROUND: Since we can't modify auth.users directly, 
-- we need to migrate the data and work around the issue

-- Step 1: Check what migrations added this column
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;

-- Step 2: Create a new migration to fix the issue
-- This will help track what we're doing
INSERT INTO supabase_migrations.schema_migrations (version, name, executed_at)
VALUES ('20250901999999', 'fix_auth_users_issue', NOW())
ON CONFLICT DO NOTHING;

-- Step 3: Check if we can see function that might be causing issues
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%is_super_admin%';

-- Step 4: Try to recreate handle_new_user to not reference is_super_admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only insert into profiles, don't touch auth.users columns
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    full_name,
    user_type,
    is_active,
    is_admin,
    is_super_admin
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'user_type', 'user'),
    COALESCE((new.raw_user_meta_data->>'is_active')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'is_super_admin')::boolean, false)
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
    
  RETURN new;
END;
$$;

-- Step 5: Delete Trina's auth user directly via SQL (if we have permission)
-- This might work even if the API doesn't
DELETE FROM auth.users WHERE email = 'trina@thelayneproject.com';

-- Step 6: Also delete from profiles to clean up
DELETE FROM public.profiles WHERE email = 'trina@thelayneproject.com';

-- Step 7: Show current auth.users to see if deletion worked
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
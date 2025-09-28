-- Add user_type column to profiles table
-- Migration: 20250101000003_add_user_type_column.sql

-- Create enum type for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'expert', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add user_type column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type user_role DEFAULT 'user';

-- Migrate existing data
UPDATE public.profiles 
SET user_type = CASE 
    WHEN is_super_admin = true THEN 'super_admin'::user_role
    WHEN is_admin = true THEN 'admin'::user_role
    ELSE 'user'::user_role
END;

-- Create index on user_type for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Update RLS policies to use user_type
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

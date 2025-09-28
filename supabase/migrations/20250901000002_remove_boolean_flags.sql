-- Remove boolean flags and use only user_type
-- Migration: Remove is_admin and is_super_admin columns

-- First, update any remaining RLS policies to use user_type
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view refinements" ON public.refinements;
DROP POLICY IF EXISTS "Admins can create refinements" ON public.refinements;

-- Create new RLS policies using user_type
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can view all conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can view all messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can view refinements" ON public.refinements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can create refinements" ON public.refinements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Add any missing policies for other tables that might reference the old columns
-- Update sessions table if it references admin status
UPDATE user_sessions 
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{user_type}',
    to_jsonb((SELECT user_type FROM profiles WHERE profiles.id = user_sessions.user_id)::text)
)
WHERE metadata IS NULL OR NOT metadata ? 'user_type';

-- Now safely remove the boolean columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_super_admin;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.user_type IS 'User role: user, expert, admin, or super_admin. Replaces deprecated is_admin/is_super_admin columns.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Update any functions that might still reference the old columns
-- (This is a safety measure - most should already be using user_type)

-- Add constraint to ensure valid user types
ALTER TABLE public.profiles 
ADD CONSTRAINT check_user_type_valid 
CHECK (user_type IN ('user', 'expert', 'admin', 'super_admin'));

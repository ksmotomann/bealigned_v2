-- Setup Admin Access and Create ALIGN Code
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Add user_type column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- Step 2: Grant admin access to your user (replace with your email)
-- You'll need to find your user ID first or use your email
UPDATE public.profiles
SET user_type = 'admin'
WHERE email = 'robertmann@me.com'; -- Replace with your actual email

-- If you don't know your email or the above doesn't work, you can check who's currently signed in:
-- SELECT id, email, user_type FROM profiles WHERE id = auth.uid();

-- Step 3: Create the alignment_codes table with proper structure if it doesn't exist
CREATE TABLE IF NOT EXISTS public.alignment_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    max_uses INTEGER, -- NULL = unlimited uses
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Step 4: Enable RLS on alignment_codes
ALTER TABLE public.alignment_codes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Users can view active codes for validation
CREATE POLICY IF NOT EXISTS "Users can view active codes for validation" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
    );

-- Admins can view all codes
CREATE POLICY IF NOT EXISTS "Admins can view all alignment codes" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can insert new codes
CREATE POLICY IF NOT EXISTS "Admins can create alignment codes" ON public.alignment_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can update codes
CREATE POLICY IF NOT EXISTS "Admins can update alignment codes" ON public.alignment_codes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Step 6: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.alignment_codes TO authenticated;

-- Step 7: Create the ALIGN code (only if it doesn't exist)
INSERT INTO public.alignment_codes (
    code,
    description,
    max_uses,
    current_uses,
    expires_at,
    is_active
)
SELECT
    'ALIGN',
    'Pilot user code: 45 days + 45 days bonus if used 5+ times',
    NULL, -- Unlimited uses
    0,
    NOW() + INTERVAL '45 days',
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.alignment_codes WHERE code = 'ALIGN'
);

-- Step 8: Verify setup
SELECT
    'Setup complete!' as status,
    'User: ' || email as user_info,
    'Type: ' || COALESCE(user_type, 'user') as user_type
FROM public.profiles
WHERE id = auth.uid();

-- Verify ALIGN code was created
SELECT
    code,
    description,
    expires_at,
    is_active,
    created_at
FROM public.alignment_codes
WHERE code = 'ALIGN';
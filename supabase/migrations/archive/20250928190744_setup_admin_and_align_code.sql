-- Setup Admin Access and Create ALIGN Code
-- Migration to properly configure alignment codes system and grant admin access

-- Step 1: Add user_type column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- Step 2: Grant admin access to Robert Mann (project owner)
-- This will work for any user with email robertmann@me.com
UPDATE public.profiles
SET user_type = 'admin'
WHERE email = 'robertmann@me.com';

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

-- Step 5: Create RLS policies (using DROP IF EXISTS for safety)

-- Users can view active codes for validation
DROP POLICY IF EXISTS "Users can view active codes for validation" ON public.alignment_codes;
CREATE POLICY "Users can view active codes for validation" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
    );

-- Admins can view all codes
DROP POLICY IF EXISTS "Admins can view all alignment codes" ON public.alignment_codes;
CREATE POLICY "Admins can view all alignment codes" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can insert new codes
DROP POLICY IF EXISTS "Admins can create alignment codes" ON public.alignment_codes;
CREATE POLICY "Admins can create alignment codes" ON public.alignment_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can update codes
DROP POLICY IF EXISTS "Admins can update alignment codes" ON public.alignment_codes;
CREATE POLICY "Admins can update alignment codes" ON public.alignment_codes
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

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alignment_codes_code ON public.alignment_codes(code);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_active ON public.alignment_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_expires ON public.alignment_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
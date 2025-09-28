-- Create ALIGN code for pilot users
-- Run this in Supabase Dashboard > SQL Editor

-- Insert ALIGN code (expires 45 days from now)
-- Check if it already exists first
INSERT INTO public.alignment_codes (
    code,
    user_tier,
    description,
    max_uses,
    current_uses,
    expires_at,
    is_active
)
SELECT
    'ALIGN',
    'premium',
    'Pilot user code: 45 days + 45 days bonus if used 5+ times',
    NULL, -- Unlimited uses
    0,
    NOW() + INTERVAL '45 days',
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.alignment_codes WHERE code = 'ALIGN'
);

-- Grant proper permissions to authenticated users for reading alignment codes
GRANT SELECT ON public.alignment_codes TO authenticated;

-- Verify the code was created
SELECT
    code,
    user_tier,
    description,
    expires_at,
    is_active,
    created_at
FROM public.alignment_codes
WHERE code = 'ALIGN';
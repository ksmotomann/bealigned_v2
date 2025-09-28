-- Step 1: Create basic alignment codes table and add missing column
-- Run this first to establish the foundation

-- 1. Add user_type column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- 2. Add alignment code tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS alignment_code_used VARCHAR(50);

-- 3. Create basic alignment codes table (no foreign key constraints yet)
CREATE TABLE IF NOT EXISTS public.alignment_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    user_type TEXT NOT NULL,
    description TEXT,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,  -- No foreign key constraint for now
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Create basic indexes
CREATE INDEX IF NOT EXISTS idx_alignment_codes_code ON public.alignment_codes(code);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_type ON public.alignment_codes(user_type);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_active ON public.alignment_codes(is_active);

-- 5. Insert default codes
INSERT INTO public.alignment_codes (code, user_type, description, max_uses, created_by)
VALUES
    ('ADMIN-REQUEST', 'admin', 'Request admin access - requires manual approval', NULL, NULL),
    ('EXPERT-BETA', 'expert', 'Expert access for beta testers', 100, NULL),
    ('PILOT-PARTNERS', 'expert', 'Pilot Partners - 45 days free access then $49.95/year conversion', 1000, NULL),
    ('GENERAL-ACCESS', 'user', 'General user access', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- 6. Enable RLS
ALTER TABLE public.alignment_codes ENABLE ROW LEVEL SECURITY;

-- 7. Basic RLS policy for viewing codes
DROP POLICY IF EXISTS "Users can view active codes" ON public.alignment_codes;
CREATE POLICY "Users can view active codes" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (is_active = TRUE);

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.alignment_codes TO authenticated;

-- Success message
SELECT 'Step 1 complete: Basic alignment_codes table created with 4 default codes!' as status,
       COUNT(*) as codes_created
FROM public.alignment_codes;
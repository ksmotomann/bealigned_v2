-- Step 2: Add association table and functions
-- Run this AFTER step 1 succeeds

-- 1. Create user-alignment code association table
CREATE TABLE IF NOT EXISTS public.user_alignment_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alignment_code_id UUID NOT NULL REFERENCES public.alignment_codes(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted', 'suspended')),
    conversion_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, alignment_code_id)
);

-- 2. Create indexes for association table
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_user_id ON public.user_alignment_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_code ON public.user_alignment_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_status ON public.user_alignment_codes(status);

-- 3. Enable RLS
ALTER TABLE public.user_alignment_codes ENABLE ROW LEVEL SECURITY;

-- 4. Basic RLS policy
DROP POLICY IF EXISTS "Users can view own alignment codes" ON public.user_alignment_codes;
CREATE POLICY "Users can view own alignment codes" ON public.user_alignment_codes
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_alignment_codes TO authenticated;

-- Success message
SELECT 'Step 2 complete: Association table created!' as status;
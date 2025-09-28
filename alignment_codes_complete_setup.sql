-- Complete Alignment Codes Setup - Adds missing columns and creates system
-- Run this in Supabase SQL Editor

-- 1. First, add the user_type column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- 2. Add alignment code tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS alignment_code_used VARCHAR(50);

-- 3. Create alignment codes table
CREATE TABLE IF NOT EXISTS public.alignment_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    user_type TEXT NOT NULL,
    description TEXT,
    max_uses INTEGER, -- NULL = unlimited uses
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Create user-alignment code association table for individual tracking
CREATE TABLE IF NOT EXISTS public.user_alignment_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alignment_code_id UUID NOT NULL REFERENCES public.alignment_codes(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- Denormalized for easy querying
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at TIMESTAMP WITH TIME ZONE, -- Individual trial expiration (e.g., 45 days from used_at)
    expires_at TIMESTAMP WITH TIME ZONE, -- Individual code expiration
    usage_count INTEGER DEFAULT 1, -- How many times this user has used this specific code
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted', 'suspended')),
    conversion_date TIMESTAMP WITH TIME ZONE, -- When user converted from trial to paid
    metadata JSONB DEFAULT '{}', -- Additional tracking data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one active association per user-code combination
    UNIQUE(user_id, alignment_code_id)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alignment_codes_code ON public.alignment_codes(code);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_type ON public.alignment_codes(user_type);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_active ON public.alignment_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_expires ON public.alignment_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_alignment_code ON public.profiles(alignment_code_used);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Indexes for user_alignment_codes table
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_user_id ON public.user_alignment_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_code ON public.user_alignment_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_status ON public.user_alignment_codes(status);
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_trial_ends ON public.user_alignment_codes(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_expires ON public.user_alignment_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_alignment_codes_used_at ON public.user_alignment_codes(used_at);

-- 6. Enable RLS on both tables
ALTER TABLE public.alignment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alignment_codes ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for alignment_codes

-- Users can view active, non-expired codes for validation
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
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- 8. RLS Policies for user_alignment_codes

-- Users can view their own alignment code associations
DROP POLICY IF EXISTS "Users can view own alignment codes" ON public.user_alignment_codes;
CREATE POLICY "Users can view own alignment codes" ON public.user_alignment_codes
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all user alignment code associations
DROP POLICY IF EXISTS "Admins can view all user alignment codes" ON public.user_alignment_codes;
CREATE POLICY "Admins can view all user alignment codes" ON public.user_alignment_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- System can insert user alignment code associations (via function)
DROP POLICY IF EXISTS "System can create user alignment codes" ON public.user_alignment_codes;
CREATE POLICY "System can create user alignment codes" ON public.user_alignment_codes
    FOR INSERT TO authenticated
    WITH CHECK (true); -- Will be controlled by function

-- System can update user alignment code associations
DROP POLICY IF EXISTS "System can update user alignment codes" ON public.user_alignment_codes;
CREATE POLICY "System can update user alignment codes" ON public.user_alignment_codes
    FOR UPDATE TO authenticated
    USING (true) -- Will be controlled by function
    WITH CHECK (true);

-- 9. Function to validate and use an alignment code
CREATE OR REPLACE FUNCTION public.use_alignment_code(
    p_code VARCHAR(50),
    p_user_id UUID
) RETURNS TABLE (
    success BOOLEAN,
    user_type TEXT,
    message TEXT
) AS $$
DECLARE
    code_record RECORD;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get the code details
    SELECT
        ac.id,
        ac.code,
        ac.user_type,
        ac.max_uses,
        ac.current_uses,
        ac.expires_at,
        ac.is_active
    INTO code_record
    FROM public.alignment_codes ac
    WHERE ac.code = p_code;

    -- Check if code exists
    IF code_record.id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'user'::TEXT, 'Invalid alignment code';
        RETURN;
    END IF;

    -- Check if code is active
    IF NOT code_record.is_active THEN
        RETURN QUERY SELECT FALSE, 'user'::TEXT, 'This alignment code has been deactivated';
        RETURN;
    END IF;

    -- Check if code has expired
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at <= current_time THEN
        RETURN QUERY SELECT FALSE, 'user'::TEXT, 'This alignment code has expired';
        RETURN;
    END IF;

    -- Check usage limits
    IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
        RETURN QUERY SELECT FALSE, 'user'::TEXT, 'This alignment code has reached its usage limit';
        RETURN;
    END IF;

    -- Check if user already used this specific code
    IF EXISTS (
        SELECT 1 FROM public.user_alignment_codes
        WHERE user_id = p_user_id AND alignment_code_id = code_record.id
    ) THEN
        RETURN QUERY SELECT FALSE, 'user'::TEXT, 'You have already used this alignment code';
        RETURN;
    END IF;

    -- Check if user has any active codes that haven't expired
    -- Business rule: Users can only have one active alignment code at a time
    -- They can get a new one once their previous expires
    IF EXISTS (
        SELECT 1 FROM public.user_alignment_codes
        WHERE user_id = p_user_id
          AND status = 'active'
          AND (
              -- Code with no expiration (permanent)
              (trial_ends_at IS NULL AND expires_at IS NULL)
              -- Or code that hasn't expired yet
              OR (trial_ends_at IS NOT NULL AND trial_ends_at > current_time)
              OR (expires_at IS NOT NULL AND expires_at > current_time)
          )
    ) THEN
        RETURN QUERY SELECT FALSE, 'user'::TEXT, 'You have an active alignment code that has not yet expired. Please wait for it to expire before using a new code.';
        RETURN;
    END IF;

    -- Code is valid, increment usage and update user
    UPDATE public.alignment_codes
    SET
        current_uses = current_uses + 1,
        updated_at = current_time
    WHERE code = p_code;

    -- Create user-code association with trial logic
    INSERT INTO public.user_alignment_codes (
        user_id,
        alignment_code_id,
        code,
        used_at,
        trial_ends_at,
        expires_at,
        status,
        metadata
    ) VALUES (
        p_user_id,
        code_record.id,
        p_code,
        current_time,
        -- Set trial period for PILOT-PARTNERS (45 days)
        CASE
            WHEN p_code = 'PILOT-PARTNERS' THEN current_time + INTERVAL '45 days'
            ELSE NULL
        END,
        -- Individual expiration based on code expiration
        code_record.expires_at,
        'active',
        CASE
            WHEN p_code = 'PILOT-PARTNERS' THEN jsonb_build_object(
                'trial_period_days', 45,
                'conversion_price', 49.95,
                'regular_price', 79.95
            )
            ELSE '{}'::jsonb
        END
    );

    -- Update user profile with type and code used
    UPDATE public.profiles
    SET
        user_type = code_record.user_type,
        alignment_code_used = p_code,
        updated_at = current_time
    WHERE id = p_user_id;

    RETURN QUERY SELECT TRUE, code_record.user_type, 'Alignment code applied successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Helper functions for trial management

-- Function to check user trial status
CREATE OR REPLACE FUNCTION public.get_user_trial_status(p_user_id UUID)
RETURNS TABLE (
    code VARCHAR(50),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER,
    is_trial_active BOOLEAN,
    conversion_price NUMERIC,
    regular_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        uac.code,
        uac.trial_ends_at,
        CASE
            WHEN uac.trial_ends_at IS NOT NULL THEN
                EXTRACT(days FROM (uac.trial_ends_at - NOW()))::INTEGER
            ELSE NULL
        END as days_remaining,
        CASE
            WHEN uac.trial_ends_at IS NOT NULL AND uac.trial_ends_at > NOW() THEN TRUE
            ELSE FALSE
        END as is_trial_active,
        (uac.metadata->>'conversion_price')::NUMERIC as conversion_price,
        (uac.metadata->>'regular_price')::NUMERIC as regular_price
    FROM public.user_alignment_codes uac
    WHERE uac.user_id = p_user_id
      AND uac.status = 'active'
      AND uac.trial_ends_at IS NOT NULL
    ORDER BY uac.used_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert user from trial to paid
CREATE OR REPLACE FUNCTION public.convert_user_trial(
    p_user_id UUID,
    p_code VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    UPDATE public.user_alignment_codes
    SET
        status = 'converted',
        conversion_date = current_time,
        updated_at = current_time
    WHERE user_id = p_user_id
      AND code = p_code
      AND status = 'active';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old alignment codes (call this periodically)
CREATE OR REPLACE FUNCTION public.expire_alignment_codes()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Expire codes based on trial_ends_at
    UPDATE public.user_alignment_codes
    SET
        status = 'expired',
        updated_at = current_time
    WHERE status = 'active'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at <= current_time;

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    -- Expire codes based on expires_at
    UPDATE public.user_alignment_codes
    SET
        status = 'expired',
        updated_at = current_time
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= current_time;

    GET DIAGNOSTICS expired_count = expired_count + ROW_COUNT;

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use a new code (helper for UI)
CREATE OR REPLACE FUNCTION public.can_user_use_new_code(p_user_id UUID)
RETURNS TABLE (
    can_use BOOLEAN,
    message TEXT,
    current_code VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    active_code RECORD;
BEGIN
    -- Check for any active codes
    SELECT
        uac.code,
        COALESCE(uac.trial_ends_at, uac.expires_at) as expiration
    INTO active_code
    FROM public.user_alignment_codes uac
    WHERE uac.user_id = p_user_id
      AND uac.status = 'active'
      AND (
          -- Code with no expiration (permanent)
          (uac.trial_ends_at IS NULL AND uac.expires_at IS NULL)
          -- Or code that hasn't expired yet
          OR (uac.trial_ends_at IS NOT NULL AND uac.trial_ends_at > current_time)
          OR (uac.expires_at IS NOT NULL AND uac.expires_at > current_time)
      )
    ORDER BY uac.used_at DESC
    LIMIT 1;

    IF active_code.code IS NOT NULL THEN
        RETURN QUERY SELECT
            FALSE,
            'You have an active alignment code: ' || active_code.code,
            active_code.code,
            active_code.expiration;
    ELSE
        RETURN QUERY SELECT
            TRUE,
            'You can use a new alignment code',
            NULL::VARCHAR(50),
            NULL::TIMESTAMP WITH TIME ZONE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.alignment_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_alignment_codes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_alignment_code(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_trial_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_user_trial(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_alignment_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_use_new_code(UUID) TO authenticated;

-- 12. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_alignment_codes_updated_at ON public.alignment_codes;
CREATE TRIGGER update_alignment_codes_updated_at
    BEFORE UPDATE ON public.alignment_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_alignment_codes
DROP TRIGGER IF EXISTS update_user_alignment_codes_updated_at ON public.user_alignment_codes;
CREATE TRIGGER update_user_alignment_codes_updated_at
    BEFORE UPDATE ON public.user_alignment_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Insert default codes
INSERT INTO public.alignment_codes (code, user_type, description, max_uses, created_by)
VALUES
    ('ADMIN-REQUEST', 'admin', 'Request admin access - requires manual approval', NULL, NULL),
    ('EXPERT-BETA', 'expert', 'Expert access for beta testers', 100, NULL),
    ('PILOT-PARTNERS', 'expert', 'Pilot Partners - 45 days free access then $49.95/year conversion', 1000, NULL),
    ('GENERAL-ACCESS', 'user', 'General user access', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- 14. Success message
SELECT 'Complete alignment codes system with user_type column setup complete!' as status;
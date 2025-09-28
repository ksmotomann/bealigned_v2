-- Step 3: Add admin policies and main functions
-- Run this AFTER step 1 and 2 succeed

-- 1. Add admin RLS policies for alignment_codes
DROP POLICY IF EXISTS "Admins can view all alignment codes" ON public.alignment_codes;
CREATE POLICY "Admins can view all alignment codes" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can create alignment codes" ON public.alignment_codes;
CREATE POLICY "Admins can create alignment codes" ON public.alignment_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

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

-- 2. Add admin policies for user_alignment_codes
DROP POLICY IF EXISTS "Admins can view all user alignment codes" ON public.user_alignment_codes;
CREATE POLICY "Admins can view all user alignment codes" ON public.user_alignment_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- 3. Main use_alignment_code function
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

-- 4. Grant function permissions
GRANT EXECUTE ON FUNCTION public.use_alignment_code(VARCHAR, UUID) TO authenticated;

-- Success message
SELECT 'Step 3 complete: Admin policies and main function added!' as status;
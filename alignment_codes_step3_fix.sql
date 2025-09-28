-- Step 3: Add corrected functions (fixes the GET DIAGNOSTICS error)
-- Run this after steps 1 and 2

-- Function to validate and use an alignment code
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
    IF EXISTS (
        SELECT 1 FROM public.user_alignment_codes
        WHERE user_id = p_user_id
          AND status = 'active'
          AND (
              (trial_ends_at IS NULL AND expires_at IS NULL)
              OR (trial_ends_at IS NOT NULL AND trial_ends_at > current_time)
              OR (expires_at IS NOT NULL AND expires_at > current_time)
          )
    ) THEN
        RETURN QUERY SELECT FALSE, 'user'::TEXT, 'You have an active alignment code that has not yet expired. Please wait for it to expire before using a new code.';
        RETURN;
    END IF;

    -- Code is valid, increment usage
    UPDATE public.alignment_codes
    SET
        current_uses = current_uses + 1,
        updated_at = current_time
    WHERE code = p_code;

    -- Create user-code association
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
        CASE
            WHEN p_code = 'PILOT-PARTNERS' THEN current_time + INTERVAL '45 days'
            ELSE NULL
        END,
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

    -- Update user profile
    UPDATE public.profiles
    SET
        user_type = code_record.user_type,
        alignment_code_used = p_code,
        updated_at = current_time
    WHERE id = p_user_id;

    RETURN QUERY SELECT TRUE, code_record.user_type, 'Alignment code applied successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old alignment codes (FIXED)
CREATE OR REPLACE FUNCTION public.expire_alignment_codes()
RETURNS INTEGER AS $$
DECLARE
    trial_expired_count INTEGER := 0;
    date_expired_count INTEGER := 0;
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

    GET DIAGNOSTICS trial_expired_count = ROW_COUNT;

    -- Expire codes based on expires_at
    UPDATE public.user_alignment_codes
    SET
        status = 'expired',
        updated_at = current_time
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= current_time;

    GET DIAGNOSTICS date_expired_count = ROW_COUNT;

    RETURN trial_expired_count + date_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION public.use_alignment_code(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_alignment_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_trial_status(UUID) TO authenticated;

-- Success message
SELECT 'Step 3 complete: Functions created successfully!' as status;
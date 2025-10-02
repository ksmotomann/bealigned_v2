-- Update Alignment Codes with Analytics Tracking
-- Run this in Supabase SQL Editor

-- ===================================================
-- STEP 1: Create Analytics Tracking Tables
-- ===================================================

-- Create user activity tracking table for alignment code analytics
CREATE TABLE IF NOT EXISTS public.alignment_code_user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alignment_code VARCHAR(50) NOT NULL,

    -- Login tracking
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Session tracking
    total_session_minutes DECIMAL(10,2) DEFAULT 0,
    session_count INTEGER DEFAULT 0,

    -- Extension tracking (bonus days earned)
    extensions_earned INTEGER DEFAULT 0,
    extensions_eligible BOOLEAN DEFAULT FALSE,

    -- Conversion tracking
    converted_to_paid BOOLEAN DEFAULT FALSE,
    conversion_date TIMESTAMP WITH TIME ZONE,

    -- Trial/subscription tracking
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end_date TIMESTAMP WITH TIME ZONE,
    subscription_status TEXT DEFAULT 'trial', -- trial, active, expired, cancelled

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, alignment_code)
);

-- Create session tracking table for detailed analytics
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alignment_code VARCHAR(50),

    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_minutes DECIMAL(10,2),

    -- Activity during session
    messages_sent INTEGER DEFAULT 0,
    reflections_completed INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.alignment_code_user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alignment_code_user_activity
CREATE POLICY "Users can view their own activity" ON public.alignment_code_user_activity
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON public.alignment_code_user_activity
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.alignment_code_user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_alignment_code ON public.alignment_code_user_activity(alignment_code);
CREATE INDEX IF NOT EXISTS idx_activity_trial_end ON public.alignment_code_user_activity(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_alignment_code ON public.user_sessions(alignment_code);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON public.user_sessions(session_start);

-- ===================================================
-- STEP 2: Create Analytics Functions/Views
-- ===================================================

-- Function to calculate live alignment code analytics
CREATE OR REPLACE FUNCTION public.get_alignment_code_analytics(p_code VARCHAR(50))
RETURNS TABLE (
    code VARCHAR(50),
    total_active_users BIGINT,
    avg_logins_per_user DECIMAL(10,2),
    avg_minutes_per_session DECIMAL(10,2),
    extensions_percentage DECIMAL(10,2),
    conversion_percentage DECIMAL(10,2),
    expiring_in_14_days BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_code as code,

        -- Total active users (trial or active subscription)
        COUNT(DISTINCT CASE
            WHEN a.subscription_status IN ('trial', 'active')
            THEN a.user_id
        END) as total_active_users,

        -- Average logins per user
        COALESCE(AVG(a.login_count), 0)::DECIMAL(10,2) as avg_logins_per_user,

        -- Average minutes per session
        COALESCE(AVG(
            CASE
                WHEN a.session_count > 0
                THEN a.total_session_minutes / a.session_count
            END
        ), 0)::DECIMAL(10,2) as avg_minutes_per_session,

        -- Extensions percentage (users who earned extensions)
        CASE
            WHEN COUNT(a.user_id) > 0
            THEN (COUNT(CASE WHEN a.extensions_earned > 0 THEN 1 END)::DECIMAL / COUNT(a.user_id) * 100)
            ELSE 0
        END::DECIMAL(10,2) as extensions_percentage,

        -- Conversion percentage (users who converted to paid)
        CASE
            WHEN COUNT(a.user_id) > 0
            THEN (COUNT(CASE WHEN a.converted_to_paid THEN 1 END)::DECIMAL / COUNT(a.user_id) * 100)
            ELSE 0
        END::DECIMAL(10,2) as conversion_percentage,

        -- Users expiring in 14 days
        COUNT(CASE
            WHEN a.trial_end_date IS NOT NULL
            AND a.trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '14 days'
            AND a.subscription_status = 'trial'
            AND NOT a.converted_to_paid
            THEN 1
        END) as expiring_in_14_days

    FROM public.alignment_code_user_activity a
    WHERE a.alignment_code = p_code
    GROUP BY p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.alignment_code_user_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_alignment_code_analytics(VARCHAR) TO authenticated;

-- ===================================================
-- STEP 3: Update Alignment Codes
-- ===================================================

-- Delete all alignment codes EXCEPT 'ALIGN'
DELETE FROM public.alignment_codes
WHERE code != 'ALIGN';

-- Insert the new codes from the design
-- Note: user_type should match your database enum values
-- Adjust 'pilot', 'beta', 'qa' to match your actual user_role enum if different

INSERT INTO public.alignment_codes (
    code,
    user_type,
    description,
    subscription_tier,
    trial_days,
    conversion_price,
    regular_price,
    is_active
) VALUES
    -- ALIGN-01 through ALIGN-10 (Pilot type) - zero-padded for proper sorting
    ('ALIGN-01', 'user', 'Pilot Partner Code 1', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-02', 'user', 'Pilot Partner Code 2', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-03', 'user', 'Pilot Partner Code 3', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-04', 'user', 'Pilot Partner Code 4', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-05', 'user', 'Pilot Partner Code 5', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-06', 'user', 'Pilot Partner Code 6', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-07', 'user', 'Pilot Partner Code 7', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-08', 'user', 'Pilot Partner Code 8', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-09', 'user', 'Pilot Partner Code 9', 'pilot_partner', 45, 49.95, 79.95, true),
    ('ALIGN-10', 'user', 'Pilot Partner Code 10', 'pilot_partner', 45, 49.95, 79.95, true),

    -- BeBetaUser (Beta type)
    ('BeBetaUser', 'expert', 'Beta Tester Access', 'beta', 90, 0, 0, true),

    -- BE-FREE-1YR (QA type)
    ('BE-FREE-1YR', 'expert', 'QA Team - 1 Year Free Access', 'free', 365, 0, 0, true)
ON CONFLICT (code) DO UPDATE SET
    user_type = EXCLUDED.user_type,
    description = EXCLUDED.description,
    subscription_tier = EXCLUDED.subscription_tier,
    trial_days = EXCLUDED.trial_days,
    conversion_price = EXCLUDED.conversion_price,
    regular_price = EXCLUDED.regular_price,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ===================================================
-- STEP 4: Create trigger to initialize user activity
-- ===================================================

-- Function to initialize user activity when code is used
CREATE OR REPLACE FUNCTION public.initialize_user_activity_for_code()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user's profile is updated with an alignment code, initialize their activity tracking
    IF NEW.alignment_code_used IS NOT NULL AND NEW.alignment_code_used != OLD.alignment_code_used THEN
        INSERT INTO public.alignment_code_user_activity (
            user_id,
            alignment_code,
            trial_start_date,
            trial_end_date
        )
        SELECT
            NEW.id,
            NEW.alignment_code_used,
            NOW(),
            NOW() + (INTERVAL '1 day' * COALESCE(ac.trial_days, 30))
        FROM public.alignment_codes ac
        WHERE ac.code = NEW.alignment_code_used
        ON CONFLICT (user_id, alignment_code) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trg_initialize_user_activity ON public.profiles;
CREATE TRIGGER trg_initialize_user_activity
    AFTER UPDATE OF alignment_code_used ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_user_activity_for_code();

-- ===================================================
-- STEP 5: Verify the setup
-- ===================================================

-- Check all alignment codes
SELECT code, user_type, description, trial_days, is_active
FROM public.alignment_codes
ORDER BY code;

-- Check analytics table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'alignment_code_user_activity'
ORDER BY ordinal_position;

COMMENT ON TABLE public.alignment_code_user_activity IS 'Tracks user activity and analytics per alignment code for the admin dashboard';
COMMENT ON TABLE public.user_sessions IS 'Detailed session tracking for calculating session duration metrics';
COMMENT ON FUNCTION public.get_alignment_code_analytics(VARCHAR) IS 'Calculates live analytics for a specific alignment code';

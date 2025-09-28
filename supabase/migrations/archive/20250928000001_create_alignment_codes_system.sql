-- Create alignment codes system
-- Migration: 20250928000001_create_alignment_codes_system.sql

-- Create alignment codes table
CREATE TABLE public.alignment_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    user_tier user_role NOT NULL,
    description TEXT,
    max_uses INTEGER, -- NULL = unlimited uses
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Add alignment code tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS alignment_code_used VARCHAR(50);

-- Create indexes for performance
CREATE INDEX idx_alignment_codes_code ON public.alignment_codes(code);
CREATE INDEX idx_alignment_codes_tier ON public.alignment_codes(user_tier);
CREATE INDEX idx_alignment_codes_active ON public.alignment_codes(is_active);
CREATE INDEX idx_alignment_codes_expires ON public.alignment_codes(expires_at);
CREATE INDEX idx_profiles_alignment_code ON public.profiles(alignment_code_used);

-- Enable RLS on alignment_codes table
ALTER TABLE public.alignment_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alignment_codes

-- Users can view active, non-expired codes for validation
CREATE POLICY "Users can view active codes for validation" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
    );

-- Admins can view all codes
CREATE POLICY "Admins can view all alignment codes" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can insert new codes
CREATE POLICY "Admins can create alignment codes" ON public.alignment_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can update codes
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

-- Function to validate and use an alignment code
CREATE OR REPLACE FUNCTION public.use_alignment_code(
    p_code VARCHAR(50),
    p_user_id UUID
) RETURNS TABLE (
    success BOOLEAN,
    user_tier user_role,
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
        ac.user_tier,
        ac.max_uses,
        ac.current_uses,
        ac.expires_at,
        ac.is_active
    INTO code_record
    FROM public.alignment_codes ac
    WHERE ac.code = p_code;

    -- Check if code exists
    IF code_record.id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'Invalid alignment code';
        RETURN;
    END IF;

    -- Check if code is active
    IF NOT code_record.is_active THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'This alignment code has been deactivated';
        RETURN;
    END IF;

    -- Check if code has expired
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at <= current_time THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'This alignment code has expired';
        RETURN;
    END IF;

    -- Check usage limits
    IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'This alignment code has reached its usage limit';
        RETURN;
    END IF;

    -- Check if user already used this code
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND alignment_code_used = p_code
    ) THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'You have already used this alignment code';
        RETURN;
    END IF;

    -- Code is valid, increment usage and update user
    UPDATE public.alignment_codes
    SET
        current_uses = current_uses + 1,
        updated_at = current_time
    WHERE code = p_code;

    -- Update user profile with tier and code used
    UPDATE public.profiles
    SET
        user_type = code_record.user_tier,
        alignment_code_used = p_code,
        updated_at = current_time
    WHERE id = p_user_id;

    RETURN QUERY SELECT TRUE, code_record.user_tier, 'Alignment code applied successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default alignment codes (run once)
CREATE OR REPLACE FUNCTION public.create_default_alignment_codes()
RETURNS VOID AS $$
BEGIN
    -- Insert default codes if they don't exist
    INSERT INTO public.alignment_codes (code, user_tier, description, max_uses, created_by)
    VALUES
        ('ADMIN-REQUEST', 'admin', 'Request admin access - requires manual approval', NULL, NULL),
        ('EXPERT-BETA', 'expert', 'Expert access for beta testers', 100, NULL),
        ('PILOT-PARTNERS', 'expert', 'Pilot Partners - 45 days free access then $49.95/year conversion', 1000, NULL),
        ('GENERAL-ACCESS', 'user', 'General user access', NULL, NULL)
    ON CONFLICT (code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.alignment_codes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_alignment_code(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_alignment_codes() TO authenticated;

-- Update the user_profiles view to include alignment code info
DROP VIEW IF EXISTS public.user_profiles;
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  u.id,
  u.email,
  p.first_name,
  p.last_name,
  p.full_name,
  p.avatar_url,
  p.user_type,
  p.alignment_code_used,
  p.is_active,
  -- Basic co-parenting info
  p.metadata->>'co_parent_name' as co_parent_name,
  p.metadata->>'relationship_status' as relationship_status,
  p.metadata->>'separation_date' as separation_date,

  -- Children information
  p.metadata->'children' as children_info,
  p.metadata->>'child_count' as child_count,

  -- Extended family members
  p.metadata->'family_members' as family_members,
  p.metadata->'step_parents' as step_parents,
  p.metadata->'grandparents' as grandparents,
  p.metadata->'siblings' as siblings,

  -- Custody & arrangements
  p.metadata->'custody_arrangement' as custody_arrangement,
  p.metadata->>'primary_residence' as primary_residence,
  p.metadata->'holiday_schedule' as holiday_schedule,
  p.metadata->'exchange_details' as exchange_details,

  -- Professional support team
  p.metadata->'professionals' as professionals,
  p.metadata->>'attorney_name' as attorney_name,
  p.metadata->>'mediator_name' as mediator_name,
  p.metadata->>'therapist_name' as therapist_name,
  p.metadata->>'child_therapist_name' as child_therapist_name,

  -- Communication preferences
  p.metadata->'communication_preferences' as communication_preferences,
  p.metadata->>'preferred_contact_method' as preferred_contact_method,
  p.metadata->>'emergency_contact' as emergency_contact,

  -- Co-parenting goals & challenges
  p.metadata->'goals' as goals,
  p.metadata->'conflict_areas' as conflict_areas,
  p.metadata->'strengths' as strengths,

  -- Financial
  p.metadata->'financial_arrangements' as financial_arrangements,
  p.metadata->>'child_support_status' as child_support_status,

  -- Important dates
  p.metadata->'important_dates' as important_dates,
  p.metadata->'milestones' as milestones,

  -- Health & medical
  p.metadata->'medical_info' as medical_info,
  p.metadata->'allergies' as allergies,
  p.metadata->'medications' as medications,

  -- Additional context
  p.metadata->>'parenting_philosophy' as parenting_philosophy,
  p.metadata->>'cultural_considerations' as cultural_considerations,
  p.metadata->>'special_needs' as special_needs,
  p.metadata->>'notes' as notes,

  p.created_at,
  p.updated_at,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- Grant access to the updated view
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Create updated_at trigger for alignment_codes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alignment_codes_updated_at
    BEFORE UPDATE ON public.alignment_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
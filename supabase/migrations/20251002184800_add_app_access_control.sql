-- Add app access control to alignment codes
-- This allows fine-grained control over what users can access based on their alignment code

-- Add app_access_status column to alignment_codes
ALTER TABLE public.alignment_codes
ADD COLUMN IF NOT EXISTS app_access_status TEXT DEFAULT 'full_access';

-- Add custom_landing_message column for restricted access codes
ALTER TABLE public.alignment_codes
ADD COLUMN IF NOT EXISTS custom_landing_message JSONB DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.alignment_codes.app_access_status IS 'Controls app access: full_access, restrict_with_landing, approval_required, disabled';
COMMENT ON COLUMN public.alignment_codes.custom_landing_message IS 'Custom message shown on landing page for restricted codes';

-- Update BeBetaUser code to use restricted access with custom landing message
UPDATE public.alignment_codes
SET
    app_access_status = 'restrict_with_landing',
    custom_landing_message = jsonb_build_object(
        'title', 'Welcome, BeBetaUser!',
        'message', 'You''re one of the very first to join BeAligned™. Right now, we''re still putting the finishing touches on our reflection tool so that it''s clear, grounded, and truly built for you.\n\nThank you for stepping in early — your presence matters. You''re not just waiting for an app, you''re helping build a movement. We will notify you as soon as it is ready.\n\nBeta access will open soon. As an early BeBetaUser, you''ll be the first to experience it.'
    )
WHERE code = 'BeBetaUser';

-- Create index for app_access_status
CREATE INDEX IF NOT EXISTS idx_alignment_codes_access_status ON public.alignment_codes(app_access_status);

-- Add app_access_status to profiles for quick lookup (denormalized for performance)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS app_access_status TEXT DEFAULT 'full_access';

-- Create function to sync app_access_status to profile when alignment code is used
CREATE OR REPLACE FUNCTION public.sync_app_access_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When alignment_code_used is updated, sync the app_access_status
    IF NEW.alignment_code_used IS NOT NULL AND (OLD.alignment_code_used IS NULL OR NEW.alignment_code_used != OLD.alignment_code_used) THEN
        UPDATE public.profiles
        SET app_access_status = (
            SELECT app_access_status
            FROM public.alignment_codes
            WHERE code = NEW.alignment_code_used
            LIMIT 1
        )
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync app_access_status
DROP TRIGGER IF EXISTS trg_sync_app_access_status ON public.profiles;
CREATE TRIGGER trg_sync_app_access_status
    AFTER UPDATE OF alignment_code_used ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_app_access_status();

-- Backfill existing users' app_access_status based on their alignment code
UPDATE public.profiles p
SET app_access_status = COALESCE(
    (
        SELECT ac.app_access_status
        FROM public.alignment_codes ac
        WHERE ac.code = p.alignment_code_used
        LIMIT 1
    ),
    'full_access'
)
WHERE p.alignment_code_used IS NOT NULL;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.sync_app_access_status() TO authenticated;

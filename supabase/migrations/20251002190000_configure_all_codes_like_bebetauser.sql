-- Configure all alignment codes (except ALIGN) to use same settings as BeBetaUser
-- This restricts access and shows a custom landing page

UPDATE public.alignment_codes
SET
    app_access_status = 'restrict_with_landing',
    custom_landing_message = jsonb_build_object(
        'title', 'Welcome, BeBetaUser!',
        'message', 'You''re one of the very first to join BeAligned™. Right now, we''re still putting the finishing touches on our reflection tool so that it''s clear, grounded, and truly built for you.\n\nThank you for stepping in early — your presence matters. You''re not just waiting for an app, you''re helping build a movement. We will notify you as soon as it is ready.\n\nBeta access will open soon. As an early BeBetaUser, you''ll be the first to experience it.'
    ),
    updated_at = NOW()
WHERE code != 'ALIGN';

-- Verify the update
SELECT
    code,
    app_access_status,
    custom_landing_message->>'title' as landing_title
FROM public.alignment_codes
ORDER BY code;

-- Fix BeBetalizer to BeBetaUser

UPDATE public.alignment_codes
SET code = 'BeBetaUser'
WHERE code = 'BeBetalizer';

-- Verify the change
SELECT code, user_type, description, trial_days, is_active
FROM public.alignment_codes
WHERE code = 'BeBetaUser';

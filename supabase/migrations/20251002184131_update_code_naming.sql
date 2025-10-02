-- Update alignment code naming to use zero-padded numbers for proper sorting

UPDATE public.alignment_codes
SET code = 'ALIGN-01'
WHERE code = 'ALIGN-1';

UPDATE public.alignment_codes
SET code = 'ALIGN-02'
WHERE code = 'ALIGN-2';

UPDATE public.alignment_codes
SET code = 'ALIGN-03'
WHERE code = 'ALIGN-3';

UPDATE public.alignment_codes
SET code = 'ALIGN-04'
WHERE code = 'ALIGN-4';

UPDATE public.alignment_codes
SET code = 'ALIGN-05'
WHERE code = 'ALIGN-5';

UPDATE public.alignment_codes
SET code = 'ALIGN-06'
WHERE code = 'ALIGN-6';

UPDATE public.alignment_codes
SET code = 'ALIGN-07'
WHERE code = 'ALIGN-7';

UPDATE public.alignment_codes
SET code = 'ALIGN-08'
WHERE code = 'ALIGN-8';

UPDATE public.alignment_codes
SET code = 'ALIGN-09'
WHERE code = 'ALIGN-9';

-- Verify the updated codes
SELECT code, user_type, description, trial_days, is_active
FROM public.alignment_codes
ORDER BY code;

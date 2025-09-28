-- Add Stripe customer ID column to profiles table
-- Run this in Supabase SQL Console

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON public.profiles(stripe_customer_id);

-- Success message
SELECT 'Stripe customer ID column added to profiles table!' as status;
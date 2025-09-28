-- Enhanced Alignment Codes with Subscription Paths
-- Adds subscription tier management and enhanced expiration controls

-- Add subscription path fields to alignment_codes table
ALTER TABLE public.alignment_codes
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'premium',
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 45,
ADD COLUMN IF NOT EXISTS conversion_price DECIMAL(10,2) DEFAULT 49.95,
ADD COLUMN IF NOT EXISTS regular_price DECIMAL(10,2) DEFAULT 79.95,
ADD COLUMN IF NOT EXISTS bonus_conditions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auto_expire_behavior TEXT DEFAULT 'require_payment';

-- Create subscription tiers table for better organization
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    trial_days INTEGER NOT NULL,
    conversion_price DECIMAL(10,2) NOT NULL,
    regular_price DECIMAL(10,2) NOT NULL,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscription_tiers
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for subscription_tiers (read-only for authenticated users)
CREATE POLICY "Users can view subscription tiers" ON public.subscription_tiers
    FOR SELECT TO authenticated
    USING (true);

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers (name, trial_days, conversion_price, regular_price, features) VALUES
('pilot_partner', 45, 49.95, 79.95, '{"bonus_days_for_usage": 45, "min_uses_for_bonus": 5}'),
('premium', 30, 59.95, 79.95, '{}'),
('basic', 14, 39.95, 59.95, '{}'),
('free', 7, 0, 0, '{"limited_features": true}')
ON CONFLICT (name) DO NOTHING;

-- Update existing ALIGN code with pilot partner tier
UPDATE public.alignment_codes
SET
    subscription_tier = 'pilot_partner',
    trial_days = 45,
    conversion_price = 49.95,
    regular_price = 79.95,
    bonus_conditions = '{"bonus_days": 45, "min_uses_required": 5, "description": "45 days bonus if used 5+ times"}',
    auto_expire_behavior = 'show_conversion_offer'
WHERE code = 'ALIGN';

-- Grant permissions
GRANT SELECT ON public.subscription_tiers TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alignment_codes_subscription_tier ON public.alignment_codes(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_alignment_codes_trial_days ON public.alignment_codes(trial_days);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_name ON public.subscription_tiers(name);
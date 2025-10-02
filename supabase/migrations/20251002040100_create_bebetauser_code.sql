-- Create BeBetaUser alignment code
INSERT INTO alignment_codes (
  code,
  user_type,
  description,
  subscription_tier,
  trial_days,
  conversion_price,
  regular_price,
  requires_approval,
  is_active
) VALUES (
  'BeBetaUser',
  'user',
  '7-day free trial for beta users - requires admin approval to access full features',
  'free',
  7,
  0,
  0,
  true, -- requires approval
  true
) ON CONFLICT (code) DO UPDATE SET
  requires_approval = true,
  trial_days = 7,
  description = '7-day free trial for beta users - requires admin approval to access full features';

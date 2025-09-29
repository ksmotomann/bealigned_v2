-- Add legal document acknowledgment tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_acknowledged_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_acknowledged_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requires_legal_acknowledgment boolean NOT NULL DEFAULT true;
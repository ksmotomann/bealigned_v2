-- Add contact_email and contact_phone columns to coaching_session_requests
ALTER TABLE coaching_session_requests 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

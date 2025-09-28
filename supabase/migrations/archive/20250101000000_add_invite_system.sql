-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Invite metadata
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  organization VARCHAR(255),
  message TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Limits and expiration
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_invites_code ON invites(invite_code);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_invited_by ON invites(invited_by);
CREATE INDEX idx_invites_expires_at ON invites(expires_at);

-- Create function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(20) := '';
  i INTEGER;
BEGIN
  -- Generate 3 groups of 4 characters separated by dashes (e.g., ABCD-1234-WXYZ)
  FOR i IN 1..12 LOOP
    IF i = 5 OR i = 9 THEN
      result := result || '-';
    END IF;
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and use invite code
CREATE OR REPLACE FUNCTION use_invite_code(
  p_invite_code VARCHAR(20),
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  invite_data JSON
) AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Find the invite
  SELECT * INTO v_invite 
  FROM invites 
  WHERE UPPER(invite_code) = UPPER(p_invite_code);
  
  -- Check if invite exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invalid invite code', NULL::JSON;
    RETURN;
  END IF;
  
  -- Check if invite is expired
  IF v_invite.expires_at < NOW() THEN
    -- Update status to expired
    UPDATE invites SET status = 'expired' WHERE id = v_invite.id;
    RETURN QUERY SELECT FALSE, 'Invite code has expired', NULL::JSON;
    RETURN;
  END IF;
  
  -- Check if invite has been cancelled
  IF v_invite.status = 'cancelled' THEN
    RETURN QUERY SELECT FALSE, 'Invite code has been cancelled', NULL::JSON;
    RETURN;
  END IF;
  
  -- Check if invite has reached max uses
  IF v_invite.uses_count >= v_invite.max_uses THEN
    RETURN QUERY SELECT FALSE, 'Invite code has reached maximum uses', NULL::JSON;
    RETURN;
  END IF;
  
  -- Use the invite
  UPDATE invites 
  SET 
    uses_count = uses_count + 1,
    status = CASE 
      WHEN uses_count + 1 >= max_uses THEN 'accepted'
      ELSE status
    END,
    accepted_at = CASE 
      WHEN accepted_at IS NULL THEN NOW()
      ELSE accepted_at
    END,
    accepted_by = CASE 
      WHEN accepted_by IS NULL THEN p_user_id
      ELSE accepted_by
    END,
    updated_at = NOW()
  WHERE id = v_invite.id;
  
  RETURN QUERY SELECT 
    TRUE, 
    'Invite code accepted successfully',
    row_to_json(v_invite)::JSON;
END;
$$ LANGUAGE plpgsql;

-- Create view for active invites
CREATE OR REPLACE VIEW active_invites AS
SELECT 
  i.*,
  u.email as inviter_email,
  p.first_name as inviter_first_name,
  p.last_name as inviter_last_name
FROM invites i
LEFT JOIN auth.users u ON i.invited_by = u.id
LEFT JOIN profiles p ON i.invited_by = p.id
WHERE i.status IN ('pending', 'sent')
  AND i.expires_at > NOW()
  AND i.uses_count < i.max_uses;

-- RLS Policies
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites they created
CREATE POLICY "Users can view own invites" ON invites
  FOR SELECT
  USING (invited_by = auth.uid());

-- Users can create invites
CREATE POLICY "Users can create invites" ON invites
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- Users can update their own invites
CREATE POLICY "Users can update own invites" ON invites
  FOR UPDATE
  USING (invited_by = auth.uid());

-- Anyone can check an invite by code (for registration)
CREATE POLICY "Anyone can check invite by code" ON invites
  FOR SELECT
  USING (true);

-- Function to clean up expired invites (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE invites
  SET status = 'expired'
  WHERE status IN ('pending', 'sent')
    AND expires_at < NOW();
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invite_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invites_timestamp
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION update_invite_timestamp();
-- Create coaching_session_requests table
CREATE TABLE IF NOT EXISTS coaching_session_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('email', 'text', 'phone')),
  contact_email TEXT,
  contact_phone TEXT,
  time_zone TEXT NOT NULL,
  coparenting_situation TEXT CHECK (coparenting_situation IN ('divorced', 'never_married', 'remarried')),
  children_ages TEXT[] NOT NULL,
  primary_focus TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  coach_notes TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_coaching_requests_user_id ON coaching_session_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_status ON coaching_session_requests(status);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_created_at ON coaching_session_requests(created_at DESC);

-- Enable RLS
ALTER TABLE coaching_session_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own requests
CREATE POLICY "Users can view own coaching requests"
  ON coaching_session_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "Users can create coaching requests"
  ON coaching_session_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all requests
CREATE POLICY "Admins can view all coaching requests"
  ON coaching_session_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update coaching requests"
  ON coaching_session_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Add comment
COMMENT ON TABLE coaching_session_requests IS 'Stores requests for free first win coaching sessions';

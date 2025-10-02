-- Create founder_soundbite_requests table
CREATE TABLE IF NOT EXISTS founder_soundbite_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  situation TEXT NOT NULL,
  priority_level TEXT NOT NULL CHECK (priority_level IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  audio_url TEXT,
  response_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_founder_soundbite_requests_user_id ON founder_soundbite_requests(user_id);

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_founder_soundbite_requests_status ON founder_soundbite_requests(status);

-- Enable RLS
ALTER TABLE founder_soundbite_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own requests
CREATE POLICY "Users can create their own soundbite requests"
  ON founder_soundbite_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own soundbite requests"
  ON founder_soundbite_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own pending requests (to cancel)
CREATE POLICY "Users can update their own pending requests"
  ON founder_soundbite_requests
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all soundbite requests"
  ON founder_soundbite_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update all soundbite requests"
  ON founder_soundbite_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Add comment to document the table
COMMENT ON TABLE founder_soundbite_requests IS 'Stores user requests for personalized audio messages from the founder';

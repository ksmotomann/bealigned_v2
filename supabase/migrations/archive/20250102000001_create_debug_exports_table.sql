-- Create debug_exports table to store chat debug exports
CREATE TABLE IF NOT EXISTS debug_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  comments TEXT,
  export_data JSONB NOT NULL,
  current_phase INTEGER,
  message_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_debug_exports_conversation ON debug_exports(conversation_id);
CREATE INDEX idx_debug_exports_user ON debug_exports(user_id);
CREATE INDEX idx_debug_exports_created ON debug_exports(created_at DESC);

-- Enable RLS
ALTER TABLE debug_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own debug exports
CREATE POLICY "Users can view own debug exports"
  ON debug_exports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own debug exports
CREATE POLICY "Users can create own debug exports"
  ON debug_exports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all debug exports
CREATE POLICY "Admins can view all debug exports"
  ON debug_exports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Add comment about the table's purpose
COMMENT ON TABLE debug_exports IS 'Stores debug exports of conversations for analysis and tuning';
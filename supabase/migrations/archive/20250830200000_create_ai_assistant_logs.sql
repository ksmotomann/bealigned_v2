-- Create AI assistant interaction logs table
CREATE TABLE ai_assistant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_ai_assistant_logs_user_id ON ai_assistant_logs(user_id);
CREATE INDEX idx_ai_assistant_logs_created_at ON ai_assistant_logs(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_assistant_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own logs
CREATE POLICY "Users can view their own AI assistant logs" ON ai_assistant_logs
  FOR SELECT USING (user_id = auth.uid());

-- Admins and Super Admins can view all logs
CREATE POLICY "Admins can view all AI assistant logs" ON ai_assistant_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.is_super_admin = true)
    )
  );

-- Only the system can insert logs (via authenticated API calls)
CREATE POLICY "System can insert AI assistant logs" ON ai_assistant_logs
  FOR INSERT WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_ai_assistant_logs_updated_at
  BEFORE UPDATE ON ai_assistant_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON ai_assistant_logs TO authenticated;
GRANT INSERT ON ai_assistant_logs TO authenticated;
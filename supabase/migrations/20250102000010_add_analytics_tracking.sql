-- Add session tracking fields to conversations for better analytics
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phase_progression JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_timezone TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS completion_quality_score INTEGER CHECK (completion_quality_score >= 1 AND completion_quality_score <= 5);

-- Add analytics tracking to messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_length INTEGER,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0);

-- Create session analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  time_spent_minutes INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  phase_reached INTEGER DEFAULT 0,
  completion_type TEXT CHECK (completion_type IN ('completed', 'abandoned', 'paused', 'interrupted')),
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user engagement analytics table
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  sessions_started INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  ai_queries_made INTEGER DEFAULT 0,
  features_used JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_date)
);

-- Create feature usage analytics table
CREATE TABLE IF NOT EXISTS feature_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  feature_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better analytics performance
CREATE INDEX IF NOT EXISTS idx_conversations_session_analytics ON conversations(session_start_time, last_activity_time);
CREATE INDEX IF NOT EXISTS idx_conversations_completion_quality ON conversations(completion_quality_score) WHERE completion_quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_session_analytics_date ON session_analytics(session_date);
CREATE INDEX IF NOT EXISTS idx_session_analytics_user ON session_analytics(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_user_engagement_metrics_date ON user_engagement_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_feature_usage_analytics_feature ON feature_usage_analytics(feature_name, last_used_at);

-- Create triggers to update analytics automatically
CREATE OR REPLACE FUNCTION update_session_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session analytics when conversation is updated
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO session_analytics (
      conversation_id, 
      user_id, 
      session_date, 
      time_spent_minutes,
      phase_reached,
      completion_type
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      NEW.updated_at::date,
      NEW.session_duration_minutes,
      NEW.completion_step,
      CASE 
        WHEN NEW.is_completed = true THEN 'completed'
        WHEN NEW.archived = true THEN 'abandoned'
        ELSE 'paused'
      END
    )
    ON CONFLICT (conversation_id) DO UPDATE SET
      time_spent_minutes = NEW.session_duration_minutes,
      phase_reached = NEW.completion_step,
      completion_type = CASE 
        WHEN NEW.is_completed = true THEN 'completed'
        WHEN NEW.archived = true THEN 'abandoned'
        ELSE 'paused'
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'conversations_analytics_trigger') THEN
    CREATE TRIGGER conversations_analytics_trigger
      AFTER UPDATE ON conversations
      FOR EACH ROW
      EXECUTE FUNCTION update_session_analytics();
  END IF;
END $$;

-- Update existing conversations with basic analytics data
UPDATE conversations 
SET session_start_time = created_at,
    last_activity_time = updated_at
WHERE session_start_time IS NULL;

COMMENT ON TABLE session_analytics IS 'Detailed session-level analytics for conversations';
COMMENT ON TABLE user_engagement_metrics IS 'Daily user engagement metrics aggregation';
COMMENT ON TABLE feature_usage_analytics IS 'Track which features users interact with and how often';
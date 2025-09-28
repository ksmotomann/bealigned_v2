-- Create tables for Admin Feedback + Auto-Tune Integration system

-- Message feedback from admins
CREATE TABLE message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  rater_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- accuracy, clarity, tone, practicality, child_centeredness, process_fit
  rating INTEGER, -- 1-5 scale (optional)
  tags TEXT[], -- array of feedback tags
  comment TEXT, -- free-text feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message refinements (detailed edits and guidance)
CREATE TABLE message_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  rater_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- alternative_response, guidance_for_future, correction, missing_followup_prompt
  primary_text TEXT NOT NULL, -- alternative/correction/guidance content
  notes TEXT, -- rationale/context
  governance_tags TEXT[], -- e.g., ['tone/calm','clear/concise','seven_step/5']
  system_profile_id TEXT,
  prompt_template_id TEXT,
  model TEXT,
  apply_as_override BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Auto-tune proposals generated from feedback analysis
CREATE TABLE autotune_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recommendations JSONB NOT NULL, -- structured recommendations per setting
  metrics JSONB, -- aggregated metrics that triggered the proposal
  governance_links TEXT[], -- related governance document sections
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, applied
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  dry_run BOOLEAN DEFAULT TRUE
);

-- Auto-tune events for tracking analysis runs
CREATE TABLE autotune_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- analysis_run, proposal_generated, proposal_applied
  profile_id TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Chat history table for auto-tune analysis (if not exists)
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  model TEXT,
  tokens INTEGER,
  latency_ms INTEGER,
  system_profile_id TEXT,
  prompt_template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debug logs table for detailed analysis
CREATE TABLE IF NOT EXISTS debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  log_type TEXT NOT NULL, -- prompt, retrieval, rag_stats, error
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_message_feedback_chat_message ON message_feedback(chat_id, message_id);
CREATE INDEX idx_message_feedback_rater ON message_feedback(rater_user_id);
CREATE INDEX idx_message_feedback_created_at ON message_feedback(created_at DESC);

CREATE INDEX idx_message_refinements_chat_message ON message_refinements(chat_id, message_id);
CREATE INDEX idx_message_refinements_rater ON message_refinements(rater_user_id);
CREATE INDEX idx_message_refinements_category ON message_refinements(category);
CREATE INDEX idx_message_refinements_created_at ON message_refinements(created_at DESC);

CREATE INDEX idx_autotune_proposals_profile ON autotune_proposals(profile_id);
CREATE INDEX idx_autotune_proposals_status ON autotune_proposals(status);
CREATE INDEX idx_autotune_proposals_created_at ON autotune_proposals(created_at DESC);

CREATE INDEX idx_autotune_events_type ON autotune_events(event_type);
CREATE INDEX idx_autotune_events_profile ON autotune_events(profile_id);
CREATE INDEX idx_autotune_events_created_at ON autotune_events(created_at DESC);

CREATE INDEX idx_chat_history_chat_message ON chat_history(chat_id, message_id);
CREATE INDEX idx_chat_history_profile ON chat_history(system_profile_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);

CREATE INDEX idx_debug_logs_chat_message ON debug_logs(chat_id, message_id);
CREATE INDEX idx_debug_logs_type ON debug_logs(log_type);
CREATE INDEX idx_debug_logs_created_at ON debug_logs(created_at DESC);

-- RLS Policies (admin-only access)
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_refinements ENABLE ROW LEVEL SECURITY;
ALTER TABLE autotune_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE autotune_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can access feedback and auto-tune data
CREATE POLICY "Admins can manage feedback" ON message_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage refinements" ON message_refinements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage autotune proposals" ON autotune_proposals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage autotune events" ON autotune_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view chat history" ON chat_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view debug logs" ON debug_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'super_admin')
    )
  );
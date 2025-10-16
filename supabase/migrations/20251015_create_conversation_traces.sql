-- =====================================================
-- Create conversation_traces table
-- =====================================================
-- This table stores detailed traces of AI conversation turns
-- for debugging, analytics, and governance auditing

CREATE TABLE IF NOT EXISTS conversation_traces (
  id BIGSERIAL PRIMARY KEY,

  -- Session context
  session_id UUID NOT NULL,
  turn_index INT NOT NULL,

  -- Phase information
  phase TEXT NOT NULL,
  substate TEXT,
  phase_emoji TEXT,  -- Emoji representation of phase (🌿, 🌊, 🌞, etc.)

  -- Conversation content
  user_input TEXT NOT NULL,
  ai_response TEXT NOT NULL,

  -- Flow metrics
  readiness NUMERIC CHECK (readiness BETWEEN 0 AND 1),
  phase_advanced BOOLEAN NOT NULL DEFAULT false,
  next_phase TEXT,
  force_advanced BOOLEAN DEFAULT false,
  reprompt_count INT DEFAULT 0,
  decision TEXT,  -- Flow decision (e.g., 'offer_deepthink', 'advance', 'contain')

  -- AI model configuration
  model TEXT,
  temperature NUMERIC,
  max_output_tokens INT,
  chat_version INT,

  -- Retrieved context tracking
  retrieved_ids JSONB,  -- Array of {source, id, score, steward, status} objects

  -- Admin feedback linkage
  correction_id UUID,  -- Links to admin_feedback table if this turn was corrected

  -- Flexible metadata storage
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key to reflection_sessions
  CONSTRAINT fk_conversation_traces_session
    FOREIGN KEY (session_id)
    REFERENCES reflection_sessions(id)
    ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_conversation_traces_session ON conversation_traces(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_traces_phase ON conversation_traces(phase);
CREATE INDEX IF NOT EXISTS idx_conversation_traces_created ON conversation_traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_traces_phase_advanced ON conversation_traces(phase_advanced) WHERE phase_advanced = true;
CREATE INDEX IF NOT EXISTS idx_conversation_traces_correction ON conversation_traces(correction_id) WHERE correction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_traces_chat_version ON conversation_traces(chat_version);

-- Comments for documentation
COMMENT ON TABLE conversation_traces IS 'Detailed trace log of AI conversation turns for debugging, analytics, and governance';
COMMENT ON COLUMN conversation_traces.session_id IS 'FK to reflection_sessions';
COMMENT ON COLUMN conversation_traces.turn_index IS 'Sequential turn number within the session';
COMMENT ON COLUMN conversation_traces.phase IS 'Phase identifier (issue, feelings, why, perspective, options, choose, message)';
COMMENT ON COLUMN conversation_traces.substate IS 'For complex phases like Phase 7, tracks substate (integrate, option, coauthor, etc.)';
COMMENT ON COLUMN conversation_traces.phase_emoji IS 'Emoji representation of phase for UI display';
COMMENT ON COLUMN conversation_traces.readiness IS 'AI-assessed readiness score (0.0-1.0) for phase advancement';
COMMENT ON COLUMN conversation_traces.phase_advanced IS 'Whether this turn resulted in phase advancement';
COMMENT ON COLUMN conversation_traces.next_phase IS 'Next phase after this turn';
COMMENT ON COLUMN conversation_traces.force_advanced IS 'Whether advancement was forced due to max reprompts';
COMMENT ON COLUMN conversation_traces.reprompt_count IS 'Number of follow-up prompts in current phase';
COMMENT ON COLUMN conversation_traces.decision IS 'Flow decision made by engine (advance, contain, offer_deepthink, etc.)';
COMMENT ON COLUMN conversation_traces.retrieved_ids IS 'JSONB array of retrieved vector content IDs with scores';
COMMENT ON COLUMN conversation_traces.correction_id IS 'FK to admin_feedback if this turn was corrected by admin';
COMMENT ON COLUMN conversation_traces.chat_version IS 'Chat version used (1, 2, or 3)';
COMMENT ON COLUMN conversation_traces.metadata IS 'Flexible JSONB storage for signals, context, or phase-specific data';

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE conversation_traces ENABLE ROW LEVEL SECURITY;

-- Users can view traces for their own sessions
CREATE POLICY "Users can view own conversation traces"
  ON conversation_traces
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM reflection_sessions WHERE owner_id = auth.uid()
    )
  );

-- Service role can do anything (for edge functions)
CREATE POLICY "Service role full access to conversation traces"
  ON conversation_traces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all traces
CREATE POLICY "Admins can view all conversation traces"
  ON conversation_traces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- Verification
-- =====================================================

-- Verify table was created successfully
DO $$
BEGIN
  RAISE NOTICE 'conversation_traces table created successfully';
  RAISE NOTICE 'Columns: %', (
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_name = 'conversation_traces'
    AND table_schema = 'public'
  );
END $$;

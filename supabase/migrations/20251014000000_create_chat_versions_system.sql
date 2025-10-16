-- =====================================================
-- Chat Versioning System Migration
-- Created: 2025-10-14
-- Purpose: Enable versioned chat architecture with
--          admin controls and isolated v3 vector storage
-- =====================================================

-- =====================================================
-- 1. CORE VERSION REGISTRY
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_versions (
  version INT PRIMARY KEY,
  display_name TEXT NOT NULL,
  edge_function_name TEXT NOT NULL,
  default_model TEXT NOT NULL,
  default_temperature NUMERIC NOT NULL CHECK (default_temperature BETWEEN 0 AND 2),
  default_max_tokens INT NOT NULL CHECK (default_max_tokens > 0),
  temperature_min NUMERIC NOT NULL DEFAULT 0 CHECK (temperature_min BETWEEN 0 AND 2),
  temperature_max NUMERIC NOT NULL DEFAULT 1.2 CHECK (temperature_max BETWEEN 0 AND 2),
  max_tokens_cap INT NOT NULL DEFAULT 2000,
  phase_token_overrides JSONB,
  scoring_module TEXT,        -- e.g. "scoring/v2"
  retrieval_module TEXT,      -- "retrieval/disabled" | "retrieval/v3"
  prompts_module TEXT,        -- "prompts/v2"
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_admin_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one version can be default at a time
CREATE UNIQUE INDEX idx_chat_versions_default ON chat_versions(is_default) WHERE is_default = true;

COMMENT ON TABLE chat_versions IS 'Registry of chat system versions with configuration';
COMMENT ON COLUMN chat_versions.version IS 'Integer version number (1, 2, 3)';
COMMENT ON COLUMN chat_versions.edge_function_name IS 'Supabase edge function name (chat, chat-v2, chat-v3)';
COMMENT ON COLUMN chat_versions.scoring_module IS 'Module path for version-specific readiness scoring';
COMMENT ON COLUMN chat_versions.retrieval_module IS 'Module path for vector retrieval (disabled for v1/v2)';
COMMENT ON COLUMN chat_versions.prompts_module IS 'Module path for version-specific prompt tuning';
COMMENT ON COLUMN chat_versions.phase_token_overrides IS 'JSON object: {"phase_6": 2000, "phase_7": 2500}';

-- =====================================================
-- 2. ALTER REFLECTION_SESSIONS
-- =====================================================

-- Add chat_version FK (temporarily nullable for migration)
ALTER TABLE reflection_sessions
  ADD COLUMN IF NOT EXISTS chat_version INT REFERENCES chat_versions(version) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add version configuration columns
ALTER TABLE reflection_sessions
  ADD COLUMN IF NOT EXISTS ai_model TEXT,
  ADD COLUMN IF NOT EXISTS temperature NUMERIC,
  ADD COLUMN IF NOT EXISTS max_tokens INT,
  ADD COLUMN IF NOT EXISTS version_config JSONB;

COMMENT ON COLUMN reflection_sessions.chat_version IS 'FK to chat_versions - determines which chat engine was used';
COMMENT ON COLUMN reflection_sessions.ai_model IS 'Model override for this session (null uses version default)';
COMMENT ON COLUMN reflection_sessions.temperature IS 'Temperature override for this session';
COMMENT ON COLUMN reflection_sessions.max_tokens IS 'Max tokens override for this session';
COMMENT ON COLUMN reflection_sessions.version_config IS 'Flexible config storage (phase overrides, etc)';

-- =====================================================
-- 3. ALTER CONVERSATION_TRACES (if exists)
-- =====================================================

-- Check if conversation_traces exists, add columns if it does
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_traces') THEN
    ALTER TABLE conversation_traces
      ADD COLUMN IF NOT EXISTS chat_version INT,
      ADD COLUMN IF NOT EXISTS model TEXT,
      ADD COLUMN IF NOT EXISTS temperature NUMERIC,
      ADD COLUMN IF NOT EXISTS max_output_tokens INT;

    COMMENT ON COLUMN conversation_traces.chat_version IS 'Version used for this trace';
    COMMENT ON COLUMN conversation_traces.model IS 'AI model used';
    COMMENT ON COLUMN conversation_traces.temperature IS 'Temperature used';
    COMMENT ON COLUMN conversation_traces.max_output_tokens IS 'Max tokens used';
  END IF;
END $$;

-- =====================================================
-- 4. V3 VECTOR SCHEMA (ISOLATED)
-- =====================================================

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create isolated schema for v3 vector content
CREATE SCHEMA IF NOT EXISTS v3_vector;

COMMENT ON SCHEMA v3_vector IS 'Isolated vector storage for chat v3 - principles, exemplars, and flow content';

-- V3 Principles: Core BeH2O principles and governance
CREATE TABLE IF NOT EXISTS v3_vector.principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_principles_embedding ON v3_vector.principles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_v3_principles_tags ON v3_vector.principles USING gin(tags);

COMMENT ON TABLE v3_vector.principles IS 'BeH2O principles and governance content for v3 retrieval';

-- V3 Exemplars: Sample conversations showing ideal patterns
CREATE TABLE IF NOT EXISTS v3_vector.exemplars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL,
  why TEXT NOT NULL,
  input_snippet TEXT NOT NULL,
  response_snippet TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_exemplars_embedding ON v3_vector.exemplars USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_v3_exemplars_phase ON v3_vector.exemplars(phase);
CREATE INDEX IF NOT EXISTS idx_v3_exemplars_tags ON v3_vector.exemplars USING gin(tags);

COMMENT ON TABLE v3_vector.exemplars IS 'Conversation exemplars for v3 pattern matching';
COMMENT ON COLUMN v3_vector.exemplars.phase IS 'Flow phase this exemplar demonstrates';
COMMENT ON COLUMN v3_vector.exemplars.why IS 'Why this exemplar is valuable';

-- V3 Flows: Flow state and transition patterns
CREATE TABLE IF NOT EXISTS v3_vector.flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_node TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v3_flows_embedding ON v3_vector.flows USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_v3_flows_node ON v3_vector.flows(flow_node);
CREATE INDEX IF NOT EXISTS idx_v3_flows_tags ON v3_vector.flows USING gin(tags);

COMMENT ON TABLE v3_vector.flows IS 'Flow patterns and transitions for v3';
COMMENT ON COLUMN v3_vector.flows.flow_node IS 'Identifier for this flow pattern';

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on chat_versions (admin-only writes)
ALTER TABLE chat_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat versions"
  ON chat_versions FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage chat versions"
  ON chat_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

-- Enable RLS on v3 vector tables (admin-only writes, edge function reads)
ALTER TABLE v3_vector.principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE v3_vector.exemplars ENABLE ROW LEVEL SECURITY;
ALTER TABLE v3_vector.flows ENABLE ROW LEVEL SECURITY;

-- Anyone can read (edge functions need this)
CREATE POLICY "Anyone can view v3 principles"
  ON v3_vector.principles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view v3 exemplars"
  ON v3_vector.exemplars FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view v3 flows"
  ON v3_vector.flows FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Only admins can manage v3 principles"
  ON v3_vector.principles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admins can manage v3 exemplars"
  ON v3_vector.exemplars FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admins can manage v3 flows"
  ON v3_vector.flows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- 6. SEED DATA
-- =====================================================

INSERT INTO chat_versions
(version, display_name, edge_function_name, default_model, default_temperature, default_max_tokens, temperature_min, temperature_max, max_tokens_cap, is_default, is_admin_only, scoring_module, retrieval_module, prompts_module)
VALUES
(1, 'v1 – Governance Only', 'chat', 'gpt-4o-mini', 0.4, 900, 0, 1.2, 1500, false, true, 'scoring/v1', 'retrieval/disabled', 'prompts/v1'),
(2, 'v2 – Current Production', 'chat-v2', 'gpt-4o', 0.7, 1500, 0, 1.2, 2000, true, false, 'scoring/v2', 'retrieval/disabled', 'prompts/v2'),
(3, 'v3 – Vector Hybrid (Beta)', 'chat-v3', 'gpt-4o', 0.7, 1500, 0, 1.2, 2500, false, true, 'scoring/v3', 'retrieval/v3', 'prompts/v3')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- 7. BACKFILL EXISTING SESSIONS TO V2
-- =====================================================

-- Set all existing sessions to v2 (current production)
UPDATE reflection_sessions
SET chat_version = 2
WHERE chat_version IS NULL;

-- Now make chat_version NOT NULL with default
ALTER TABLE reflection_sessions
  ALTER COLUMN chat_version SET NOT NULL,
  ALTER COLUMN chat_version SET DEFAULT 2;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reflection_sessions_chat_version ON reflection_sessions(chat_version);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to get default version config
CREATE OR REPLACE FUNCTION get_default_chat_version()
RETURNS INT AS $$
  SELECT version FROM chat_versions WHERE is_default = true LIMIT 1;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_default_chat_version IS 'Returns the current default chat version number';

-- Function to validate temperature is within version limits
CREATE OR REPLACE FUNCTION validate_temperature_for_version(
  p_version INT,
  p_temperature NUMERIC
)
RETURNS BOOLEAN AS $$
  SELECT p_temperature BETWEEN cv.temperature_min AND cv.temperature_max
  FROM chat_versions cv
  WHERE cv.version = p_version;
$$ LANGUAGE SQL STABLE;

-- Function to validate max_tokens is within version limits
CREATE OR REPLACE FUNCTION validate_tokens_for_version(
  p_version INT,
  p_max_tokens INT
)
RETURNS BOOLEAN AS $$
  SELECT p_max_tokens <= cv.max_tokens_cap
  FROM chat_versions cv
  WHERE cv.version = p_version;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify migration
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM chat_versions;
  RAISE NOTICE 'Chat versions seeded: % versions', v_count;

  SELECT COUNT(*) INTO v_count FROM reflection_sessions WHERE chat_version IS NOT NULL;
  RAISE NOTICE 'Reflection sessions backfilled: % sessions', v_count;
END $$;

/**
 * V3 Flow Configuration System
 *
 * Enables database-driven phase configuration while keeping
 * core governance and safety gates in code.
 *
 * Key features:
 * - Phase-level configuration (readiness thresholds, max reprompts, etc.)
 * - Runtime tunable without code deploys
 * - Admin-only write access
 * - Safe defaults in code if DB unavailable
 */

-- Phase-level configuration overrides
CREATE TABLE IF NOT EXISTS flow_config (
  phase TEXT PRIMARY KEY,                          -- 'issue','feelings','why','perspective','options','choose','message'
  next_phase TEXT NOT NULL,                        -- default next step
  min_readiness_to_advance NUMERIC NOT NULL DEFAULT 0.7,
  max_reprompts INT NOT NULL DEFAULT 2,
  allow_deepthink BOOLEAN NOT NULL DEFAULT false,
  substate_order TEXT[] DEFAULT NULL,              -- example: {'integrate','option','coauthor','fitcheck','contain'}
  enabled BOOLEAN NOT NULL DEFAULT true,
  version_tag TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful seed that mirrors current defaults
INSERT INTO flow_config (phase, next_phase, min_readiness_to_advance, max_reprompts, allow_deepthink, substate_order)
VALUES
  ('issue', 'feelings', 0.7, 2, false, NULL),
  ('feelings', 'why', 0.7, 2, false, NULL),
  ('why', 'perspective', 0.7, 2, false, NULL),
  ('perspective', 'options', 0.7, 2, false, NULL),
  ('options', 'choose', 0.7, 2, false, NULL),
  ('choose', 'message', 0.7, 2, false, NULL),
  ('message', 'final', 0.7, 2, true, ARRAY['integrate','option','coauthor','fitcheck','contain'])
ON CONFLICT (phase) DO NOTHING;

-- RLS: public read, admin write
ALTER TABLE flow_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flow_config_read ON flow_config;
CREATE POLICY flow_config_read
  ON flow_config
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS flow_config_write ON flow_config;
CREATE POLICY flow_config_write
  ON flow_config
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_flow_config_enabled ON flow_config(enabled) WHERE enabled = true;

-- Comments for documentation
COMMENT ON TABLE flow_config IS 'Phase-level configuration for v3 flow system. Enables runtime tuning without code deploys.';
COMMENT ON COLUMN flow_config.phase IS 'Phase identifier: issue, feelings, why, perspective, options, choose, message';
COMMENT ON COLUMN flow_config.next_phase IS 'Next phase on successful completion. Use "final" for last phase.';
COMMENT ON COLUMN flow_config.min_readiness_to_advance IS 'Minimum readiness score (0.0-1.0) required to advance to next phase';
COMMENT ON COLUMN flow_config.max_reprompts IS 'Maximum number of follow-up prompts before forcing advance';
COMMENT ON COLUMN flow_config.allow_deepthink IS 'Whether this phase can trigger Deep Think Mode (48hr pause for human insights)';
COMMENT ON COLUMN flow_config.substate_order IS 'For complex phases (like message), ordered list of substates to traverse';
COMMENT ON COLUMN flow_config.enabled IS 'Kill switch - set false to disable phase';

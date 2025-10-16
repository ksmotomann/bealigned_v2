/**
 * Phase 7 Implementation Migration
 *
 * Adds governance metadata, Phase 7 content, and Deep Think queue
 * Based on instructions from Trina for expression through co-creation
 */

-- =============================================================================
-- 1A) Add governance metadata to all v3_vector tables
-- =============================================================================

-- Add governance columns to principles table
ALTER TABLE v3_vector.principles
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS steward TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS version_tag TEXT,
  ADD COLUMN IF NOT EXISTS governance_hash TEXT;

-- Add governance columns to exemplars table
ALTER TABLE v3_vector.exemplars
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS steward TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS version_tag TEXT,
  ADD COLUMN IF NOT EXISTS governance_hash TEXT;

-- Add governance columns to flows table
ALTER TABLE v3_vector.flows
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS steward TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS version_tag TEXT,
  ADD COLUMN IF NOT EXISTS governance_hash TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT; -- tag node to a phase

-- =============================================================================
-- 1B) Seed Phase 7 principle
-- =============================================================================

INSERT INTO v3_vector.principles (
  title,
  body,
  tags,
  steward,
  status,
  version_tag,
  source_ref,
  embedding
)
VALUES (
  'Phase 7 – Integration and Co-creation',
  'Phase 7 is the integration and co-creation phase. Expression emerges through collaboration, not automation. Integrate, offer options, co-author, fit-check, contain. Deep Think Mode is available when complexity or emotion is high.',
  ARRAY['phase7', 'integration', 'expression'],
  'Trina',
  'approved',
  '2025-Q4',
  'trina-phase7-guidance',
  -- Placeholder embedding (1536 dimensions of zeros) - should be replaced with real embeddings
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 1C) Seed Phase 7 flows
-- =============================================================================

INSERT INTO v3_vector.flows (
  flow_node,
  content,
  tags,
  phase,
  steward,
  status,
  version_tag,
  source_ref,
  embedding
)
VALUES
  (
    'phase_7_integrate',
    'Mirror earlier insights. Ask: "Before we express anything, what feels most important to carry forward right now?"',
    ARRAY['integrate', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  ),
  (
    'phase_7_option_outward',
    'Offer CLEAR message to co-parent or child. Invite exploration.',
    ARRAY['option', 'outward', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  ),
  (
    'phase_7_option_inward',
    'Offer mantra, anchor, or small ritual.',
    ARRAY['option', 'inward', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  ),
  (
    'phase_7_option_complex',
    'Offer Deep Think Mode when emotion or complexity is high.',
    ARRAY['option', 'complex', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  ),
  (
    'phase_7_coauthor',
    'Co-author the expression using the user''s own language. Use CLEAR only to polish for listener readiness.',
    ARRAY['coauthor', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  ),
  (
    'phase_7_fitcheck',
    'Ask: "Does this sound like you? Would you like it softer or stronger?"',
    ARRAY['fitcheck', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  ),
  (
    'phase_7_contain',
    'Close with calm containment. Example: "You do not have to send it today. Staying aligned with your why is enough."',
    ARRAY['contain', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  ),
  (
    'phase_7_deepthink',
    'Offer a 48-hour pause for a human-crafted Aligned Insight.',
    ARRAY['deepthink', 'safety', 'phase7'],
    'phase_7',
    'Trina',
    'approved',
    '2025-Q4',
    'trina-phase7-guidance',
    ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 1D) Seed example exemplar
-- =============================================================================

INSERT INTO v3_vector.exemplars (
  phase,
  why,
  input_snippet,
  response_snippet,
  tags,
  steward,
  status,
  version_tag,
  source_ref,
  embedding
)
VALUES (
  'phase_7',
  'co-creation',
  'I think I need to tell my co-parent how upset I was about the schedule.',
  'Before we express anything, what feels most important to carry forward? Would you like to co-write a listener-ready draft together?',
  ARRAY['phase7', 'outward', 'message'],
  'Trina',
  'approved',
  '2025-Q4',
  'trina-phase7-guidance',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 1E) Create Deep Think queue for human-crafted insights
-- =============================================================================

CREATE TABLE IF NOT EXISTS aligned_insights_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_review | delivered | cancelled
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_aiq_status ON aligned_insights_queue(status);
CREATE INDEX IF NOT EXISTS idx_aiq_session ON aligned_insights_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_aiq_due_at ON aligned_insights_queue(due_at) WHERE status = 'pending';

-- Add foreign key to reflection_sessions
ALTER TABLE aligned_insights_queue
  ADD CONSTRAINT fk_aiq_session
  FOREIGN KEY (session_id)
  REFERENCES reflection_sessions(id)
  ON DELETE CASCADE;

-- =============================================================================
-- RLS Policies for Deep Think Queue
-- =============================================================================

ALTER TABLE aligned_insights_queue ENABLE ROW LEVEL SECURITY;

-- Users can read their own queue items
CREATE POLICY "Users can view own insights queue"
  ON aligned_insights_queue
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM reflection_sessions WHERE owner_id = auth.uid()
    )
  );

-- Users can insert their own queue items
CREATE POLICY "Users can create insights requests"
  ON aligned_insights_queue
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM reflection_sessions WHERE owner_id = auth.uid()
    )
  );

-- Admins can update queue items
CREATE POLICY "Admins can update insights queue"
  ON aligned_insights_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- Update RLS policies for v3_vector tables (if not already present)
-- =============================================================================

-- Ensure public read access for principles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'principles'
    AND schemaname = 'v3_vector'
    AND policyname = 'Public read access'
  ) THEN
    CREATE POLICY "Public read access"
      ON v3_vector.principles
      FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Ensure admin-only write access for principles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'principles'
    AND schemaname = 'v3_vector'
    AND policyname = 'Admin write access'
  ) THEN
    CREATE POLICY "Admin write access"
      ON v3_vector.principles
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND user_type IN ('admin', 'super_admin')
        )
      );
  END IF;
END
$$;

-- Same for flows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flows'
    AND schemaname = 'v3_vector'
    AND policyname = 'Public read access'
  ) THEN
    CREATE POLICY "Public read access"
      ON v3_vector.flows
      FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flows'
    AND schemaname = 'v3_vector'
    AND policyname = 'Admin write access'
  ) THEN
    CREATE POLICY "Admin write access"
      ON v3_vector.flows
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND user_type IN ('admin', 'super_admin')
        )
      );
  END IF;
END
$$;

-- Same for exemplars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exemplars'
    AND schemaname = 'v3_vector'
    AND policyname = 'Public read access'
  ) THEN
    CREATE POLICY "Public read access"
      ON v3_vector.exemplars
      FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exemplars'
    AND schemaname = 'v3_vector'
    AND policyname = 'Admin write access'
  ) THEN
    CREATE POLICY "Admin write access"
      ON v3_vector.exemplars
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND user_type IN ('admin', 'super_admin')
        )
      );
  END IF;
END
$$;

-- =============================================================================
-- Verification Query
-- =============================================================================

-- Uncomment to verify Phase 7 content was inserted:
-- SELECT
--   'principles' as table_name,
--   title,
--   steward,
--   status,
--   array_to_string(tags, ', ') as tags
-- FROM v3_vector.principles
-- WHERE 'phase7' = ANY(tags)
-- UNION ALL
-- SELECT
--   'flows' as table_name,
--   flow_node,
--   steward,
--   status,
--   array_to_string(tags, ', ') as tags
-- FROM v3_vector.flows
-- WHERE 'phase7' = ANY(tags)
-- UNION ALL
-- SELECT
--   'exemplars' as table_name,
--   why,
--   steward,
--   status,
--   array_to_string(tags, ', ') as tags
-- FROM v3_vector.exemplars
-- WHERE 'phase7' = ANY(tags);

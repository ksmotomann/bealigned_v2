/**
 * V3 Vector Content Seeding
 *
 * Seeds minimal approved content for each phase.
 * Uses placeholder embeddings - these should be updated with real embeddings
 * when vector search is fully implemented.
 */

-- Helper: Generate a placeholder embedding (1536 dimensions of zeros)
-- This allows seeding without OpenAI API calls
-- Real embeddings should be generated and updated later

-- Phase 1: Issue
INSERT INTO v3_vector.flows (
  phase,
  flow_node,
  content,
  embedding,
  tags,
  steward,
  status,
  risk_level,
  version_tag,
  governance_hash
)
SELECT
  'issue',
  'warm_welcome',
  'You showed up—that''s something. Take your time. What''s been sticking with you?',
  array_fill(0::float, ARRAY[1536])::vector(1536),
  ARRAY['issue', 'phase1', 'welcome'],
  'Trina',
  'approved',
  'low',
  '2025-Q1',
  md5('warm_welcome_v1')
WHERE NOT EXISTS (
  SELECT 1 FROM v3_vector.flows WHERE governance_hash = md5('warm_welcome_v1')
);

-- Phase 2: Feelings
INSERT INTO v3_vector.flows (
  phase,
  flow_node,
  content,
  embedding,
  tags,
  steward,
  status,
  risk_level,
  version_tag,
  governance_hash
)
SELECT
  'feelings',
  'beneath_surface',
  'Sometimes anger masks hurt, or control masks fear. What might be underneath that for you?',
  array_fill(0::float, ARRAY[1536])::vector(1536),
  ARRAY['feelings', 'phase2', 'depth'],
  'Trina',
  'approved',
  'low',
  '2025-Q1',
  md5('beneath_surface_v1')
WHERE NOT EXISTS (
  SELECT 1 FROM v3_vector.flows WHERE governance_hash = md5('beneath_surface_v1')
);

-- Phase 3: Why
INSERT INTO v3_vector.flows (
  phase,
  flow_node,
  content,
  embedding,
  tags,
  steward,
  status,
  risk_level,
  version_tag,
  governance_hash
)
SELECT
  'why',
  'connect_values',
  'What feels important about this to you? What are you hoping for—for your child, yourself, or the relationship?',
  array_fill(0::float, ARRAY[1536])::vector(1536),
  ARRAY['why', 'phase3', 'values'],
  'Trina',
  'approved',
  'low',
  '2025-Q1',
  md5('connect_values_v1')
WHERE NOT EXISTS (
  SELECT 1 FROM v3_vector.flows WHERE governance_hash = md5('connect_values_v1')
);

-- Phase 4: Perspective
INSERT INTO v3_vector.flows (
  phase,
  flow_node,
  content,
  embedding,
  tags,
  steward,
  status,
  risk_level,
  version_tag,
  governance_hash
)
SELECT
  'perspective',
  'coparent_lens',
  'If your co-parent described this, how might they see it? This is hard—there''s no rush.',
  array_fill(0::float, ARRAY[1536])::vector(1536),
  ARRAY['perspective', 'phase4', 'empathy'],
  'Trina',
  'approved',
  'low',
  '2025-Q1',
  md5('coparent_lens_v1')
WHERE NOT EXISTS (
  SELECT 1 FROM v3_vector.flows WHERE governance_hash = md5('coparent_lens_v1')
);

-- Phase 5: Options
INSERT INTO v3_vector.flows (
  phase,
  flow_node,
  content,
  embedding,
  tags,
  steward,
  status,
  risk_level,
  version_tag,
  governance_hash
)
SELECT
  'options',
  'child_lens',
  'What might your child be noticing about this? How might they be feeling?',
  array_fill(0::float, ARRAY[1536])::vector(1536),
  ARRAY['options', 'phase5', 'child-centered'],
  'Trina',
  'approved',
  'low',
  '2025-Q1',
  md5('child_lens_v1')
WHERE NOT EXISTS (
  SELECT 1 FROM v3_vector.flows WHERE governance_hash = md5('child_lens_v1')
);

-- Phase 6: Choose
INSERT INTO v3_vector.flows (
  phase,
  flow_node,
  content,
  embedding,
  tags,
  steward,
  status,
  risk_level,
  version_tag,
  governance_hash
)
SELECT
  'choose',
  'aligned_choice',
  'Which option feels most aligned with everyone''s needs—yours, your co-parent''s, and your child''s?',
  array_fill(0::float, ARRAY[1536])::vector(1536),
  ARRAY['choose', 'phase6', 'alignment'],
  'Trina',
  'approved',
  'low',
  '2025-Q1',
  md5('aligned_choice_v1')
WHERE NOT EXISTS (
  SELECT 1 FROM v3_vector.flows WHERE governance_hash = md5('aligned_choice_v1')
);

-- Add a BeH2O principle (cross-phase)
INSERT INTO v3_vector.principles (
  title,
  body,
  embedding,
  tags,
  steward,
  status,
  risk_level,
  version_tag,
  governance_hash
)
SELECT
  'BeH2O Core: Guide, Don''t Tell',
  E'BeH2O® Core Principle: Guide, don\'t tell.\n\nLet the AI\'s conversational intelligence emerge naturally rather than engineering rigid responses. The goal is natural conversation flow, not precision rules.',
  array_fill(0::float, ARRAY[1536])::vector(1536),
  ARRAY['beh2o', 'methodology', 'core'],
  'Trina',
  'approved',
  'low',
  '2025-Q1',
  md5('beh2o_guide_not_tell_v1')
WHERE NOT EXISTS (
  SELECT 1 FROM v3_vector.principles WHERE governance_hash = md5('beh2o_guide_not_tell_v1')
);

-- Note: Phase 7 content already exists from previous seeding
-- These are placeholder embeddings. For production use with vector search,
-- generate real embeddings using OpenAI:
--
-- Example edge function to update embeddings:
-- UPDATE v3_vector.flows
-- SET embedding = generate_embedding(content)
-- WHERE embedding = array_fill(0::float, ARRAY[1536])::vector(1536);

-- To verify seeding worked, run this separately:
-- SELECT phase, COUNT(*) as count
-- FROM v3_vector.flows
-- WHERE status = 'approved'
-- GROUP BY phase
-- ORDER BY phase;

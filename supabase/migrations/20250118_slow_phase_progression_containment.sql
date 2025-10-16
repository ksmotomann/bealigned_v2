-- =====================================================
-- Slow Phase Progression & Enhance Containment
-- =====================================================
-- Raises readiness thresholds to slow early phase jumps
-- and adds emotional containment exemplars for Phase 1 and 2.
--
-- Objective: Reduce premature Phase 1→2→3 advancement and
-- meet deep emotion with containment instead of progression.
--
-- Changes:
-- 1. Raise min_readiness thresholds (issue: 0.7→0.85, feelings: 0.7→0.9, why: 0.7→0.9)
-- 2. Add 2 containment exemplars (Phase 1 and 2)

-- =====================================================
-- 1. Raise Readiness Thresholds
-- =====================================================

UPDATE flow_config
SET min_readiness_to_advance = 0.85
WHERE phase = 'issue';

UPDATE flow_config
SET min_readiness_to_advance = 0.90
WHERE phase = 'feelings';

UPDATE flow_config
SET min_readiness_to_advance = 0.90
WHERE phase = 'why';

-- =====================================================
-- 2. Add Containment Exemplars
-- =====================================================

-- Phase 1 containment when emotion shows up early
INSERT INTO v3_vector.exemplars (
  phase,
  why,
  input_snippet,
  response_snippet,
  tags,
  steward,
  status,
  version_tag,
  embedding
)
VALUES (
  'issue',
  'User expresses deep emotional content early; system should contain instead of advancing.',
  'The hurt it puts on our child - it seems so unnecessary.',
  'That really lands — seeing your child hurt like that can be heavy. You do not have to fix it right now. Sometimes just naming how much it hurts is the work.',
  array['containment', 'phase1', 'tone:grounded', 'emotional_depth'],
  'Trina',
  'approved',
  '2025-Q4',
  array_fill(0::float, ARRAY[1536])::vector(1536)
);

-- Phase 2 containment before digging deeper
INSERT INTO v3_vector.exemplars (
  phase,
  why,
  input_snippet,
  response_snippet,
  tags,
  steward,
  status,
  version_tag,
  embedding
)
VALUES (
  'feelings',
  'Containment response for deep emotion before moving on.',
  'I am sad for them and worry about how they will feel throughout their future.',
  'That sadness makes sense — it shows how deeply you care. Let us hold that for a moment before we look at what is underneath it.',
  array['containment', 'phase2', 'tone:soft', 'pause'],
  'Trina',
  'approved',
  '2025-Q4',
  array_fill(0::float, ARRAY[1536])::vector(1536)
);

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Readiness thresholds updated:';
  RAISE NOTICE '  - Phase 1 (issue): %', (SELECT min_readiness_to_advance FROM flow_config WHERE phase = 'issue');
  RAISE NOTICE '  - Phase 2 (feelings): %', (SELECT min_readiness_to_advance FROM flow_config WHERE phase = 'feelings');
  RAISE NOTICE '  - Phase 3 (why): %', (SELECT min_readiness_to_advance FROM flow_config WHERE phase = 'why');

  RAISE NOTICE 'Containment exemplars added: %', (
    SELECT COUNT(*) FROM v3_vector.exemplars
    WHERE tags @> ARRAY['containment']
    AND phase IN ('issue', 'feelings')
    AND status = 'approved'
  );
END $$;

-- =====================================================
-- Phase 2: Boundary & Containment Exemplars
-- =====================================================
-- Teaching v3 to pause and contain when user declines further exploration.
-- No new logic — all learning occurs through vector exemplars.

-- Phase 2: Containment responses for boundary or decline
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
('feelings', 'Containment response when user declines to explore further.',
 'no',
 'Got it. That''s enough for now. Sometimes just naming that hurt is the work. You don''t have to go deeper today.',
 array['containment','boundary','phase2','tone:soft','choice:honor'],
 'Trina','approved','2025-Q1',array_fill(0::float, array[1536])::vector(1536)),

('feelings', 'Boundary-honoring alternative to exploration.',
 'not now',
 'Okay. It''s enough to recognize that feeling. You can come back to it when it feels right.',
 array['containment','boundary','phase2','tone:gentle'],
 'Trina','approved','2025-Q1',array_fill(0::float, array[1536])::vector(1536)),

('feelings', 'User sets limit, system should contain not reopen.',
 'I''m good',
 'Alright. Sometimes just noticing the feeling is enough for now. No need to go further today.',
 array['containment','boundary','phase2','tone:calm'],
 'Trina','approved','2025-Q1',array_fill(0::float, array[1536])::vector(1536));

-- Contrast exemplar for retrieval calibration (what to avoid)
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
('feelings', 'Avoid re-inviting after a user boundary.',
 'no',
 'Would you like to explore this a bit more together?',
 array['avoid','exploration_drift','phase2'],
 'Trina','approved','2025-Q1',array_fill(0::float, array[1536])::vector(1536));

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Phase 2 boundary exemplars added successfully';
  RAISE NOTICE 'Containment exemplars count: %', (
    SELECT COUNT(*) FROM v3_vector.exemplars
    WHERE phase = 'feelings'
    AND 'containment' = ANY(tags)
  );
  RAISE NOTICE 'Contrast exemplars count: %', (
    SELECT COUNT(*) FROM v3_vector.exemplars
    WHERE phase = 'feelings'
    AND 'avoid' = ANY(tags)
  );
END $$;

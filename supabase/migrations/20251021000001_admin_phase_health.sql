-- Admin Phase Health View
--
-- Purpose: Help Trina visualize snippet coverage and detect imbalance across phases
-- Usage: SELECT * FROM admin_phase_health ORDER BY phase;
--
-- This view provides quick insight into:
-- - How many flow snippets exist per phase
-- - How many exemplar snippets exist per phase
-- - Where learning data might be thin or missing

CREATE OR REPLACE VIEW admin_phase_health AS
SELECT
  phase,
  COUNT(*) FILTER (WHERE table_name='flows') AS flow_snippets,
  COUNT(*) FILTER (WHERE table_name='exemplars') AS exemplar_snippets,
  COUNT(*) AS total_snippets,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE table_name='flows') / NULLIF(COUNT(*), 0),
    1
  ) AS pct_flows,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE table_name='exemplars') / NULLIF(COUNT(*), 0),
    1
  ) AS pct_exemplars
FROM (
  SELECT 'flows' AS table_name, phase FROM v3_vector.flows WHERE status = 'approved'
  UNION ALL
  SELECT 'exemplars', phase FROM v3_vector.exemplars WHERE status = 'approved'
) t
GROUP BY phase
ORDER BY phase;

-- Grant read access to authenticated users (admin only in production)
GRANT SELECT ON admin_phase_health TO authenticated;

-- Example queries:
--
-- View all phase health:
--   SELECT * FROM admin_phase_health;
--
-- Find phases with low coverage (< 5 snippets):
--   SELECT * FROM admin_phase_health WHERE total_snippets < 5;
--
-- Find phases with no flow snippets:
--   SELECT * FROM admin_phase_health WHERE flow_snippets = 0;
--
-- Find phases with no exemplars:
--   SELECT * FROM admin_phase_health WHERE exemplar_snippets = 0;

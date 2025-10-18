-- Phase 4 Canonical Name: "shoes" (Step Into Your Co-Parent's Shoes)
--
-- Normalizes all legacy "perspective" references to canonical "shoes".
-- This ensures Phase 4 is consistently labeled across the system.

-- Normalize phase values in flows table
UPDATE v3_vector.flows
SET phase = 'shoes'
WHERE LOWER(phase) IN ('perspective', 'phase4', 'phase_4');

-- Normalize phase values in exemplars table
UPDATE v3_vector.exemplars
SET phase = 'shoes'
WHERE LOWER(phase) IN ('perspective', 'phase4', 'phase_4');

-- Update tags for search consistency in flows
UPDATE v3_vector.flows
SET tags = ARRAY_REMOVE(ARRAY_APPEND(COALESCE(tags, '{}'), 'phase4:shoes'), 'phase4:perspective')
WHERE phase = 'shoes';

-- Update tags for search consistency in exemplars
UPDATE v3_vector.exemplars
SET tags = ARRAY_REMOVE(ARRAY_APPEND(COALESCE(tags, '{}'), 'phase4:shoes'), 'phase4:perspective')
WHERE phase = 'shoes';

-- Audit query to verify no strays remain
-- Run this after migration to confirm:
-- SELECT 'flows' as table, id, phase, tags
-- FROM v3_vector.flows
-- WHERE LOWER(phase) NOT IN ('issue', 'feelings', 'why', 'shoes', 'child', 'choose', 'message')
-- UNION ALL
-- SELECT 'exemplars', id, phase, tags
-- FROM v3_vector.exemplars
-- WHERE LOWER(phase) NOT IN ('issue', 'feelings', 'why', 'shoes', 'child', 'choose', 'message');

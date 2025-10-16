-- =====================================================
-- Three-Why Recap for Phase 6
-- =====================================================
-- Adding reflective three-why recap at the start of Phase 6
-- to ground users in the relational context before offering options.
--
-- Variables: {parent_why}, {coparent_why}, {child_why}, {child_name}, {coparent_pronoun_cap}

-- Phase 6: Three-Why Recap snippets
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, vars, embedding)
VALUES
('p6_why_recap_1',
 'Your why is wanting your child to feel supported by both parents. Your co-parent''s why is wanting to feel included and capable. Your child''s why is wanting stability and to know you both care. Let''s hold those in mind as we explore small next steps together.',
 'choose', 'why_recap', array['phase6','recap','tone:grounded'], 'Trina', 'approved', '2025-Q4', 1.2, array['parent_why','coparent_why','child_why'], NULL),

('p6_why_recap_2',
 'Your why is wanting {child_name} to feel secure and seen. {coparent_pronoun_cap}''s why is wanting to feel trusted and capable. Your child''s why is wanting both of you to be okay. Let''s keep those in mind as we find the next step.',
 'choose', 'why_recap', array['phase6','recap','tone:warm'], 'Trina', 'approved', '2025-Q4', 1.2, array['child_name','coparent_pronoun_cap'], NULL),

('p6_why_recap_3',
 'You want {child_name} to feel safe and loved by both parents. {coparent_pronoun_cap} wants to feel respected and included. {child_name} wants to know you''re both there. Let''s hold these as we look at what comes next.',
 'choose', 'why_recap', array['phase6','recap','tone:soft'], 'Trina', 'approved', '2025-Q4', 1.2, array['child_name','coparent_pronoun_cap'], NULL),

('p6_why_recap_fallback',
 'You care deeply about your child''s wellbeing. Your co-parent cares about being present and capable. Your child wants to feel secure with both of you. Let''s hold those truths as we explore what might help.',
 'choose', 'why_recap', array['phase6','recap','tone:gentle','fallback'], 'Trina', 'approved', '2025-Q4', 1.0, NULL, NULL);

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Three-why recap snippets added successfully';
  RAISE NOTICE 'Why recap snippet count: %', (
    SELECT COUNT(*) FROM v3_vector.flows
    WHERE kind = 'why_recap'
    AND phase = 'choose'
  );
END $$;

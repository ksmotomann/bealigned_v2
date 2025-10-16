-- =====================================================
-- Phase 6-7: Reflective Co-Creation & CLEAR Messaging
-- =====================================================
-- Teaching v3 to:
-- - Phase 6: Add reflective bridge, confirm each why, offer invitation-style options,
--   tie to three lenses, and re-engage user before advancing
-- - Phase 7: Co-author using user's own language, no generic filler templates
--
-- All teaching via database content + light retrieval scoring.
-- No new logic — behavioral shifts through data.

-- =====================================================
-- Phase 6 Snippets: Reflective Co-Creation
-- =====================================================

-- Reflective bridge before presenting options
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
VALUES
('p6_bridge_1',
 'You''ve named something important. Let''s pause with it for a moment. When you hold that, what kinds of next steps come to mind?',
 'choose', 'bridge', array['phase6','bridge','tone:gentle'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p6_bridge_2',
 'You''ve done hard work to get here. Before we look at paths forward, take a breath. What feels true right now?',
 'choose', 'bridge', array['phase6','bridge','tone:soft'], 'Trina', 'approved', '2025-Q4', 1.0, NULL);

-- Confirmation of each why (short, conversational)
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
VALUES
('p6_confirm_why_1', 'Does that sound true to you?', 'choose', 'confirm_why', array['phase6','confirm'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),
('p6_confirm_why_2', 'Would you tweak that in any way?', 'choose', 'confirm_why', array['phase6','confirm','tone:inviting'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),
('p6_confirm_why_3', 'Does that capture it, or would you say it differently?', 'choose', 'confirm_why', array['phase6','confirm','tone:gentle'], 'Trina', 'approved', '2025-Q4', 1.0, NULL);

-- Two invitation-style options (not directive tasks)
-- Note: {child_name} and {coparent_name} are optional vars - gracefully omit if unavailable
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, vars, embedding)
VALUES
('p6_option_invite_1',
 'One possibility might be creating space for {child_name} to share what respect means to them.',
 'choose', 'option_invite', array['phase6','invite','tone:soft'], 'Trina', 'approved', '2025-Q4', 1.0, array['child_name'], NULL),

('p6_option_invite_2',
 'Another might be helping {coparent_name} hear that without blame.',
 'choose', 'option_invite', array['phase6','invite','tone:soft'], 'Trina', 'approved', '2025-Q4', 1.0, array['coparent_name'], NULL),

('p6_option_invite_3',
 'One path could be opening a conversation about what feels safe and what doesn''t.',
 'choose', 'option_invite', array['phase6','invite','tone:gentle'], 'Trina', 'approved', '2025-Q4', 1.0, NULL, NULL),

('p6_option_invite_4',
 'Another might be naming your own need first, then listening for theirs.',
 'choose', 'option_invite', array['phase6','invite','tone:calm'], 'Trina', 'approved', '2025-Q4', 1.0, NULL, NULL);

-- Tie options back to the three lenses (user's why, coparent's need, child's experience)
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
VALUES
('p6_lens_tie_1',
 'Each of these honors your why, their need, and your child''s need. Do any feel like a place to start—or would you add one of your own?',
 'choose', 'lens_tie', array['phase6','lenses','reengage'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p6_lens_tie_2',
 'These paths hold space for everyone—you, your co-parent, and your child. Which one feels most aligned?',
 'choose', 'lens_tie', array['phase6','lenses'], 'Trina', 'approved', '2025-Q4', 1.0, NULL);

-- Re-engage before closing Phase 6 (invite user input)
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
VALUES
('p6_reengage_1',
 'Which of these feels most aligned right now—or do you see another path?',
 'choose', 'reengage', array['phase6','invite','close-loop'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p6_reengage_2',
 'What feels like the right next step for you?',
 'choose', 'reengage', array['phase6','invite','close-loop'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p6_reengage_3',
 'Which one lands for you—or is there something else calling your attention?',
 'choose', 'reengage', array['phase6','invite','close-loop','tone:gentle'], 'Trina', 'approved', '2025-Q4', 1.0, NULL);

-- =====================================================
-- Phase 7 Snippets: Co-Authored CLEAR Messaging
-- =====================================================

-- Co-author seed: draft using user's own language (no generic filler)
-- Requires user phrases: {why_phrase}, {need_phrase}, {ask_phrase}
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, vars, embedding)
VALUES
('p7_coauthor_seed_1',
 'Here''s a start in your words. Tell me what to keep or change:\n\n"I''m holding {why_phrase}. What I want most is {need_phrase}. What would help is {ask_phrase} for {child_name}."',
 'message', 'coauthor_seed', array['phase7','coauthor','tone:gentle'], 'Trina', 'approved', '2025-Q4', 1.2, array['why_phrase','need_phrase','ask_phrase','child_name'], NULL),

('p7_coauthor_seed_2',
 'Let me try this in your voice:\n\n"What matters to me is {why_phrase}. I''m asking for {ask_phrase} because {need_phrase}."',
 'message', 'coauthor_seed', array['phase7','coauthor','tone:soft'], 'Trina', 'approved', '2025-Q4', 1.0, array['why_phrase','need_phrase','ask_phrase'], NULL),

('p7_coauthor_seed_3',
 'Here''s a draft based on what you''ve shared:\n\n"{why_phrase} is what''s driving this for me. I need {need_phrase}. Can we talk about {ask_phrase}?"',
 'message', 'coauthor_seed', array['phase7','coauthor','tone:calm'], 'Trina', 'approved', '2025-Q4', 1.0, array['why_phrase','need_phrase','ask_phrase'], NULL);

-- CLEAR frame (light scaffolding only, used AFTER seeds exist)
-- Requires: {context_line}, {listener_line}, {empathy_line}, {ask_phrase}, {repair_line}
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, vars, embedding)
VALUES
('p7_clear_frame_1',
 'Does this sound like you? If you''d like it softer or stronger, say the word:\n\nC (Context): {context_line}\nL (Listener-Ready): {listener_line}\nE (Empathy): {empathy_line}\nA (Ask): {ask_phrase}\nR (Repair/Reset): {repair_line}',
 'message', 'clear_frame', array['phase7','clear','fitcheck'], 'Trina', 'approved', '2025-Q4', 0.8, array['context_line','listener_line','empathy_line','ask_phrase','repair_line'], NULL),

('p7_clear_frame_2',
 'Here''s one way to structure it using CLEAR. Let me know what needs adjusting:\n\nContext: {context_line}\nListener-first: {listener_line}\nEmpathy: {empathy_line}\nAsk: {ask_phrase}\nRepair: {repair_line}',
 'message', 'clear_frame', array['phase7','clear','fitcheck'], 'Trina', 'approved', '2025-Q4', 0.8, array['context_line','listener_line','empathy_line','ask_phrase','repair_line'], NULL);

-- Containment close for Phase 7 (always offer pause)
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
VALUES
('p7_contain_1',
 'You don''t have to send this today. Staying aligned with your why is enough for now.',
 'message', 'contain', array['phase7','containment','tone:soft'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p7_contain_2',
 'There''s no rush. You can sit with this, adjust it, or come back to it when it feels right.',
 'message', 'contain', array['phase7','containment','tone:gentle'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p7_contain_3',
 'This is your message. Take the time you need with it.',
 'message', 'contain', array['phase7','containment','tone:calm'], 'Trina', 'approved', '2025-Q4', 1.0, NULL);

-- Prompt for missing user language (when variables unavailable)
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
VALUES
('p7_collect_why',
 'Before we draft anything, what words feel most true to you for why this matters? One short line in your voice.',
 'message', 'collect', array['phase7','collect','tone:inviting'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p7_collect_ask',
 'What would you like to ask for in one short line?',
 'message', 'collect', array['phase7','collect','tone:gentle'], 'Trina', 'approved', '2025-Q4', 1.0, NULL),

('p7_collect_need',
 'What do you need most here? Say it in your own words.',
 'message', 'collect', array['phase7','collect','tone:soft'], 'Trina', 'approved', '2025-Q4', 1.0, NULL);

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Phase 6-7 reflection snippets added successfully';
  RAISE NOTICE 'Phase 6 snippet count: %', (
    SELECT COUNT(*) FROM v3_vector.flows
    WHERE phase = 'choose'
    AND kind IN ('bridge', 'confirm_why', 'option_invite', 'lens_tie', 'reengage')
  );
  RAISE NOTICE 'Phase 7 snippet count: %', (
    SELECT COUNT(*) FROM v3_vector.flows
    WHERE phase = 'message'
    AND kind IN ('coauthor_seed', 'clear_frame', 'contain', 'collect')
  );
  RAISE NOTICE 'Breakdown by kind: %', (
    SELECT json_object_agg(kind, cnt)
    FROM (
      SELECT kind, COUNT(*) as cnt
      FROM v3_vector.flows
      WHERE phase IN ('choose', 'message')
      AND kind IS NOT NULL
      GROUP BY kind
    ) sub
  );
END $$;

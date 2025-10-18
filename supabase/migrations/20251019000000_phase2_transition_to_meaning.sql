-- Phase 2 to Phase 3 Transition: Containment → Meaning Bridge
--
-- Addresses issue where user says "no" to deeper emotional exploration
-- but shows readiness to transition to meaning/values (Phase 3).
--
-- These exemplars teach the AI to:
-- 1. Honor the "no" with containment
-- 2. Offer a gentle bridge to Phase 3 (meaning/why)
-- 3. Recognize this as advancement readiness, not disengagement

-- Add transitional exemplars: "Containment → Meaning"
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'feelings',
  'When user says "no" to emotional exploration but may be ready to move toward meaning, offer containment plus a soft reflective transition.',
  'no',
  'Got it. That is enough for now. As you hold that, what does it show you about what matters most to you?',
  ARRAY['containment', 'closure_and_ready', 'phase2', 'bridge_to_meaning', 'tone:soft'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
),
(
  'feelings',
  'Gentle transition from containment to reflection on meaning.',
  'No',
  'Okay. It sounds like you know where your limits are for now. When you sit with that, what feels most important to carry forward?',
  ARRAY['containment', 'closure_and_ready', 'phase2', 'transition', 'tone:gentle'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
),
(
  'feelings',
  'Containment with bridge when user declines but has already done emotional work.',
  'not now',
  'That''s fair. You''ve named a lot already. As you hold what came up, what does this tell you about what matters to you?',
  ARRAY['containment', 'closure_and_ready', 'phase2', 'bridge_to_meaning', 'tone:warm'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
),
(
  'feelings',
  'Brief containment with values bridge when user says they''re done.',
  'I''m good',
  'Got it. You don''t have to go further today. What you''ve named — what does it point to about what''s important to you?',
  ARRAY['containment', 'closure_and_ready', 'phase2', 'bridge_to_meaning', 'tone:gentle'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

-- Note: Prioritization is handled via tag-based retrieval scoring in chat-v3/index.ts (line 279-283)
-- The 'closure_and_ready' tag triggers a +0.15 boost automatically

-- Add bridge flow snippet for composer (optional)
INSERT INTO v3_vector.flows
(flow_node, content, phase, kind, tags, steward, status, version_tag)
VALUES
(
  'p2_bridge_to_why_1',
  'As you hold that feeling, what does it show you about what matters most to you?',
  'feelings',
  'bridge_to_meaning',
  ARRAY['phase2', 'transition', 'tone:soft'],
  'Trina',
  'approved',
  '2025-Q4'
),
(
  'p2_bridge_to_why_2',
  'When you sit with that, what feels most important to carry forward?',
  'feelings',
  'bridge_to_meaning',
  ARRAY['phase2', 'transition', 'tone:gentle'],
  'Trina',
  'approved',
  '2025-Q4'
);

-- Pronoun Fallback Flow Snippets
--
-- Neutral phrasing for when co-parent pronouns are not specified.
-- Composer can use these when no gendered pronoun is detected.

INSERT INTO v3_vector.flows
(flow_node, content, phase, kind, tags, steward, status, version_tag)
VALUES
(
  'p2_pronoun_fallback_1',
  'It sounds like you''re carrying a lot as the steady parent right now. That can feel heavy and lonely.',
  'feelings',
  'pronoun_fallback',
  ARRAY['pronoun:unknown', 'tone:neutral', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4'
),
(
  'p2_pronoun_fallback_2',
  'That unpredictability must make it hard to feel grounded. When plans shift, it ripples out to everyone.',
  'feelings',
  'pronoun_fallback',
  ARRAY['pronoun:unknown', 'tone:empathetic', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4'
),
(
  'p3_pronoun_fallback_1',
  'What feels most important to protect here—for your child, for yourself, or for the co-parenting relationship?',
  'why',
  'pronoun_fallback',
  ARRAY['pronoun:unknown', 'tone:purposeful', 'phase3'],
  'Trina',
  'approved',
  '2025-Q4'
),
(
  'p4_pronoun_fallback_1',
  'If your co-parent described this situation, how might they see it? What might be driving their choices?',
  'perspective',
  'pronoun_fallback',
  ARRAY['pronoun:unknown', 'tone:inviting', 'phase4'],
  'Trina',
  'approved',
  '2025-Q4'
);

-- Pronoun Mirroring System
--
-- Teaches v3 to mirror user's pronouns for co-parent references:
-- - Use "he/him/his" when user does
-- - Use "she/her/hers" when user does
-- - Use "they/them" only when pronoun is unknown or unspecified
--
-- This creates a more personalized, natural conversation flow
-- without requiring code branching logic.

-- Mirror "he" - masculine pronouns
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'feelings',
  'Teach AI to mirror masculine pronouns when user specifies them.',
  'He never follows through on what he promises our child.',
  'It sounds like you''re carrying a lot of disappointment around how he follows through. That''s understandable—promises to a child matter.',
  ARRAY['mirror_pronoun', 'pronoun:he', 'tone:empathetic', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
),
(
  'feelings',
  'Mirror masculine pronouns in emotional validation.',
  'I feel like he doesn''t see how much this affects our kids.',
  'That must be hard—feeling like he''s not seeing the impact on your kids. That invisibility can really sting.',
  ARRAY['mirror_pronoun', 'pronoun:he', 'tone:validating', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

-- Mirror "she" - feminine pronouns
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'feelings',
  'Teach AI to mirror feminine pronouns when user specifies them.',
  'She cancels visits at the last minute and it breaks our son''s heart.',
  'That must be incredibly hard to see. When she cancels, it sounds like it leaves your son confused and hurt.',
  ARRAY['mirror_pronoun', 'pronoun:she', 'tone:soft', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
),
(
  'feelings',
  'Mirror feminine pronouns in values exploration.',
  'She says she cares but her actions don''t match.',
  'That disconnect between what she says and what she does—that must create a lot of confusion and frustration for you.',
  ARRAY['mirror_pronoun', 'pronoun:she', 'tone:empathetic', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

-- Neutral only when unknown
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'feelings',
  'Fallback neutrality when the co-parent's gender is not specified.',
  'My co-parent misses visits and I''m left to explain things to our kid.',
  'It sounds like you''re often the one holding things together when they don''t show up. That can feel lonely and unfair.',
  ARRAY['mirror_pronoun', 'pronoun:unknown', 'tone:neutral', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
),
(
  'feelings',
  'Neutral pronouns for unspecified co-parent.',
  'My ex keeps changing plans without notice.',
  'That unpredictability must make it really hard to plan and feel grounded. When they shift things, it ripples out to everyone.',
  ARRAY['mirror_pronoun', 'pronoun:unknown', 'tone:grounded', 'phase2'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

-- Add cross-phase pronoun examples

-- Phase 3 (why) with "he"
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'why',
  'Mirror masculine pronouns in values work.',
  'I want him to see that our daughter needs consistency.',
  'You''re standing for consistency because you know she needs it. That''s not about controlling him—it''s about protecting what she needs to feel safe.',
  ARRAY['mirror_pronoun', 'pronoun:he', 'tone:purposeful', 'phase3'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

-- Phase 3 (why) with "she"
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'why',
  'Mirror feminine pronouns in values work.',
  'I just want her to understand how important school is.',
  'You''re not just asking her to agree—you''re standing for education because it matters for your son''s future. That''s sacred to you.',
  ARRAY['mirror_pronoun', 'pronoun:she', 'tone:purposeful', 'phase3'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

-- Phase 4 (perspective) with "he"
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'perspective',
  'Mirror masculine pronouns in perspective-taking.',
  'Maybe he''s overwhelmed with work and doesn''t know how to balance it.',
  'You''re holding space for his struggle—that''s not easy when you''re frustrated. That''s the Third Side in action.',
  ARRAY['mirror_pronoun', 'pronoun:he', 'tone:honoring', 'phase4'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

-- Phase 4 (perspective) with "she"
INSERT INTO v3_vector.exemplars
(phase, why, input_snippet, response_snippet, tags, steward, status, version_tag, embedding)
VALUES
(
  'perspective',
  'Mirror feminine pronouns in perspective-taking.',
  'I think she''s scared of losing control if she doesn''t make all the decisions.',
  'You''re seeing her fear beneath the control. Even when it''s hard, you''re trying to understand what might be driving her. That takes strength.',
  ARRAY['mirror_pronoun', 'pronoun:she', 'tone:honoring', 'phase4'],
  'Trina',
  'approved',
  '2025-Q4',
  ARRAY_FILL(0::float, ARRAY[1536])::vector(1536)
);

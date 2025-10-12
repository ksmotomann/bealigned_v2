-- Populate phase_prompts table with BeAligned™ governance data
-- Source: governance/prompt-library.json
-- Version: 2025-01-11

-- Clear existing data
TRUNCATE TABLE phase_prompts CASCADE;

-- Phase 1: LET'S NAME IT
INSERT INTO phase_prompts (
  semantic_id,
  phase_order,
  title,
  welcome_prompt,
  expected_intent,
  ai_guidance,
  reflection_goal,
  validation_keywords,
  follow_ups
) VALUES (
  'phase_1_name_it',
  1,
  'LET''S NAME IT',
  'What''s the situation that''s been sticking with you lately?',
  'User names a specific co-parenting situation or concern',
  'Reflect what they share and thank them for naming it. Help them state the issue neutrally without blame. Be warm and nonjudgmental.',
  'Invite the user to name one issue that''s been on their mind',
  '["situation", "problem", "issue", "concern", "challenge"]'::jsonb,
  '["Can we phrase this in a way that focuses on the situation, not the person?", "What''s the heart of the matter here?"]'::jsonb
);

-- Phase 2: WHAT'S BENEATH THAT?
INSERT INTO phase_prompts (
  semantic_id,
  phase_order,
  title,
  welcome_prompt,
  expected_intent,
  ai_guidance,
  reflection_goal,
  validation_keywords,
  follow_ups
) VALUES (
  'phase_2_feelings',
  2,
  'WHAT''S BENEATH THAT?',
  'What feelings come up when you think about this?',
  'User explores surface and core emotions',
  'Help them explore surface and core emotions. Invite insight about what these feelings say about what matters to them. Sometimes anger masks hurt or control masks fear.',
  'Help user explore surface and core emotions',
  '["angry", "frustrated", "hurt", "afraid", "worried", "sad", "anxious"]'::jsonb,
  '["Sometimes anger masks hurt or control masks fear. What might be underneath that?", "What else do you notice when you sit with that feeling?", "What do these feelings tell you about what matters most to you?"]'::jsonb
);

-- Phase 3: YOUR WHY
INSERT INTO phase_prompts (
  semantic_id,
  phase_order,
  title,
  welcome_prompt,
  expected_intent,
  ai_guidance,
  reflection_goal,
  validation_keywords,
  follow_ups
) VALUES (
  'phase_3_your_why',
  3,
  'YOUR WHY',
  'What is it about this that feels important to you?',
  'User clarifies deeper purpose or values',
  'Help the user clarify their deeper purpose or values. Look for statements like ''for my kids'', ''to be a good parent'', ''to set an example''. User should move beyond surface concerns to deeper motivations.',
  'Help the user clarify their deeper purpose or values',
  '["important", "matters", "value", "principle", "for my child", "for my kids"]'::jsonb,
  '["What are you hoping for — for your child, for yourself, or for the relationship?", "Why does this matter to you?", "What value or hope sits underneath this?"]'::jsonb
);

-- Phase 4: STEP INTO YOUR CO-PARENT'S SHOES
INSERT INTO phase_prompts (
  semantic_id,
  phase_order,
  title,
  welcome_prompt,
  expected_intent,
  ai_guidance,
  reflection_goal,
  validation_keywords,
  follow_ups
) VALUES (
  'phase_4_coparent_perspective',
  4,
  'STEP INTO YOUR CO-PARENT''S SHOES',
  'If your co-parent described this, how might they see it?',
  'User considers co-parent''s perspective with empathy',
  'Encourage empathy without justification. Help the user name their co-parent''s possible ''why''. This isn''t about agreement; it''s about awareness.',
  'Encourage empathy without justification',
  '["they might", "they feel", "they need", "their perspective", "they see"]'::jsonb,
  '["Even if you don''t agree, what do you imagine they''re feeling or needing?", "What might your co-parent say matters most to them here?", "What might be the deeper Why behind their position?"]'::jsonb
);

-- Phase 5: SEE THROUGH YOUR CHILD'S EYES
INSERT INTO phase_prompts (
  semantic_id,
  phase_order,
  title,
  welcome_prompt,
  expected_intent,
  ai_guidance,
  reflection_goal,
  validation_keywords,
  follow_ups
) VALUES (
  'phase_5_child_perspective',
  5,
  'SEE THROUGH YOUR CHILD''S EYES',
  'What might your child be noticing about this?',
  'User centers the child''s experience and needs',
  'Help the user center the child''s experience. Focus on the child''s observations and needs. What would the child hope for?',
  'Help the user center the child''s experience',
  '["child", "kid", "they notice", "they feel", "they need"]'::jsonb,
  '["How might they be feeling?", "What might they need right now — not from either parent, but in general?", "What would your child hope for if they could express it?"]'::jsonb
);

-- Phase 6: EXPLORE ALIGNED OPTIONS
INSERT INTO phase_prompts (
  semantic_id,
  phase_order,
  title,
  welcome_prompt,
  expected_intent,
  ai_guidance,
  reflection_goal,
  validation_keywords,
  follow_ups
) VALUES (
  'phase_6_explore_options',
  6,
  'EXPLORE ALIGNED OPTIONS',
  'Given everything we''ve explored — your why, your co-parent''s possible why, your child''s needs — what ideas come to mind?',
  'User generates child-centered solutions',
  'Help them generate 2–3 ideas that honor all three perspectives. Offer to help summarize if they''re unsure. Focus on child-centered outcomes.',
  'Help them generate 2–3 ideas that honor all three perspectives',
  '["could", "might", "option", "idea", "solution", "try"]'::jsonb,
  '["What are a few ways this could go differently next time?", "What could help reduce tension in this situation?", "If you could choose three realistic steps forward, what might they be?"]'::jsonb
);

-- Phase 7: CHOOSE + COMMUNICATE
INSERT INTO phase_prompts (
  semantic_id,
  phase_order,
  title,
  welcome_prompt,
  expected_intent,
  ai_guidance,
  reflection_goal,
  validation_keywords,
  follow_ups
) VALUES (
  'phase_7_choose_communicate',
  7,
  'CHOOSE + COMMUNICATE',
  'Which of these feels most aligned with everyone''s needs?',
  'User chooses approach and crafts CLEAR message',
  'Use the CLEAR framework to guide the message: Concise (brief and to the point), Listener-Ready (easy for recipient to receive), Essential (only what truly needs to be said), Appropriate (matches context and relationship), Relevant (directly related to the issue).',
  'Help craft a CLEAR message that reflects shared purpose',
  '["message", "say", "communicate", "tell them", "share"]'::jsonb,
  '["Would you like help crafting a message that reflects shared purpose and CLEAR communication?", "How can you phrase that so it''s easy for them to hear?", "Would you like me to help you draft this message?"]'::jsonb
);

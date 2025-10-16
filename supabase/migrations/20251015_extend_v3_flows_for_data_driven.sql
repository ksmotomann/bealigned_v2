-- =====================================================
-- Extend v3_vector.flows for Data-Driven Behavior
-- =====================================================
-- This migration adds columns to store typed flow snippets
-- (acks, bridges, containment, nudges, prompts) with weights
-- and variable placeholders, shifting behavior from code to data.

-- Step 1: Make embedding nullable (required since NOT NULL constraint exists)
ALTER TABLE v3_vector.flows
  ALTER COLUMN embedding DROP NOT NULL;

-- Step 2: Add new columns to flows table
ALTER TABLE v3_vector.flows
  ADD COLUMN IF NOT EXISTS kind text,           -- 'ack' | 'bridge' | 'contain' | 'nudge' | 'prompt'
  ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS vars text[] DEFAULT '{}';  -- e.g., ['value','feeling','childName']

-- Add helpful indexes
create index if not exists idx_v3_flows_kind on v3_vector.flows(kind);
create index if not exists idx_v3_flows_phase_kind on v3_vector.flows(phase, kind);
create index if not exists idx_v3_flows_status_kind on v3_vector.flows(status, kind) where status = 'approved';

-- Add comments for documentation
comment on column v3_vector.flows.kind is 'Type of flow snippet: ack, bridge, contain, nudge, prompt';
comment on column v3_vector.flows.weight is 'Boost weight for scoring (higher = more likely to be selected)';
comment on column v3_vector.flows.vars is 'Variable placeholders in content (e.g., {value}, {feeling}, {childName})';

-- =====================================================
-- Seed Initial Flow Snippets
-- =====================================================

-- Seed snippets wrapped in conditional block to prevent duplicates
do $$
begin
  -- Only seed if we haven't already
  if not exists (select 1 from v3_vector.flows where flow_node = 'ack_care') then

    -- Phase 1 (Issue) - Acknowledgments
    insert into v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
    values
    ('ack_care', 'I can hear how much you care.', 'issue', 'ack', array['tone','warmth'], 'Trina', 'approved', '2025-Q1', 1.0, NULL),
    ('ack_brought', 'Thanks for bringing this here.', 'issue', 'ack', array['tone','warmth'], 'Trina', 'approved', '2025-Q1', 1.0, NULL),
    ('ack_pause', 'You are already doing something important by pausing with it.', 'issue', 'ack', array['tone','warmth'], 'Trina', 'approved', '2025-Q1', 1.0, NULL),
    ('ack_showed', 'You showed up. That matters.', 'issue', 'ack', array['tone','warmth'], 'Trina', 'approved', '2025-Q1', 0.8, NULL);

    -- Phase 1 → Phase 2 Bridges
    insert into v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
    values
    ('bridge_lands', 'You named what matters. Before we go deeper, notice how that lands.', 'issue', 'bridge', array['phase_transition','feelings'], 'Trina', 'approved', '2025-Q1', 1.2, NULL),
    ('bridge_feeling', 'You care a lot here. When you hold that, what feeling shows up?', 'issue', 'bridge', array['phase_transition','feelings'], 'Trina', 'approved', '2025-Q1', 1.0, NULL),
    ('bridge_slow', 'Let us slow down for a moment. As you sit with that, what feeling is present?', 'issue', 'bridge', array['phase_transition','feelings'], 'Trina', 'approved', '2025-Q1', 1.0, NULL);

    -- Phase 1 - Containment (when user signals closure)
    insert into v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
    values
    ('contain_enough', 'That is enough for now. Naming it matters.', 'issue', 'contain', array['containment','closure'], 'Trina', 'approved', '2025-Q1', 1.0, NULL),
    ('contain_holding', 'You are holding a lot right now. Just naming it is meaningful.', 'issue', 'contain', array['containment','closure'], 'Trina', 'approved', '2025-Q1', 1.0, NULL),
    ('contain_clear', 'You have made this clear. That clarity itself is powerful.', 'issue', 'contain', array['containment','closure'], 'Trina', 'approved', '2025-Q1', 1.0, NULL);

    -- Phase 2 (Feelings) - Child-Impact Nudge
    insert into v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, vars, embedding)
    values
    ('nudge_child_energy', 'As you notice that feeling, how might that energy show up for {childName}?', 'feelings', 'nudge', array['child_impact','gentle'], 'Trina', 'approved', '2025-Q1', 1.0, array['childName'], NULL),
    ('nudge_child_see', 'When you are feeling this way, what might {childName} be noticing?', 'feelings', 'nudge', array['child_impact','gentle'], 'Trina', 'approved', '2025-Q1', 1.0, array['childName'], NULL),
    ('nudge_child_impact', 'How do you imagine this feeling might touch your relationship with {childName}?', 'feelings', 'nudge', array['child_impact','gentle'], 'Trina', 'approved', '2025-Q1', 0.9, array['childName'], NULL);

    -- Phase 2 (Feelings) - Gentle Depth Prompts
    insert into v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
    values
    ('prompt_beneath', 'Sometimes when we feel unseen, there is sadness or worry underneath. What else might be present?', 'feelings', 'prompt', array['depth','gentle'], 'Trina', 'approved', '2025-Q1', 1.0, NULL),
    ('prompt_layers', 'Anger often covers hurt, control can mask fear. What is beneath this for you?', 'feelings', 'prompt', array['depth','gentle'], 'Trina', 'approved', '2025-Q1', 1.0, NULL);

    -- Default fallback prompts for each phase
    insert into v3_vector.flows (flow_node, content, phase, kind, tags, steward, status, version_tag, weight, embedding)
    values
    ('default_prompt_issue', 'Tell me more about what is sticking with you.', 'issue', 'prompt', array['default','fallback'], 'system', 'approved', '2025-Q1', 0.5, NULL),
    ('default_prompt_feelings', 'What feelings are present as you sit with this?', 'feelings', 'prompt', array['default','fallback'], 'system', 'approved', '2025-Q1', 0.5, NULL),
    ('default_prompt_why', 'What feels most important to you about this?', 'why', 'prompt', array['default','fallback'], 'system', 'approved', '2025-Q1', 0.5, NULL),
    ('default_prompt_perspective', 'How might your co-parent see this situation?', 'perspective', 'prompt', array['default','fallback'], 'system', 'approved', '2025-Q1', 0.5, NULL),
    ('default_prompt_options', 'What options feel aligned with everyone''s needs?', 'options', 'prompt', array['default','fallback'], 'system', 'approved', '2025-Q1', 0.5, NULL),
    ('default_prompt_choose', 'Which path feels right for you?', 'choose', 'prompt', array['default','fallback'], 'system', 'approved', '2025-Q1', 0.5, NULL),
    ('default_prompt_message', 'Let us work together to express what you want to communicate.', 'message', 'prompt', array['default','fallback'], 'system', 'approved', '2025-Q1', 0.5, NULL);

    raise notice 'Flow snippets seeded successfully';
  else
    raise notice 'Flow snippets already exist - skipping seed';
  end if;
end $$;

-- =====================================================
-- Verification
-- =====================================================

do $$
begin
  raise notice 'v3_vector.flows extended successfully';
  raise notice 'Flow snippets seeded: %', (
    select count(*) from v3_vector.flows where kind is not null
  );
  raise notice 'Breakdown by kind: %', (
    select json_object_agg(kind, cnt)
    from (
      select kind, count(*) as cnt
      from v3_vector.flows
      where kind is not null
      group by kind
    ) sub
  );
end $$;

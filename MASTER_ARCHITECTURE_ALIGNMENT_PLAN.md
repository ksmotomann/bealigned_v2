# Master Architecture Alignment Plan

## Executive Summary

**Current State:** Our app uses simplified, rule-based phase progression that doesn't match the master architecture.

**Target State:** Implement the full BeAligned™ Flow Engine as defined in `assets/master/` files.

**Key Gap:** We're trying to code conversation flow with rules, when we should implement the readiness-based, nonlinear flow system from the master architecture.

---

## Gap Analysis

### What We Have Now (Problematic)

**Current Implementation:**
```typescript
// ❌ Linear phase progression only
current_phase: 1 → 2 → 3 → 4 → 5 → 6 → 7

// ❌ Simple JSON response
{
  "reply": "...",
  "phase_status": "completed" | "in_progress",
  "current_phase": N,
  "next_phase": N+1
}

// ❌ One template per phase with prescriptive rules
"ALWAYS ask a follow-up question"
"Do NOT repeat the opening question"

// ❌ No readiness tracking
// ❌ No conversation context beyond phase number
// ❌ One opening question per phase
```

**Problems This Causes:**
1. Stalling - Phase completes too early without depth
2. Looping - AI repeats questions because it can't go deeper within phase
3. Unnatural flow - Forced linear progression
4. No conversation memory - Each response starts fresh

### What Master Architecture Defines (Correct)

**From `assets/master/governance.md` and `prompt_library.md`:**

```typescript
// ✅ Nonlinear, readiness-based flow
interface FlowState {
  id: string;
  userId: string;
  currentPhase: FlowPhase;
  context: {
    issue?: string;
    feelings?: string;
    why?: string;
    perspective?: string;
    options?: string[];
    chosenOption?: string;
  };
  readiness: number;              // 0–1 clarity/confidence level
  lastPrompt: string;             // Last AI question
  lastResponse: string;           // User's response
  nextPrompt?: string;            // AI's next question
}

// ✅ AI returns structured reflection
{
  "summary": "...",               // Distills user's response
  "next_prompt": "...",           // Next question to ask
  "readiness": 0.65,              // 0-1 score
  "suggested_next_phase": "feelings" | null
}

// ✅ Phase advancement logic
if (readiness < 0.7) {
  // Stay in current phase, use re-prompt
  selectPrompt(phase, "reprompt")
} else if (readiness >= 0.7) {
  // Advance to next phase or suggested phase
  advance(suggested_next_phase || nextSequentialPhase)
}

// ✅ Prompt Library with variations
{
  "feelings": {
    "primary": [
      "What emotions come up for you when this happens?",
      "How do you feel in those moments?",
      "What emotion feels strongest right now?"
    ],
    "reprompt": [
      "What do you think that feeling is trying to tell you?",
      "If your child were watching, what would they notice?"
    ]
  }
}
```

**Benefits:**
1. **Natural conversation flow** - Can loop within phase until genuine clarity
2. **Depth before progression** - Readiness score ensures meaningful engagement
3. **Conversation memory** - Context accumulates (issue, feelings, why, etc.)
4. **Flexible prompting** - Multiple prompts per phase, selected contextually

---

## Implementation Plan

### Phase 1: Database Schema Updates

**Add to `reflection_sessions` table:**
```sql
ALTER TABLE reflection_sessions ADD COLUMN IF NOT EXISTS flow_state JSONB;

-- Structure:
{
  "readiness": 0.0,
  "context": {
    "issue": null,
    "feelings": null,
    "why": null,
    "perspective": null,
    "options": null,
    "chosenOption": null
  },
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}
```

**Create `prompt_library` table:**
```sql
CREATE TABLE prompt_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase TEXT NOT NULL,
  prompt_type TEXT NOT NULL, -- 'primary' | 'reprompt' | 'transition'
  prompt_text TEXT NOT NULL,
  coaching_mindset TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with prompts from assets/master/prompt_library.md
```

### Phase 2: Edge Function Refactor

**New Response Structure:**
```typescript
// supabase/functions/chat/index.ts

interface AIReflectionResponse {
  summary: string;           // Distills user's response
  next_prompt: string;       // Next question to ask
  readiness: number;         // 0-1 clarity score
  suggested_next_phase?: string;  // Or null to stay
  context_updates: {         // Update to FlowState.context
    issue?: string;
    feelings?: string;
    why?: string;
    // etc.
  };
}
```

**New System Prompt Structure:**
```typescript
const systemPrompt = `
${GOVERNANCE}

---

CURRENT FLOW STATE:
Phase: ${currentPhase}
Readiness: ${flowState.readiness}
Context So Far:
${formatContext(flowState.context)}

---

${PHASE_GUIDANCE[currentPhase]}

---

USER INPUT: ${userInput}

---

RESPONSE FORMAT:
Return JSON with:
{
  "summary": "Brief distillation of what user shared",
  "next_prompt": "Your next reflective question",
  "readiness": 0.0-1.0,
  "suggested_next_phase": "phase_name" or null,
  "context_updates": {
    "feelings": "hurt, frustrated, unseen"
  }
}

READINESS SCORING:
- < 0.3: User is vague, defensive, or unclear
- 0.3-0.6: User is engaged but needs deeper exploration
- 0.7-0.8: User has genuine clarity, ready to advance
- 0.9+: User has profound insight

If readiness < 0.7: Stay in current phase, ask clarifying/deepening question
If readiness >= 0.7: Advance to next phase or suggest phase
`
```

### Phase 3: Prompt Library Implementation

**Load prompts dynamically:**
```typescript
// supabase/functions/chat/prompts.ts

export async function selectPrompt(
  phase: string,
  promptType: 'primary' | 'reprompt',
  supabase: SupabaseClient
): Promise<string> {
  const { data: prompts } = await supabase
    .from('prompt_library')
    .select('prompt_text')
    .eq('phase', phase)
    .eq('prompt_type', promptType)

  // Return random prompt from library
  return prompts[Math.floor(Math.random() * prompts.length)].prompt_text
}
```

### Phase 4: Frontend Updates

**Update chat handler:**
```typescript
// lib/chat.ts or similar

async function handleUserMessage(message: string, sessionId: string) {
  // Get current flow state
  const { data: session } = await supabase
    .from('reflection_sessions')
    .select('current_phase, flow_state')
    .eq('id', sessionId)
    .single()

  // Call edge function
  const response = await supabase.functions.invoke('chat', {
    body: {
      userInput: message,
      currentPhase: session.current_phase,
      flowState: session.flow_state,
      sessionId
    }
  })

  const { summary, next_prompt, readiness, suggested_next_phase, context_updates } = response.data

  // Update flow state
  const updatedFlowState = {
    ...session.flow_state,
    readiness,
    lastPrompt: next_prompt,
    lastResponse: message,
    context: {
      ...session.flow_state.context,
      ...context_updates
    }
  }

  // Determine next phase
  let nextPhase = session.current_phase
  if (readiness >= 0.7 && suggested_next_phase) {
    nextPhase = suggested_next_phase
  }

  // Save to database
  await supabase
    .from('reflection_sessions')
    .update({
      current_phase: nextPhase,
      flow_state: updatedFlowState
    })
    .eq('id', sessionId)

  // Return to UI
  return {
    message: next_prompt,
    phase: nextPhase,
    readiness,
    phaseAdvanced: nextPhase !== session.current_phase
  }
}
```

### Phase 5: Governance Simplification

**Remove prescriptive rules, use principles + examples:**

```typescript
// supabase/functions/chat/prompts.ts

const PHASE_GUIDANCE = {
  feelings: `
## Phase 2: What's Beneath That?

**Goal:** Surface emotions underlying the situation to reduce reactivity.

**Coaching Mindset:** "When we can name what we feel, we can choose how to heal."

**Approach:**
- Ask about emotions naturally
- Offer helpful framing: "Sometimes anger masks hurt, control masks fear"
- Name patterns you notice
- Listen for emotional depth

**Examples of natural questions:**
- "What emotions come up for you when this happens?"
- "If your emotion could speak, what would it say?"
- "What do you think that feeling is trying to tell you?"

**Readiness Indicators:**
- 0.7+: User expresses clear emotion, tone stabilizes
- < 0.7: User stays surface-level, defensive, or vague

**DO NOT:**
- Use prescriptive rules like "ALWAYS ask X"
- Tell AI exactly what to say
- Force specific patterns

Let conversational intelligence emerge naturally.
`,
  // ... other phases
}
```

---

## Migration Strategy

### Option A: Incremental (Recommended)

**Week 1: Foundation**
1. Add `flow_state` JSONB column to `reflection_sessions`
2. Create `prompt_library` table
3. Seed prompts from master files

**Week 2: Edge Function**
4. Update edge function response format
5. Implement readiness scoring
6. Add context accumulation

**Week 3: Frontend**
7. Update frontend to handle new response structure
8. Add readiness display (optional)
9. Test phase looping

**Week 4: Testing & Refinement**
10. Test against GPT gold standard samples
11. Adjust readiness thresholds
12. Refine prompt selection logic

### Option B: Complete Rebuild

Build new `chat-v2` edge function alongside existing, then swap when ready.

---

## Success Criteria

**The app will be aligned with master architecture when:**

✅ Conversations can loop within phases until readiness ≥ 0.7
✅ AI accumulates context (issue, feelings, why, perspective, etc.)
✅ Multiple prompts available per phase, selected contextually
✅ Readiness score drives progression, not rigid rules
✅ Responses match GPT gold standard in depth and flow
✅ Phase transitions feel natural, not forced

---

## Risk Mitigation

**Risk:** Breaking existing conversations during migration
**Mitigation:**
- Keep old system running alongside
- Migrate new sessions to new system
- Gradual rollout with feature flag

**Risk:** Readiness scoring inconsistent
**Mitigation:**
- Test extensively with GPT samples
- Adjust thresholds based on data
- Allow manual override in development

**Risk:** Performance impact of additional DB queries
**Mitigation:**
- Cache prompt library in edge function
- Use JSONB efficiently for flow_state
- Monitor edge function execution time

---

## Next Steps

1. **Review this plan** - Get approval before implementation
2. **Start with Phase 1** - Database schema updates
3. **Build prototype** - Test readiness scoring with one phase
4. **Iterate** - Refine based on testing against GPT samples

**This is a significant architectural change. We should discuss priorities and timeline before proceeding.**

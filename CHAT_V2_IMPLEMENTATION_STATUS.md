# Chat-v2 Implementation Status

## ✅ Completed Components

### 1. **Edge Function Structure** (`supabase/functions/chat-v2/`)
Created complete new architecture aligned with master files from `assets/master/`.

**Files Created:**
- ✅ `types.ts` - TypeScript interfaces for FlowState, FlowPhase, AIReflectionResponse
- ✅ `prompt-library.ts` - Extracted prompts from master files with primary/reprompt variations
- ✅ `governance.ts` - System prompt builder using full BeH2O® governance
- ✅ `index.ts` - Main edge function handler with readiness scoring

### 2. **Key Features Implemented**

✅ **Readiness Scoring System**
```typescript
// AI returns 0-1 score
{
  "readiness": 0.65,
  "suggested_next_phase": "feelings" | null
}

// Logic
if (readiness >= 0.7) advance()
else stayInPhase()
```

✅ **Nonlinear Flow**
- Can loop within phases until ready
- AI suggests when to advance
- Falls back to sequential if no suggestion

✅ **FlowState Tracking**
```typescript
interface FlowState {
  readiness: number
  context: { issue, feelings, why, perspective, options, chosenOption }
  lastPrompt: string
  lastResponse: string
  conversationHistory: array
}
```

✅ **Prompt Library**
- Multiple prompts per phase (5-7 variations)
- Primary prompts for initial questions
- Re-prompts for deeper exploration
- Transition prompts between phases

✅ **Master Architecture Compliance**
- Based on `assets/master/governance.md`
- Uses `assets/master/prompt_library.md`
- Follows `assets/master/BeAligned_Lite_Revised_GPT_Instructions.txt`

### 3. **Database Migration**

Created migration file: `supabase/migrations/20251012_add_flow_state_to_sessions.sql`

**SQL to run in Supabase Dashboard:**
```sql
-- Add flow_state column
ALTER TABLE reflection_sessions ADD COLUMN IF NOT EXISTS flow_state JSONB DEFAULT '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb;

-- Initialize existing rows
UPDATE reflection_sessions
SET flow_state = '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb
WHERE flow_state IS NULL;
```

---

## 🚧 Remaining Tasks

### 4. **Deploy Edge Function** ✅ COMPLETED

```bash
npx supabase functions deploy chat-v2
```

**Status**: Deployed successfully on 2025-10-12
- Fixed schema mismatch (`current_step` vs `current_phase`)
- All 4 files uploaded (index.ts, types.ts, governance.ts, prompt-library.ts)

### 5. **Run Database Migration** ⚠️ REQUIRES MANUAL ACTION

**The Supabase client cannot run DDL (ALTER TABLE) commands via CLI.**

**Action Required**: Please run the following SQL manually in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/oohrdabehxzzwdmpmcfv/editor
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste and run this SQL:

```sql
-- Add flow_state column
ALTER TABLE reflection_sessions ADD COLUMN IF NOT EXISTS flow_state JSONB DEFAULT '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb;

-- Add comment
COMMENT ON COLUMN reflection_sessions.flow_state IS 'Flow Engine v2 state: {readiness: number, context: {issue, feelings, why, perspective, options, chosenOption}, lastPrompt: string, lastResponse: string, conversationHistory: array}';

-- Create index
CREATE INDEX IF NOT EXISTS idx_sessions_flow_readiness ON reflection_sessions ((flow_state->>'readiness'));

-- Initialize existing rows
UPDATE reflection_sessions
SET flow_state = '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb
WHERE flow_state IS NULL;
```

**Current Schema**: `reflection_sessions` table has these columns:
- id, owner_id, title, status, current_step, step_data, created_at, updated_at, completed_at, phase_followup_index
- **Missing**: `flow_state` (needs to be added)

### 6. **Frontend Handler** (30 min)

Need to create wrapper function that calls `chat-v2` instead of `chat`.

**Location:** `lib/chat-v2.ts` (new file)

```typescript
export async function sendMessageV2(
  message: string,
  sessionId: string
) {
  // Get current session with flow_state
  const session = await getSession(sessionId)

  // Call chat-v2 edge function
  const response = await supabase.functions.invoke('chat-v2', {
    body: {
      userInput: message,
      currentPhase: getPhaseNameFromNumber(session.current_phase),
      flowState: session.flow_state,
      sessionId
    }
  })

  // Handle response
  return {
    content: response.data.content,
    readiness: response.data.readiness,
    phaseAdvanced: response.data.phase_advanced
  }
}
```

### 7. **Feature Flag** (10 min)

Add environment variable to switch between chat and chat-v2:

**.env:**
```
EXPO_PUBLIC_USE_CHAT_V2=false  # Set to true when ready
```

**Usage in app:**
```typescript
const chatFunction = process.env.EXPO_PUBLIC_USE_CHAT_V2 === 'true'
  ? sendMessageV2
  : sendMessage
```

### 8. **Testing Against GPT Samples** (1-2 hours)

Use test conversation from `public/assets/BeAligned_GPT_Reflection_Sampling_20250913.md`

Test script: Compare chat-v2 responses to GPT gold standard:
- Does it loop when user is vague?
- Does it advance when readiness >= 0.7?
- Does conversation flow naturally?
- Does it match GPT depth and tone?

---

## 🎯 Architecture Comparison

### Old System (chat)
```
❌ Linear phase progression (1→2→3→4→5→6→7)
❌ Simple completion rules ("completed" | "in_progress")
❌ One template per phase
❌ Prescriptive rules ("ALWAYS ask a question")
❌ No conversation memory
```

### New System (chat-v2)
```
✅ Nonlinear, readiness-based flow
✅ Readiness scoring (0-1, threshold 0.7)
✅ Prompt library with variations
✅ Principle-based guidance (not rules)
✅ FlowState with accumulated context
```

---

## 📋 Next Steps

**Immediate (before testing):**
1. Run database migration in Supabase dashboard
2. Deploy chat-v2 edge function
3. Test edge function directly with curl/Postman

**After edge function works:**
4. Build frontend handler
5. Add feature flag
6. Test with GPT samples

**Before production:**
7. A/B test with real users
8. Monitor readiness scores
9. Adjust thresholds if needed
10. Switch feature flag to true

---

## 🔄 Rollback Plan

If chat-v2 has issues:
1. Set `EXPO_PUBLIC_USE_CHAT_V2=false`
2. App falls back to old `chat` function
3. No data loss (flow_state column doesn't affect old system)

---

## 📊 Success Metrics

**Chat-v2 is working when:**
- ✅ Conversations loop within phases when user is vague
- ✅ Phases advance when readiness >= 0.7
- ✅ Responses match GPT gold standard depth
- ✅ No stalling or repeating questions
- ✅ Natural conversation flow

**Monitoring:**
- Average readiness scores per phase
- Number of loops before advancement
- User satisfaction (compared to old system)
- Completion rates (Phase 1 → Phase 7)

---

## 🚀 Ready to Deploy

All code is written. Just need to:
1. Run the database migration
2. Deploy the edge function
3. Test it works
4. Build frontend integration

**Estimated time to production-ready:** 2-3 hours

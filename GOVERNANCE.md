# BeAligned Chat Governance Documentation

**Last Updated:** October 10, 2025
**Purpose:** Document the current prompt structure and governance mechanisms for the BeAligned chat/reflection system

---

## Current Architecture Overview

### Active System: Single Edge Function Approach

**Primary Edge Function:** `supabase/functions/chat/index.ts`
- **Status:** ACTIVE (deployed 5 hours ago)
- **Called by:** `hooks/useReflectionSession.ts` line 621
- **Responsibility:**
  - Generates AI responses
  - Determines phase completion
  - Returns structured JSON with `phase_status` and `next_phase`

**Inactive Edge Function:** `supabase/functions/check-phase-completion/index.ts`
- **Status:** DISABLED (commented out in useReflectionSession.ts line 758-768)
- **Note:** Contains more sophisticated regex-based phase completion logic but is not being used

---

## System Prompt Structure

### Location
**File:** `supabase/functions/chat/index.ts`
**Lines:** 56-100

### Prompt Components

#### 1. Phase Context (Lines 58-59)
```
Current Phase: ${phasePrompt.phase_header}
Guidance: ${phasePrompt.ai_guidance}
```

**Note:** Database table `phase_prompts` is **EMPTY** (0 rows)
- `phase_header` = undefined
- `ai_guidance` = undefined
- **The database query fails silently**, meaning no phase-specific guidance is loaded

#### 2. BeH2O® Principles (Lines 63-67)
```
- Be Strong: Communicate with clarity and grounded purpose
- Flow: Be responsive, not reactive, while moving forward
- The Third Side: Hold space for all perspectives while centering the child
- Safeguarding Childhoods: The goal is protecting the child's experience
```

**Source:** Hardcoded in edge function

#### 3. Response Format (Lines 76-81)
```json
{
  "reply": "your warm, reflective message here",
  "phase_status": "completed",
  "current_phase": ${currentPhase},
  "next_phase": ${currentPhase + 1}
}
```

**Source:** Hardcoded in edge function

#### 4. Phase Completion Criteria (Lines 91-100)

**THIS IS THE CORE GOVERNANCE LOGIC**

```
PHASE COMPLETION CRITERIA:
Phase 1: "completed" when user has clearly NAMED their situation/concern

Phase 2: "completed" when user has identified DEEPER EMOTIONS/FEELINGS beneath the surface

Phase 3: "completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES
  - Look for statements like "for my kids", "to be a good parent", "to set an example", "because it's right"
  - User has moved beyond surface concerns to deeper motivations

Phase 4: "completed" when user has genuinely CONSIDERED CO-PARENT'S PERSPECTIVE

Phase 5: "completed" when user has genuinely CONSIDERED CHILD'S PERSPECTIVE

Phase 6: "completed" when user has EXPLORED POTENTIAL SOLUTIONS/OPTIONS

Phase 7: "completed" when user has CHOSEN a specific COMMUNICATION APPROACH

Current Phase ${currentPhase} - Set "phase_status" to "completed" if user has met the criteria above
- Set "phase_status" to "in_progress" if they need more exploration
- When "phase_status" is "completed", ALWAYS set "next_phase" to ${currentPhase + 1}
- When "phase_status" is "in_progress", set "next_phase" to ${currentPhase}
```

**Source:** Hardcoded in edge function
**Origin:** Included in initial commit (not derived from GPT samples)

---

## Current Issues Identified

### Issue 1: Phase 3 Completion Criteria Inconsistency

**Pattern in Phases 1, 2, 4-7:**
- Simple, broad statement
- No restrictive examples
- AI interprets liberally

**Phase 3 (Anomaly):**
- Broad statement PLUS 4 specific examples
- AI may interpret examples as exhaustive list
- Results in restrictive matching

**Impact:**
- Input: "To find new purpose for my role with my family"
- **Should advance** (expresses WHY about family/purpose)
- **Does not advance** (doesn't match the 4 specific examples)

### Issue 2: Empty Database Tables

**Table:** `phase_prompts`
- **Expected:** Per-phase guidance, prompts, and context
- **Actual:** 0 rows (completely empty)
- **Impact:** No database-driven phase guidance is reaching the AI

**Query Error Handling:**
- Lines 51-55: Throws error if query fails
- **But:** Query succeeds (returns no rows), so error never triggers
- **Result:** `phasePrompt.phase_header` and `phasePrompt.ai_guidance` are undefined

---

## How Phase Advancement Currently Works

### Step-by-Step Flow

1. **User sends message** → Frontend (`hooks/useReflectionSession.ts` line 621)

2. **Edge function invoked** → `supabase.functions.invoke('chat', {...})`

3. **System prompt built** → Lines 56-100 with:
   - Empty database guidance (undefined)
   - Hardcoded BeH2O principles
   - Hardcoded phase completion criteria

4. **OpenAI called** → Model: `gpt-4o`, temp: 0.9, max_tokens: 500

5. **AI returns JSON:**
   ```json
   {
     "reply": "...",
     "phase_status": "completed" | "in_progress",
     "current_phase": 3,
     "next_phase": 3 | 4
   }
   ```

6. **Frontend receives response** → Checks `phase_advanced` boolean

7. **If phase advanced:**
   - Updates session in database
   - Generates phase header + opening message
   - Displays to user

8. **If phase NOT advanced:**
   - Stays in current phase
   - Shows AI reply only

---

## Comparison: What Works vs What Doesn't

### ✅ Phases 1 & 2 (Working)

**Phase 1 Criteria:**
```
"completed" when user has clearly NAMED their situation/concern
```

**Why it works:**
- Simple, broad directive
- No restrictive examples
- AI has flexibility to recognize diverse responses

**Example successful input:**
```
"It all feels like its too heavy for me to handle right now.
The criminal case, the GALs, the attorneys..."
```

**Phase 2 Criteria:**
```
"completed" when user has identified DEEPER EMOTIONS/FEELINGS beneath the surface
```

**Why it works:**
- Simple, broad directive
- No restrictive examples
- AI recognizes emotional depth naturally

**Example successful input:**
```
"Just really deep sadness."
"That I will never go back to the world I once knew..."
```

### ❌ Phase 3 (Not Working)

**Phase 3 Criteria:**
```
"completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES
  - Look for statements like "for my kids", "to be a good parent",
    "to set an example", "because it's right"
  - User has moved beyond surface concerns to deeper motivations
```

**Why it fails:**
- Has 4 specific examples that create implicit restrictive matching
- AI interprets as "must match one of these patterns"
- Rejects valid WHY statements that don't match examples

**Example failed input (should work but doesn't):**
```
"To find new purpose for my role with my family."
```

**Contains:** Family purpose, role clarity, forward-looking values
**Should match:** YES - expresses WHY
**Actually matches:** NO - doesn't contain exact phrases from examples

---

## GPT Gold Standard Comparison

### What the BeAligned GPT Actually Accepts (Phase 3)

From `public/assets/BeAligned_GPT_Reflection_Sampling_20250913.md`:

**Actual Phase 3 user responses that GPT accepted:**

1. "My 'main why' is rooted in my faith — for the world to see Christ through my sons' lives"
   - ❌ Does NOT match current criteria (no "for my kids" exact match)

2. "I want my voice to be considered so we can make the best decision for our son"
   - ✅ Might match ("for our son")

3. "I want to share responsibility. it's not fair that he doesn't have to do anything"
   - ❌ Does NOT match current criteria (about fairness, not "for my kids")

4. "To find new purpose for my role with my family" (your test case)
   - ❌ Does NOT match current criteria

**Conclusion:** The GPT accepts a much broader range of WHY statements than our current hardcoded criteria.

---

## Database Tables Status

### Active Tables
- ✅ `reflection_sessions` - Session tracking
- ✅ `chat_messages` - Message history
- ✅ `profiles` - User data

### Empty/Unused Tables
- ❌ `phase_prompts` - 0 rows (should contain phase guidance)
- ❌ `completion_patterns` - Unknown status (referenced in check-phase-completion function)
- ❌ `completion_signals` - Unknown status (referenced in check-phase-completion function)
- ❌ `bealigned_content` - Unknown status (mentioned in CLAUDE.md as "missing")
- ❌ `bealigned_content_chunks` - Unknown status (mentioned in CLAUDE.md as "missing")

---

## Governance Decision Points

### Where AI Behavior is Controlled

**PRIMARY (100% Active):**
1. ✅ `supabase/functions/chat/index.ts` lines 56-100 - System prompt with completion criteria

**SECONDARY (Not Currently Used):**
2. ❌ `phase_prompts` database table - Empty
3. ❌ `check-phase-completion` edge function - Disabled/commented out
4. ❌ Vector database content - Missing

**TERTIARY (UI Only - No AI Behavior Impact):**
5. ✅ `lib/chat.ts` - REFLECTION_STEPS (phase titles, descriptions for display)
6. ✅ `app/(tabs)/chat.tsx` - Frontend chat UI

---

## Minimal Fix Proposal

### Problem Statement
Phase 3 uses restrictive criteria with specific examples, while Phases 1 & 2 use broad criteria without examples.

### Proposed Change
**File:** `supabase/functions/chat/index.ts`
**Lines to modify:** 94-96

**Current (restrictive):**
```
Phase 3: "completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES
  - Look for statements like "for my kids", "to be a good parent", "to set an example", "because it's right"
  - User has moved beyond surface concerns to deeper motivations
```

**Proposed (consistent with Phases 1 & 2):**
```
Phase 3: "completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES
```

**Change:** Delete lines 95-96 (the examples and the "moved beyond" line)

**Impact:**
- Makes Phase 3 criteria consistent with other phases
- Removes restrictive examples
- Trusts AI to recognize WHY statements naturally (like it does for Phases 1 & 2)
- No new code added
- No new functions created
- **Reduces complexity** by removing 2 lines

**Risk:** Low - can be reverted in 30 seconds if unsuccessful

**Test Case:**
- Input: "To find new purpose for my role with my family"
- Expected: `phase_status: "completed"`
- Current: `phase_status: "in_progress"`

---

## Change History

### October 10, 2025
- Initial documentation created
- Identified Phase 3 completion criteria as root cause of advancement failure
- Documented current active vs inactive systems
- Mapped empty database tables

---

## Notes for Future Development

### If Vector Database is Re-Implemented:
- Populate `bealigned_content` table with BeH2O materials
- Populate `bealigned_content_chunks` with GPT knowledge samples
- Use vector similarity to inject contextual BeH2O wisdom

### If Database-Driven Governance is Needed:
- Populate `phase_prompts` table with per-phase guidance
- Update edge function to use database guidance (currently tries but table is empty)
- Keep hardcoded rules minimal (format enforcement, safety)

### If Sophisticated Phase Detection is Needed:
- Re-enable `check-phase-completion` edge function
- Use regex patterns (lines 376-459) for more nuanced detection
- Uncomment line 759-768 in `useReflectionSession.ts`

---

## Questions for Consideration

1. **Should phase completion be AI-driven (current) or rule-based (check-phase-completion)?**
   - Current: AI interprets criteria and decides
   - Alternative: Regex patterns check user input directly

2. **Should phase guidance come from database or code?**
   - Current: Code (database is empty)
   - Alternative: Populate database for easier iteration

3. **Should we match GPT exactly or improve upon it?**
   - Current goal: Match GPT flow as closely as possible
   - Risk: Over-engineering beyond GPT's natural conversational intelligence

4. **How minimal should the governance be?**
   - Philosophy: Guide the AI, don't tell the AI
   - Risk: Too many rules = robotic responses
   - Risk: Too few rules = drift from BeH2O methodology

---

## Contact & Maintenance

This document should be updated whenever:
- Edge functions are modified
- Database tables are populated or changed
- Phase completion logic is altered
- New governance mechanisms are introduced

**Maintainer:** Development team
**Review frequency:** After each significant change to chat/reflection system

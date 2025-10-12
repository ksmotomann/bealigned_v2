# Phase 2 Stalling Issue - Fixed

## Problem Identified

**Symptom:** Chat stalled in Phase 2 after user said "I feel hurt"

**Root Cause:** AI provided validation without follow-up question, marking phase complete too early.

### Example of Stall:

```
User: "I feel hurt."

AI: "You're carrying a heavy mix right now. Feeling hurt tells me this situation
hits deep for you, maybe touching on something sacred. You're not just reacting —
you're protecting something important."

[NO FOLLOW-UP QUESTION = CONVERSATION STALLS]
```

## Root Cause Analysis

**Phase 2 Objective:** Move from surface emotions (anger, frustration) to deeper emotions (hurt, fear, grief)

**What happened:**
1. ✅ User moved from "I should have custody" → "I feel hurt" (surface → slightly deeper)
2. ❌ AI validated but didn't probe further
3. ❌ "Hurt" is still somewhat surface-level (need to understand what kind of hurt: fear? abandonment? sadness?)
4. ❌ Phase marked complete without reaching true emotional depth

**Missing Pattern from Gold Standard:**
```
Gold Standard: "You're holding multiple truths at once. That mix says a lot about
what matters to you. What do you think these feelings are pointing to?"
                                      ↑
                            FOLLOW-UP QUESTION
```

## Fix Applied

**Updated:** `supabase/functions/chat/prompts.ts` - Phase 2 template

**Changes:**
```typescript
// BEFORE (too vague)
During Phase 2: Name patterns you notice. "You're holding multiple truths" - keep brief (2-3 sentences).

// AFTER (explicit guidance)
During Phase 2:
- Name the emotions/patterns you hear: "You're holding multiple truths", "That's hitting deep"
- ALWAYS ask a follow-up question to go deeper: "What do you think these feelings are pointing to?", "What might be beneath that?"
- Keep brief (2-3 sentences) but MUST include a question
- Example: "You're carrying a heavy mix. That hurt is real. What do you think that hurt is protecting or pointing to?"
```

**Key Addition:** Made follow-up questions **mandatory** with specific examples

## Expected Behavior After Fix

**Same scenario with fix:**

```
User: "I feel hurt."

AI: "You're carrying a heavy mix right now. That hurt is real and hitting deep.
What do you think that hurt is protecting or pointing to?"
                         ↑
                  CONTINUES EXPLORATION
```

**This should:**
1. ✅ Keep conversation flowing
2. ✅ Probe deeper into what kind of hurt (fear of child being neglected? sadness about co-parent relationship?)
3. ✅ Only mark phase complete when true emotional depth is reached

## Deployment

✅ Deployed to `chat` edge function
✅ Files updated: `supabase/functions/chat/prompts.ts`

## Testing Recommendation

Re-test the same conversation flow:
1. User: "I should have full custody, my coparent doesn't do anything"
2. AI: Phase 1 → Phase 2 transition
3. User: "I feel hurt"
4. AI: Should now ask follow-up question to explore the hurt deeper

**Expected:** Conversation continues flowing, doesn't stall

# Console Testing Guide - Phase Completion Logic

## Purpose
This guide helps you verify **exactly where** the phase completion logic is coming from by viewing browser console logs.

## Edge Function Deployed
✅ **File:** `supabase/functions/chat/index.ts`
✅ **Deployed:** Yes (latest version with console logging)

---

## How to Test in Browser Console

### Step 1: Open Browser Console
1. Open your app in Chrome/Firefox
2. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Click the **Console** tab

### Step 2: Navigate to Chat
1. Go to the chat/reflection interface
2. Start a new session or continue existing session

### Step 3: Send a Phase 3 Response
When you reach Phase 3 (YOUR WHY), send your test input:
```
"To find new purpose for my role with my family."
```

### Step 4: Watch Console Output

You should see output like this:

```
🎯 Structured Chat Function - Phase 3: { userInput: "To find new purpose...", sessionId: "..." }

⚠️ DATABASE QUERY FAILED - phase_prompts table empty or query error
   Error: [error message]

🔍 SYSTEM PROMPT STRUCTURE:
   Source: HARDCODED in supabase/functions/chat/index.ts
   Phase Completion Criteria: Lines 91-100 of this file
   Current Phase 3 Criteria:
   Phase 3: "completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES
     - Look for statements like "for my kids", "to be a good parent", "to set an example", "because it's right"
     - User has moved beyond surface concerns to deeper motivations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI RESPONSE RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Raw Response: {"reply":"...","phase_status":"in_progress","current_phase":3,"next_phase":3}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PARSED STRUCTURED RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   phase_status: in_progress  ← THIS IS THE PROBLEM
   current_phase: 3
   next_phase: 3               ← SHOULD BE 4
   reply preview: "..."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## What You're Looking For

### Key Log Messages

1. **"⚠️ DATABASE QUERY FAILED"**
   - Confirms `phase_prompts` table is empty
   - Means NO database guidance is being used

2. **"Source: HARDCODED in supabase/functions/chat/index.ts"**
   - Confirms completion criteria come from the edge function code
   - NOT from database
   - NOT from GPT samples

3. **"Phase 3: 'completed' when..."**
   - Shows the EXACT criteria the AI is receiving
   - These are the 4 specific examples causing the problem

4. **"phase_status: in_progress"**
   - Shows the AI did NOT recognize your input as complete
   - Even though it should have

---

## Expected Results

### What the Console Will Prove:

✅ **Completion logic source:** `supabase/functions/chat/index.ts` lines 91-100
✅ **Database guidance:** Empty/not being used
✅ **Phase 3 criteria:** Hardcoded with restrictive examples
✅ **AI decision:** Returns `phase_status: "in_progress"` for "To find new purpose for my role with my family"

### What This Confirms:

1. The phase completion logic is **100% hardcoded** in the edge function
2. The `phase_prompts` database table is **empty and not being used**
3. The AI receives **restrictive criteria** that don't match GPT behavior
4. Your Phase 3 input **fails to match** the hardcoded examples

---

## Next Steps After Verification

Once you confirm the above in the console:

1. ✅ We know exactly where to make changes: `supabase/functions/chat/index.ts` lines 91-100
2. ✅ We can update the Phase 3 criteria to be broader (like Phases 1 & 2)
3. ✅ We can optionally populate the `phase_prompts` table for database-driven guidance
4. ✅ We can test the fix immediately by redeploying the edge function

---

## Viewing Supabase Function Logs

### Alternative: View Logs in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/oohrdabehxzzwdmpmcfv/functions
2. Click on the `chat` function
3. Click the **Logs** tab
4. You'll see the same console.log output in real-time

### Using Supabase CLI

```bash
npx supabase functions logs chat --follow
```

This will stream logs in your terminal as they happen.

---

## Ready to Test?

1. Open your app
2. Open browser console (F12)
3. Navigate to chat
4. Send Phase 3 response: "To find new purpose for my role with my family."
5. Watch console output
6. Take a screenshot or copy the logs
7. Report back what you see!

**The logs will prove definitively where the logic lives and why it's failing.**

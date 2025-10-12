- make recommendations before making changes
- All current changes we're making should be to Mode B unless otherwise specified - that is becoming our new "Gold Standard". The original "Gold Stanard" was the custom GPT Trina created called BeAligned Beta Lite.
- when performing testigng of our app to the BeAligned_GPT_Reflection_Sampling_20250913.md samples, its critical that we include phase progression, tone, phase 6 options and phase 7 messaging in our testing and pattern identification
- regularly, you should refer to our GPT samples in the database for grounding and flow and baseline testing to ensure our app is aligning with the "gold standard" gpt
- do not fall into the over-engineering trap - rely on the AI to drive the conversation - whether thats 1 follow-up prompt or several, whether that means we advance to the next phase or go deeper on a phase - we need to "guide" the AI not "tell" the AI.
## BeH2O® & BeAligned™ Core Methodology

**BeH2O® Principles** (foundational to all responses):
- **Strength (like beryllium)**: Communicate with clarity, grounded purpose, and self-accountability
- **Stability**: Anchor to shared goals that protect children and reduce chaos  
- **Flow (like water)**: Be responsive—not reactive—while moving forward in alignment
- **Mindset Drives Behavior**: Shifting perspective leads to healthier patterns and outcomes
- **The Third Side**: Hold space for both perspectives while centering the child's needs
- **Safeguarding Childhoods**: The goal isn't to win or be right — it's to protect the child's experience

**BeAligned™ Mindset** (guides conversation tone):
- **Purpose over Position**: Don't just argue over what — reflect on why it matters
- **Reflection Before Reaction**: Pause, explore what's beneath the surface, consider all perspectives  
- **Alignment > Agreement**: You don't have to agree to align around what's best for your child
- **Child-Centered Lens**: Always ask, "What would my child hope I do next?"
- **Warmth, neutrality, and reflection** - NOT therapist, mediator, or advisor
- **Invite clarity, calm, and compassion** - step by step

## CRITICAL: AVOID OVER-ENGINEERING

- The BeAligned GPT has natural conversational intelligence - don't try to replicate this with complex logic
- When there's a mismatch between our app and the GPT, focus on conversational tone/guidance, not precision rules
- ALWAYS ask before adding detailed behavioral logic, advancement rules, or "two-step processes"
- The goal is natural conversation flow, not engineered responses
- If Claude starts creating complex detection patterns or rigid processes, STOP and ask first
- Guide the AI, don't tell the AI - let conversational intelligence emerge naturally

## ARCHITECTURE DECISIONS (September 2025)

### A/B Testing: Phase 1 Instructions (September 24, 2025)
**Active Test:** Prescriptive Phrases vs Guidance-Based Approach

**Context:**
Phase 1 was using overly prescriptive phrases (e.g., "Say exactly: 'Thanks for naming that...'") which violated our "guide the AI, don't tell the AI" principle and resulted in robotic, repetitive responses.

**Current Setup:**
- **Location:** `supabase/functions/generate-ai-response-vector/index.ts` (lines 296-502)
- **Scenario A (INACTIVE):** Prescriptive phrases with exact wording
- **Scenario B (ACTIVE):** Guidance-based with principles and examples (not required phrases)

**Scenario B Changes:**
- Validation: Provide principles ("Be warm, not clinical") with optional examples
- Distillation: Guidance on tone/approach, not exact phrases
- Phase 2 Bridge: Clear guidance on when/how to transition
- Guardrails: Focus on what to avoid, not what to say exactly

**Goal:** Allow AI conversational intelligence to emerge naturally while maintaining GPT parity

**To Switch Scenarios:**
1. Comment out active scenario
2. Uncomment desired scenario
3. Update header at line 300 to reflect active scenario
4. Deploy edge function

**Testing Notes:** Document results here or in separate testing file

---

### Current System Architecture (Updated September 25, 2025)
**Status:** Vector DB system was removed/lost - now running on direct OpenAI + hardcoded governance

**Current Architecture:**

1. **AI Behavior Control** - `supabase/functions/chat/index.ts`
   - Hardcoded BeH2O® principles (lines 63-67)
   - Phase completion criteria (lines 83-92)
   - JSON response format enforcement
   - **This is the ONLY active source controlling AI behavior**

2. **Frontend UI Display** - `lib/chat.ts`
   - Phase titles with updated emojis and italic formatting
   - Phase 5 now uses 👶 (baby emoji) instead of 👁️
   - All phases formatted as: "🔥 **PHASE X:** *Phase Description*"
   - **Used ONLY for frontend display, NOT for AI behavior**

3. **Database Tables Currently Active:**
   - `phase_prompts` - Database-driven per-phase guidance (exists but functionality uncertain)
   - `speakers` - Unknown purpose
   - ❌ **Vector tables missing:** `bealigned_content`, `bealigned_content_chunks`

**Key Files:**
- `supabase/functions/chat/index.ts` - **PRIMARY** AI system instructions (ACTIVE)
- `lib/chat.ts` - Frontend display data only (ACTIVE)
- `app/(tabs)/chat.tsx` - Chat UI using REFLECTION_STEPS for display

**Architecture Gap Identified:**
- **Vector knowledge system is missing** - no BeH2O content retrieval
- **All governance is hardcoded** in Edge Function system prompt
- **No semantic content enhancement** - running on direct OpenAI only

**Current Governance Structure:**
- **Cross-phase governance:** Hardcoded in `chat/index.ts` (BeH2O principles, completion criteria)
- **Per-phase guidance:** Database `phase_prompts` table (ai_guidance field)
- **UI display:** Frontend `lib/chat.ts` (titles, descriptions, help text)

## CONVERSATIONAL INTELLIGENCE & GOVERNANCE APPROACH

### Phase Completion Philosophy (September 25, 2025)
**Core Principle:** Use conversational intelligence pattern recognition, NOT rigid word matching or completion rules.

**Universal Completion Recognition:**
- **Authentic Engagement Check**: Did user genuinely attempt the phase objective?
- **Capacity Indicator Recognition**: Look for signs they've reached their current limit:
  - Brief responses after detailed ones
  - Closure language ("that's it", "nothing else", "I don't know")
  - Resistance to further prompting
  - Repetition of previous points
- **Progress Over Perfection**: Advance when user shows they've understood concept and made authentic attempt

**Implementation Approach:**
- ✅ **Conversational Flow Intelligence**: Reading natural dialogue patterns for readiness
- ✅ **Contextual Completion Recognition**: Understanding when someone has given what they can
- ✅ **Authentic Effort Detection**: Recognizing genuine engagement vs surface responses
- ❌ **NOT Word Detection**: No scanning for specific completion phrases
- ❌ **NOT Rigid Criteria**: No forcing users through predetermined hoops

**Per-Phase Recognition Patterns:**
- **Phase 1**: User has named/described situation authentically (even if messy)
- **Phase 2**: User has identified emotional layers beyond surface (anger → hurt)
- **Phase 3**: User has connected to deeper why/values ("for my kids", purpose statements)
- **Phase 4**: User has made genuine attempt at perspective-taking (even if resistant)
- **Phase 5**: User has considered child's experience with authentic reflection
- **Phase 6**: User has engaged with solution possibilities or shown preference direction
- **Phase 7**: User shows commitment to action or message refinement

### Governance Decision Framework
**Current Status:** All governance hardcoded in Edge Function system prompt

**Proposed Hybrid Governance Model:**
1. **Keep in Code (Critical Infrastructure):**
   - JSON format enforcement (brittle, must work)
   - Response structure validation
   - Anti-drift rules (no emojis, no headers)
   - Error handling

2. **Move to Database (Flexible Governance):**
   - BeH2O® principles (can evolve with methodology)
   - Phase completion criteria (can tune based on testing)
   - Conversational intelligence patterns (can improve iteratively)

**Implementation Strategy:**
- Create `system_prompts` table for flexible governance rules
- Maintain hardcoded safety/format rules in Edge Function
- Enable dynamic updates to conversational guidance without code deploys

**Future Architecture Path:**
- Simple `system_prompts` table approach (immediate)
- Potential cached vector governance (if semantic selection needed later)
- Always prioritize conversational intelligence over rigid rules

## DEBUGGING WORKFLOW

### Metro Bundler Cache Issues
**CRITICAL:** When debugging issues where code changes don't appear to take effect or logs don't match current source code:

**Symptoms:**
- Console logs showing different debug messages than what's in the code
- Code changes not reflecting in the running app
- Mysterious behavior that doesn't match current source
- Functions appearing to be called but debug logs don't appear

**Solution:**
```bash
# Kill current process and clear Metro cache
npx expo start --clear
```

**When to Use:**
- After significant code changes that aren't reflected
- When debug logs don't match current code
- When chasing "ghost" behavior that doesn't exist in source
- Before assuming complex debugging issues

**Alternative Methods:**
```bash
# Manual cache clearing
rm -rf node_modules/.cache
rm -rf .expo
npx expo start

# Or through Expo CLI
npx expo r -c
```

**Best Practice:** When spending >10 minutes debugging inconsistent behavior between code and app, clear cache first before deeper investigation.

## PRECISION ALIGNMENT STRATEGY (September 2025)

### CORE OBJECTIVE: BeAligned GPT Precision Alignment
**Mission:** Achieve near-precision alignment between our app and the BeAligned Beta Lite GPT using all available tools.

**Strategic Approach:**
- **Vector Database + AI** as primary alignment mechanism (not restrictive coding governance)
- **Continuous calibration** against BeH2O guidance materials, GPT knowledge files, phase definitions, and chat history samples
- **Natural conversation intelligence** through AI + vector content, not rigid programmatic rules

### ALIGNMENT REFERENCE MATERIALS (All Available in Vector Database)
1. **BeH2O® Content** - Core methodology and principles stored in `bealigned_content` table
2. **GPT Knowledge Files** - Original BeAligned GPT instruction materials and samples
3. **Phase Definitions** - Structured scaffolding in `phase_prompts` table
4. **Chat History Samples** - Real BeAligned GPT conversation patterns in `bealigned_content_chunks`
5. **BeAligned_GPT_Reflection_Sampling_20250913.md** - Gold standard conversation examples

### CALIBRATION PRINCIPLES
- **Always reflect** on BeH2O guidance materials before major changes
- **Test against GPT samples** to ensure response patterns match gold standard
- **Use vector database intelligently** to inject contextual BeH2O wisdom into AI responses
- **Leverage AI conversation flow** rather than over-engineering programmatic responses
- **Prioritize natural BeH2O alignment** over technical perfection

### IMPLEMENTATION HIERARCHY
1. **Vector Database Content** - BeH2O materials as contextual foundation
2. **AI Conversation Intelligence** - Natural flow guided by vector content
3. **Phase Scaffolding** - Database structure for guidance, not restriction
4. **Minimal Programmatic Rules** - Only when absolutely necessary for safety/flow

**Remember:** The goal is not to replicate the GPT through code, but to create an environment where AI + vector content can naturally produce GPT-aligned responses.
- just because you can't access the databae doesn't mean you should make stuff up - trying fixing the db connection issue anytime you can't connect and we would benefit from directly access db content
- i prefer to enter sql updates directly in console
- StandardModal object should be used for the creation of all new modals
- never use precise chat examples as the trigger for phase advancement - they can be used as examples but not precise or near precise matching - we must program this to be guided not directed
- if ever in doubt about the governance for this project, refer to the .md files in assets/master in this project folder
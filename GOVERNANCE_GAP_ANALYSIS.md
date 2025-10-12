# BeAligned App vs GPT Governance Blueprint - Gap Analysis

**Version:** 1.0
**Date:** October 11, 2025
**Last Updated:** October 11, 2025
**Document:** Comparison of current implementation vs `2025_1011_BE_Gov1_Robert.md`

---

## Version History

| Version | Date | Changes | Alignment Score |
|---------|------|---------|-----------------|
| 1.0 | Oct 11, 2025 | Initial gap analysis | 45/100 |

---

## Executive Summary

Your current BeAligned app has **foundational infrastructure** in place and has made an **intentional architectural decision to use OpenAI** instead of Claude.

**Current Alignment Score: 45/100**

### ✅ What's Aligned
- Expo + React Native + Supabase stack
- Edge Functions architecture
- Phase-based reflection system (7 phases)
- Database-driven governance (`phase_prompts` table)
- Vector database with embeddings (390 chunks)

### ❌ Major Gaps
- Different data model (sessions vs reflections)
- No CLEAR scoring system
- Vector DB exists but not actively used
- No structured JSON output contracts
- Missing alignment scores
- No coach feedback system

### ⚙️ Architectural Decisions
- **Using OpenAI (gpt-4o)** - Intentional choice instead of Claude
  - Reason: Existing infrastructure, proven performance
  - Trade-off: Different from GPT blueprint but functional

---

## 1. AI Provider & Architecture

### GPT Blueprint Suggests:
```typescript
// Claude API (Anthropic)
import { Anthropic } from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
});

const completion = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-latest',
  max_tokens: 800,
  system: systemPreamble,
  messages: [{ role: 'user', content: phaseTemplate }]
});
```

### Current Implementation (OpenAI):
```typescript
// OpenAI API
const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [/* ... */],
    temperature: 0.9
  })
})
```

**Status:** ⚙️ **Intentional Architectural Choice** - Using OpenAI instead of Claude

**Rationale:**
- Existing infrastructure already built on OpenAI
- GPT-4o has proven performance for BeAligned use case
- Team familiarity with OpenAI API
- Cost-effective for current scale

**Trade-offs:**
- Different model characteristics than Claude
- Different pricing structure (acceptable)
- Prompts may need adjustment vs Claude-optimized templates
- Missing Claude-specific features (artifacts) - not critical for MVP

**Decision:** ✅ **Stay with OpenAI** - Blueprint is a reference, not a requirement

---

## 2. Data Model & Schema

### GPT Blueprint Expects:

**Core Table: `reflections`**
```sql
create table public.reflections (
  id uuid primary key,
  user_id uuid not null,
  phase reflection_phase not null, -- ENUM: issue,feelings,why,perspective,options,choose,message
  content text not null,
  ai_summary jsonb,
  alignment_score numeric(4,2),
  vector_embedding vector(1536),
  created_at timestamptz,
  updated_at timestamptz
);
```

**Additional Tables:**
- `communications` (drafts/sent messages)
- `coach_feedback` (professional feedback on reflections)
- `children` (child profiles)
- `institutions` (organizational subscriptions)

### Current Implementation:

**Core Table: `reflection_sessions`**
```sql
create table public.reflection_sessions (
  id uuid primary key,
  owner_id uuid,
  title text,
  status text, -- 'in_progress', 'completed', 'archived'
  current_phase integer default 1, -- Simple integer, not enum
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Additional Tables:**
- ✅ `chat_messages` (conversation history)
- ✅ `phase_prompts` (database-driven governance)
- ✅ `bealigned_content` + `bealigned_content_chunks` (vector DB)
- ❌ Missing: `communications`, `coach_feedback`, `children`, `institutions`

**Status:** ⚠️ **Different but functional** - Sessions model vs Reflections model

**Key Differences:**
1. **Phase tracking**: Integer `current_phase` vs `reflection_phase` enum
2. **No alignment scores**: Missing `alignment_score` field
3. **No AI summary**: Missing `ai_summary` jsonb field
4. **Messages separate**: Using `chat_messages` table instead of embedded
5. **No coach system**: Missing `coach_feedback` and coach role integration

---

## 3. Prompt Governance Structure

### GPT Blueprint Expects:

**File-based governance in `packages/prompts/`:**
```
packages/prompts/
  governance.md          # Core principles
  bealigned/
    00_preamble.md      # System preamble
    01_issue.md         # Phase 1 template
    02_feelings.md      # Phase 2 template
    03_why.md           # Phase 3 template
    ...
  flow/
    01_assess.md
    04_clear.md         # CLEAR scoring template
```

**Example template (`01_issue.md`):**
```markdown
SYSTEM REMINDER: Host the conflict; do not judge. Apply child-impact lens.
User provided ISSUE:
{{INPUT}}

Return JSON:
{
  "reframed_issue": string,
  "assumptions_to_check": string[],
  "child_impact_snapshot": string,
  "next_prompt_hint": "feelings"
}
```

### Current Implementation:

**Database-driven governance in `phase_prompts` table:**
```sql
phase_prompts:
  - phase_number: 1
  - phase_name: "Issue Naming"
  - phase_header: "🌿 PHASE 1: LET'S NAME IT"
  - welcome_prompt: "Thanks for being here..."
  - ai_guidance: "Stay focused on naming the issue only..."
  - expected_intent: "User names a co-parenting challenge..."
  - validation_keywords: ["struggling", "situation", "issue"]
```

**Hardcoded in Edge Function (`chat/index.ts`):**
```typescript
const systemPrompt = `You are Trina, a warm and experienced co-parenting coach using the BeH2O methodology.

Current Phase: ${phasePrompt.phase_header}
Guidance: ${phasePrompt.ai_guidance}

BeH2O® Principles:
- Be Strong: Communicate with clarity
- Flow: Be responsive, not reactive
- The Third Side: Hold space for all perspectives
- Safeguarding Childhoods

Your response must be in this EXACT format:
{
  "reply": "your warm, reflective message here",
  "phase_status": "completed",
  "current_phase": ${currentPhase},
  "next_phase": ${currentPhase + 1}
}
```

**Status:** ⚠️ **Hybrid approach** - Database + hardcoded vs File-based

**Key Differences:**
1. **Storage**: Database (flexible) vs Markdown files (version-controlled)
2. **JSON contracts**: Simple reply object vs Structured phase outputs
3. **Governance location**: Mix of database + hardcode vs Pure file-based
4. **Version control**: Database changes hard to track vs Git-tracked markdown

**Pros of current approach:**
- ✅ Easy to update without deployment
- ✅ Can be edited via UI
- ✅ Database queries for governance

**Cons of current approach:**
- ❌ Harder to version control
- ❌ No file-based backup
- ❌ Changes not tracked in git
- ❌ Less structured JSON output contracts

---

## 4. JSON Output Contracts

### GPT Blueprint Expects:

**Strict structured outputs per phase:**

**Phase 1 (Issue):**
```json
{
  "reframed_issue": string,
  "assumptions_to_check": string[],
  "child_impact_snapshot": string,
  "next_prompt_hint": "feelings"
}
```

**Phase 2 (Feelings):**
```json
{
  "surface_emotions": string[],
  "deeper_feelings": string[],
  "validation_response": string,
  "next_prompt_hint": "why"
}
```

**CLEAR Scoring:**
```json
{
  "score": 0-10,
  "edits": string[],
  "rewritten_message": string
}
```

### Current Implementation:

**Simple unified output:**
```json
{
  "reply": "your warm, reflective message here",
  "phase_status": "completed" | "in_progress",
  "current_phase": number,
  "next_phase": number
}
```

**Status:** ❌ **Incomplete** - Missing phase-specific structured outputs

**Key Gaps:**
1. No phase-specific output contracts
2. No `alignment_score` in responses
3. No CLEAR scoring system at all
4. No structured data extraction (assumptions, child impact, etc.)
5. Simple string `reply` vs rich structured guidance

---

## 5. Vector Database Usage

### GPT Blueprint Expects:

**Active semantic retrieval:**
```typescript
// 1. Generate embedding for user input
const embedding = await generateEmbedding(content);

// 2. Search vector DB for relevant guidance
const { data: relevantChunks } = await supabase
  .rpc('match_bealigned_chunks', {
    query_embedding: embedding,
    match_threshold: 0.8,
    match_count: 5
  });

// 3. Inject retrieved context into prompt
const enrichedPrompt = `
${governancePreamble}
${relevantChunks.map(c => c.content).join('\n\n')}
${phaseTemplate}
`;

// 4. Call AI with enriched context
```

### Current Implementation:

**Vector DB exists but dormant:**
```typescript
// Vector tables exist:
// - bealigned_content (6 documents with embeddings)
// - bealigned_content_chunks (390 chunks with embeddings)

// But NO active retrieval:
// ❌ No RPC function: match_bealigned_chunks() doesn't exist
// ❌ No embedding generation for queries
// ❌ No semantic search
// ❌ Direct OpenAI call without vector context
```

**Status:** ❌ **Not being used** - Vector DB populated but not queried

**Gap Analysis:**
1. ✅ Embeddings stored (OpenAI text-embedding-ada-002)
2. ✅ 390 chunks across all 7 phases
3. ✅ BeH2O content, GPT samples, governance docs
4. ❌ No vector search functions
5. ❌ No semantic retrieval in AI calls
6. ❌ pgvector extension status unclear
7. ❌ No similarity search indexes

---

## 6. Edge Functions Architecture

### GPT Blueprint Expects:

**Separate focused functions:**

```
supabase/functions/
  ai-reflect/          # BeAligned 7-phase reflection
    index.ts
  ai-clear/            # CLEAR scoring & rewrite
    index.ts
  ai-balance/          # B.A.L.A.N.C.E. boundary helper
    index.ts
  stripe-webhooks/     # Subscription lifecycle
    index.ts
  events-telemetry/    # Analytics
    index.ts
```

### Current Implementation:

**Many functions (some unused):**

```
supabase/functions/
  chat/                ✅ Main AI chat (active)
  chat-ai/             ❓ Unclear purpose
  chat-ai-enhanced/    ❓ Unclear purpose
  ai-assistant/        ❓ May be legacy
  generate-ai-welcome/ ✅ Welcome message generation
  check-phase-completion/ ❓ Unclear if used
  process-admin-feedback/ ✅ Admin feedback system
  update-vector-content/  ⚠️ Vector update (not used)
  export-pdf/          ✅ PDF export
  stripe-checkout/     ✅ Stripe integration
  stripe-webhook/      ✅ Stripe webhooks
  send-email/          ✅ Email sending
  send-transcript/     ✅ Transcript delivery
  ... (many more)
```

**Status:** ⚠️ **Cluttered** - Many functions, unclear which are active

**Key Differences:**
1. **No `ai-clear`**: Missing CLEAR scoring system entirely
2. **No `ai-balance`**: Missing B.A.L.A.N.C.E. boundary helper
3. **Multiple chat functions**: Confusing which is canonical
4. **Function bloat**: ~28 functions vs GPT's focused 5

---

## 7. Missing Features from GPT Blueprint

### ❌ CLEAR Scoring System

**Expected:**
- Rate messages on CLEAR dimensions (0-10)
- Suggest edits for improvement
- Provide rewritten versions
- Store scores in `communications` table

**Current:** Does not exist

---

### ❌ Alignment Scores

**Expected:**
```sql
reflections.alignment_score numeric(4,2)
```
- Score how well reflection aligns with BeH2O principles
- Track over time per user
- Use for analytics

**Current:** No alignment scoring at all

---

### ❌ Coach Feedback System

**Expected:**
```sql
coach_feedback (
  coach_id uuid,
  reflection_id uuid,
  feedback_text text,
  alignment_tags text[]
)
```
- Coaches can review parent reflections
- Provide guidance and feedback
- Tag alignment qualities

**Current:** Only admin feedback, no coach role

---

### ❌ Communications Management

**Expected:**
```sql
communications (
  type: draft | sent | received,
  message_body text,
  clear_score numeric(4,2),
  target_audience text
)
```
- Draft messages before sending
- Store sent/received communications
- Track CLEAR scores
- Target-audience context

**Current:** Messages are just chat history, not structured communications

---

### ❌ B.A.L.A.N.C.E. Boundary Helper

**Expected:** Separate Edge Function for boundary scenarios
- Balanced approach
- Aligned with child's needs
- Necessary (not excessive)
- Constructive
- Evolving

**Current:** Does not exist

---

## 8. Governance Principles Alignment

### GPT Principles:
1. **Safeguard childhoods** (primary mission)
2. **Alignment over neutrality** (not mediator stance)
3. **Third-side hosting** (Ury framework)
4. **Non-therapeutic, non-legal** (boundaries clear)
5. **Trauma-informed, non-judgmental** tone
6. **Child-impact lens** always applied

### Current Implementation:

**From `phase_prompts` database:**
- ✅ Child-centered focus ("Safeguarding Childhoods" principle)
- ✅ BeH2O methodology (Strength, Flow, Third Side)
- ✅ Non-judgmental tone
- ✅ Trauma-informed approach
- ⚠️ "Alignment over neutrality" not explicit
- ⚠️ Third-side hosting not explicit

**From hardcoded Edge Function:**
```typescript
BeH2O® Principles:
- Be Strong: Communicate with clarity and grounded purpose
- Flow: Be responsive, not reactive, while moving forward
- The Third Side: Hold space for all perspectives while centering the child
- Safeguarding Childhoods: The goal is protecting the child's experience
```

**Status:** ✅ **Generally aligned** but less explicit about key frameworks

---

## 9. Phase Structure Comparison

### GPT Blueprint Phases:

1. **Issue** - Name the situation
2. **Feelings** - Explore emotions (surface → deeper)
3. **Why** - Connect to values/purpose
4. **Perspective** - Co-parent's view
5. **Options** - Brainstorm aligned solutions
6. **Choose** - Select preferred approach
7. **Message** - Craft communication

### Current Implementation:

1. **LET'S NAME IT** - Issue naming ✅
2. **WHAT'S BENEATH THAT?** - Feelings exploration ✅
3. **YOUR WHY** - Core values ✅
4. **STEP INTO YOUR CO-PARENT'S SHOES** - Perspective-taking ✅
5. **SEE THROUGH YOUR CHILD'S EYES** - Child's perspective ✅
6. **EXPLORE ALIGNED OPTIONS** - Options generation ✅
7. **CHOOSE + COMMUNICATE** - Selection + messaging ✅

**Status:** ✅ **Fully aligned** - 7-phase structure matches perfectly

**Minor differences:**
- Phase 5: GPT doesn't explicitly separate child's view (may be implied in perspective)
- Current implementation is more explicit about child-centering

---

## 10. Security & Compliance

### GPT Blueprint:
- ✅ RLS everywhere (no client bypass)
- ✅ JWT claims for roles
- ✅ PII minimization
- ✅ Encryption (Supabase + SecureStore)
- ✅ Audit logs for AI calls
- ⚠️ Rate limiting via Upstash

### Current Implementation:
- ✅ RLS policies active
- ✅ Auth via Supabase
- ✅ Secure token storage
- ❌ Audit logs unclear
- ❌ Rate limiting not visible

**Status:** ⚠️ **Mostly aligned** but audit/rate-limiting unclear

---

## Priority Recommendations

### 🔴 Critical (Do First)

1. **Activate Vector Database** ⭐ TOP PRIORITY
   - Install/verify pgvector extension
   - Create `match_bealigned_chunks()` RPC function
   - Integrate semantic retrieval into AI calls
   - Add vector search to `chat/index.ts`

3. **Add Alignment Scoring**
   - Add `alignment_score` to sessions/reflections
   - Implement scoring logic in AI responses
   - Track over time for analytics

### 🟡 High Priority (Do Next)

4. **Implement CLEAR Scoring**
   - Create `ai-clear` Edge Function
   - Add CLEAR evaluation logic
   - Create `communications` table
   - Build CLEAR rewrite UI

5. **Structured JSON Outputs**
   - Design phase-specific output schemas
   - Update AI prompts to enforce structure
   - Parse and store structured data
   - Use for better UX and analytics

6. **Cleanup Edge Functions**
   - Document which functions are active
   - Archive or remove unused functions
   - Consolidate duplicate chat functions
   - Create function inventory

### 🟢 Medium Priority (Nice to Have)

7. **Coach Feedback System**
   - Create `coach_feedback` table
   - Add coach role to auth
   - Build coach review interface
   - Implement feedback workflow

8. **File-based Governance Backup**
   - Export `phase_prompts` to markdown files
   - Version control in git
   - Sync mechanism between DB and files
   - Enable local development without DB

9. **Analytics & Metrics**
   - Alignment score trends
   - CLEAR improvement tracking
   - Phase completion rates
   - Export capabilities

---

## Conclusion

Your current BeAligned app has a **solid foundation** with Expo, Supabase, phase-based flow, and database-driven governance.

**Major Gaps to Close:**
1. ❌ Vector DB dormant (not being used) - **TOP PRIORITY**
2. ❌ No alignment scoring
3. ❌ No CLEAR system
4. ❌ Simple JSON outputs vs structured contracts
5. ❌ Missing coach feedback system

**What Works Well:**
1. ✅ **OpenAI (gpt-4o) as AI engine** - Intentional choice, proven performance
2. ✅ Phase structure perfectly aligned (7 phases)
3. ✅ Database-driven governance (more flexible than files)
4. ✅ BeH2O principles embedded
5. ✅ Supabase Edge Functions architecture
6. ✅ Vector content populated and ready (390 chunks)

**Next Steps:**

1. ✅ **Architecture:** OpenAI confirmed as AI provider
2. ⭐ **Activate:** Wake up the vector database (TOP PRIORITY)
3. 🎯 **Enhance:** Add alignment scores and structured outputs
4. 🎯 **Implement:** CLEAR scoring system
5. 🧹 **Cleanup:** Audit and document Edge Functions

The foundation is strong and architectural decisions are clear - now focus on activating existing infrastructure (vector DB) and enhancing outputs (alignment scores, CLEAR system).

# BeAligned v3.1: Learning Enhancements Specification

**Version:** 3.1 (Proposed)
**Status:** Draft
**Author:** Generated via governance consolidation (Oct 21, 2025)
**Baseline:** v3.0 governance snapshot (Oct 21, 2025)

---

## Executive Summary

BeAligned v3.1 extends the v3.0 foundation with enhanced learning capabilities, focusing on iterative improvement through data-driven feedback loops, admin tools for content stewardship, and refined phase-specific reflection balancing.

**Core Philosophy:**
Continue v3.0's "guide the AI, don't tell the AI" approach while adding systematic feedback mechanisms to improve conversational intelligence over time.

**Target Delivery:** Q1 2026

---

## 1. Phase 5 Reflection Balancing

**Current State (v3.0):**
- Phase 5 canonical name discrepancy: code uses "options" but should be "child"
- Limited exemplar coverage for child-centered perspective-taking
- No specific guidance on balancing parent/coparent/child perspectives

**Proposed Enhancements:**

### 1.1 Canonical Phase 5 Naming
- **Action:** Normalize Phase 5 to canonical "child" (matching phases 1-4, 6-7 pattern)
- **Implementation:**
  - Update `phaseMeta.ts` with "options" → "child" alias
  - Create migration: `20260115000000_phase5_retag_child.sql`
  - Add retrieval scoring: +0.10 for "child", -0.10 penalty for "options"
  - Update governance with correct phase name
- **Rationale:** Consistency with Phase 4 canonical naming approach

### 1.2 Three-Lens Balancing
**Problem:** Current Phase 5 guidance lacks structure for integrating all three perspectives (parent, co-parent, child).

**Solution: Three-Lens Integration Pattern**

Add exemplars teaching AI to:
1. **Acknowledge** the parent's perspective (Phase 3 recap)
2. **Honor** the co-parent's potential needs (Phase 4 recap)
3. **Center** the child's experience (Phase 5 focus)

**Example Exemplar:**
```sql
INSERT INTO v3_vector.exemplars (phase, why, input_snippet, response_snippet, tags)
VALUES (
  'child',
  'Teach three-lens balance: parent need, coparent context, child experience',
  'I just want my daughter to feel secure',
  'You''re holding your need for her security. And from what we explored, your co-parent might be navigating their own fears about connection. If your daughter could speak, what might she be noticing between you both?',
  ARRAY['three_lens', 'balance', 'child_centered', 'phase5']
);
```

**Tags to Add:**
- `three_lens` - Balances all perspectives
- `child_centered` - Keeps child as primary focus
- `integration` - Synthesizes earlier phases

### 1.3 Child Voice Activation
**Pattern:** Use "If [child name] could speak..." framing to elicit authentic child-perspective thinking

**Exemplar Coverage Needed:**
- 5-10 exemplars per age bracket (toddler, elementary, teen)
- Tags: `child_voice`, `age:toddler`, `age:elementary`, `age:teen`

---

## 2. Phase 6 Co-Creation Reinforcement

**Current State (v3.0):**
- Phase 6 has strong three-why recap requirement
- Two invitation-style options pattern established
- Some users skip reflection and jump to action

**Proposed Enhancements:**

### 2.1 Why Recap Quality Check
Add governance rule: If three-why recap is missing or incomplete, **do not** advance to options.

**Implementation:**
- Add `why_recap_complete` signal to Phase 6 readiness calculation
- Detection logic in `context.ts`:
  ```typescript
  export function hasCompletedWhyRecap(flowState: any): boolean {
    const phase6State = flowState?.phase6 || {}
    return !!(
      phase6State.parentWhy &&
      phase6State.coparentWhy &&
      phase6State.childWhy
    )
  }
  ```
- Governance update: "Do not offer options until all three whys are named and confirmed"

### 2.2 Options Alignment Scoring
**Problem:** Users may choose options that don't align with stated values/whys.

**Solution: Alignment Reflection Pattern**

Before finalizing option choice, prompt user to check alignment:
> "You mentioned [option]. How does this connect back to [parent why], [coparent need], and [child experience]?"

**Implementation:**
- Add substate to Phase 6: `why_recap` → `options` → `alignment_check` → `reengage`
- Add exemplars with `alignment_check` tag
- Only advance to Phase 7 after alignment confirmation

### 2.3 Invitation Language Reinforcement
Strengthen "invitation over direction" tone through additional exemplars:

**Preferred Patterns:**
- "One possibility might be..."
- "Some parents in similar situations have found..."
- "If it feels right, you could explore..."

**Avoid:**
- "You should..."
- "The best approach is..."
- "I recommend..."

**Action:** Add 10+ exemplars with `invitation_tone` tag across various situations

---

## 3. Admin Retraining Interface

**Purpose:** Enable Trina and admin team to inject feedback-driven learning without code deployments

**Current Gap:** No UI for content management - all exemplars/flows require SQL

### 3.1 Admin Content Dashboard

**Features:**
1. **View Phase Health** - Display `admin_phase_health` view results
2. **Exemplar Management:**
   - Create new exemplars (phase, tags, snippets, why)
   - Edit existing exemplars
   - Approve/reject pending exemplars
   - Bulk tag operations
3. **Flow Snippet Management:**
   - Create/edit flow snippets (kind, phase, content)
   - Preview variable substitution
4. **Coaching Feedback Integration:**
   - Tag conversations for exemplar extraction
   - Convert real interactions → exemplars with one click
5. **Audit & Health:**
   - One-click integrity audit (calls `admin-audit-integrity` function)
   - Phase coverage visualization
   - Tag distribution analytics

**Technical Stack:**
- New route in React Native app: Admin section
- Supabase RLS policies for admin-only access
- Form UI components for exemplar creation
- Integration with `v3_vector.exemplars` and `v3_vector.flows` tables

**Priority:** High - Enables rapid iteration without code changes

### 3.2 Batch Feedback Processing

**Workflow:**
1. Trina identifies coaching session with valuable pattern
2. Tags conversation in admin dashboard
3. Dashboard extracts relevant turn (user input + AI response)
4. Auto-populates exemplar form:
   - Phase (from conversation metadata)
   - Input snippet (user message)
   - Response snippet (AI message or edited version)
   - Suggested tags (AI-assisted)
5. Trina refines/approves
6. Exemplar added to database with `status='approved'`, `steward='Trina'`
7. Immediately available for retrieval (no deployment needed)

**Implementation:**
- New table: `admin_feedback_queue`
- Edge function: `admin-process-feedback`
- UI component: Feedback review interface

---

## 4. Phase 7 Contextual Drafting

**Current State (v3.0):**
- Strong anti-automation stance (no filler templates)
- Co-creation emphasis on user language
- CLEAR framework for fit-check only

**Proposed Enhancements:**

### 4.1 CLEAR Message Tuning Patterns

Add exemplars for post-draft refinement based on specific CLEAR elements:

**Tuning Dimensions:**
- **Tone:** "Does this feel too harsh/soft?"
- **Length:** "Is this too long for text/too short for email?"
- **Clarity:** "Will they understand what I'm asking?"
- **Alignment:** "Does this connect to our shared goal?"

**Implementation:**
- Add `clear_tuning` kind to flows table
- Exemplars with tags: `tune:tone`, `tune:length`, `tune:clarity`, `tune:alignment`
- Substate after `fitcheck`: `tune` (optional, user-initiated)

### 4.2 Message Context Awareness

**Problem:** Message tone may differ for:
- Text vs. email
- During conflict vs. calm period
- First outreach vs. ongoing dialogue

**Solution: Context Flags**

Track in Phase 7 state:
```typescript
interface Phase7Context {
  userLanguage?: any
  messageContext?: {
    medium: 'text' | 'email' | 'in_person' | 'other'
    relationship_state: 'conflict' | 'neutral' | 'collaborative'
    message_history: 'first_outreach' | 'ongoing' | 'repair'
  }
}
```

Use context to retrieve appropriate exemplars:
- `medium:text` → shorter, simpler language
- `medium:email` → structured, detailed
- `relationship_state:conflict` → extra validation, grounding
- `relationship_state:collaborative` → warmth, partnership tone

**Action:** Add 20+ context-aware exemplars across dimensions

### 4.3 Draft Iteration Limit

**Problem:** Users may over-iterate, losing authentic voice.

**Solution:** Soft limit at 3 refinement cycles

After 3 iterations:
> "You've refined this message thoughtfully. Sometimes, sending something good enough is better than waiting for perfect. Does this feel ready, or is there one more thing that needs adjusting?"

---

## 5. Embedding Generation & Semantic Retrieval

**Current Gap:** All migrations use placeholder vector embeddings (`ARRAY_FILL(0::float, ARRAY[1536])`)

**Priority:** Critical for v3.1 - without this, retrieval is not semantic

### 5.1 Embedding Pipeline

**Implementation:**
1. **Migration Script Enhancement:**
   - Create utility: `generate_embeddings.ts`
   - Reads exemplars/flows with placeholder embeddings
   - Calls OpenAI Embeddings API (`text-embedding-3-small`)
   - Updates records with real vector embeddings

2. **RPC Function:**
   ```sql
   CREATE OR REPLACE FUNCTION v3_vector.search_exemplars(
     query_embedding vector(1536),
     phase_filter text DEFAULT NULL,
     tag_filters text[] DEFAULT NULL,
     k_limit int DEFAULT 10
   )
   RETURNS TABLE (
     id uuid,
     phase text,
     input_snippet text,
     response_snippet text,
     tags text[],
     steward text,
     status text,
     similarity_score float
   )
   ```

3. **Chat-v3 Integration:**
   - Replace placeholder `retrieveContext()` with real implementation
   - Generate embedding for `userInput`
   - Call `v3_vector.search_exemplars()`
   - Apply tag-based boosting (already implemented)

**Action Items:**
- Create `tools/generate_embeddings.ts` script
- Create `20260120000000_vector_search_functions.sql` migration
- Update `chat-v3/index.ts` to use real retrieval
- Test semantic search quality

### 5.2 Embedding Cost Management

**Estimated Costs:**
- 100 exemplars × $0.00002/1K tokens ≈ $0.002
- 50 flows × $0.00002/1K tokens ≈ $0.001
- **Total one-time:** ~$0.01

**Ongoing Costs:**
- Per user query embedding: ~$0.00002
- 1000 queries/day = $0.02/day = $0.60/month

**Budget:** Minimal - not a constraint

---

## 6. Telemetry & Monitoring Enhancements

**Current State (v3.0):**
- Phase jump logging (turn ≤ 2)
- Non-canonical phase key warnings
- Basic conversation traces

**Proposed Additions:**

### 6.1 Readiness Score Tracking

**Purpose:** Understand when AI is over/under-advancing phases

**Metrics to Track:**
- Average readiness at advancement (by phase)
- Force-advance frequency (reprompt exhaustion)
- Readiness drift over time

**Implementation:**
- Weekly aggregation query on `conversation_traces`
- Dashboard visualization in admin interface
- Alert if avg readiness < 0.6 or > 0.9 (calibration issue)

### 6.2 Tag Usage Analytics

**Metrics:**
- Most/least used tags in retrieval
- Tag co-occurrence patterns
- Tags with low retrieval scores (candidates for removal)

**Use Case:** Identify which tags drive quality vs. noise

### 6.3 User Feedback Integration

**Simple 1-5 Star Rating:**
- After each AI response, optional rating
- Store in `conversation_traces.user_rating`
- Aggregate by phase, tags, model
- Identify low-rated patterns for improvement

**Implementation:**
- Add rating UI component to chat interface
- Update traces table schema
- Weekly review of <3-star responses

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Implement embedding generation pipeline
- [ ] Deploy real semantic retrieval in chat-v3
- [ ] Create admin dashboard skeleton
- [ ] Add user rating component to chat UI

### Phase 2: Content & Tools (Weeks 5-8)
- [ ] Normalize Phase 5 canonical naming
- [ ] Create Phase 5 three-lens exemplars (20+)
- [ ] Build exemplar management UI in admin dashboard
- [ ] Implement batch feedback processing workflow

### Phase 3: Refinement (Weeks 9-12)
- [ ] Add Phase 6 alignment check pattern
- [ ] Create Phase 7 contextual drafting exemplars
- [ ] Implement readiness score tracking
- [ ] Deploy tag usage analytics

### Phase 4: Polish & Launch (Weeks 13-16)
- [ ] User acceptance testing with Trina
- [ ] Performance tuning (retrieval latency)
- [ ] Documentation updates
- [ ] v3.1 launch & governance snapshot

---

## Success Metrics

**Quality Indicators:**
1. **Phase Progression Smoothness:**
   - Reduce early phase jumps (<2 turns) by 50%
   - Avg readiness at advancement: 0.7-0.8 (sweet spot)

2. **Content Coverage:**
   - All phases have ≥20 approved exemplars
   - All phases have ≥5 flow snippets per kind
   - Tag distribution balanced (no single tag >20% of content)

3. **User Satisfaction:**
   - Avg rating ≥ 4.0 stars across all phases
   - <10% of responses rated ≤2 stars

4. **Admin Efficiency:**
   - Time to add exemplar: <5 minutes (vs. 30+ minutes with SQL)
   - Feedback processing: <10 minutes per coaching session

5. **System Health:**
   - Zero critical integrity audit issues
   - <5% non-canonical phase key warnings

---

## Risks & Mitigation

### Risk 1: Embedding Cost Escalation
**Mitigation:**
- Implement caching for common queries
- Monitor daily spend (alert at >$5/day)
- Option to disable semantic search if needed

### Risk 2: Admin UI Complexity
**Mitigation:**
- Start with minimal viable interface
- Iterative UX testing with Trina
- Prioritize exemplar creation over advanced analytics

### Risk 3: Over-Engineering Content Rules
**Mitigation:**
- Maintain "guide don't tell" philosophy
- Regular alignment testing against BeAligned GPT baseline
- Avoid rigid completion criteria

### Risk 4: Semantic Retrieval Quality
**Mitigation:**
- A/B test semantic vs. keyword retrieval
- Manual review of top-k results for quality
- Fallback to GPT baseline if retrieval degrades

---

## Future Considerations (v3.2+)

1. **Multi-Modal Support:**
   - Voice input/output for accessibility
   - Image-based reflection prompts

2. **Personalization:**
   - User preference learning (tone, pacing)
   - Adaptive phase thresholds per user

3. **Collaboration Features:**
   - Co-parent joint sessions
   - Shared reflection spaces

4. **Integration:**
   - Calendar integration for custody schedules
   - Document generation (parenting plans)

5. **Advanced Analytics:**
   - Conversation clustering (identify common patterns)
   - Predictive modeling (phase completion likelihood)

---

## Appendix A: Example New Exemplars

### A.1 Phase 5: Three-Lens Balance
```sql
INSERT INTO v3_vector.exemplars (phase, why, input_snippet, response_snippet, tags, steward, status)
VALUES (
  'child',
  'Balance parent need, coparent context, child experience',
  'I want my son to see healthy conflict resolution',
  'You''re modeling healthy conflict for your son. Your co-parent may be learning their own way. What might your son be picking up from both of you right now?',
  ARRAY['three_lens', 'child_centered', 'modeling', 'phase5'],
  'Trina',
  'approved'
);
```

### A.2 Phase 6: Alignment Check
```sql
INSERT INTO v3_vector.flows (flow_node, content, phase, kind, tags, steward, status)
VALUES (
  'p6_alignment_check',
  'Before we move forward, let''s check: how does [option] connect to what matters most to you, what your co-parent might need, and what your child would hope for?',
  'choose',
  'alignment_check',
  ARRAY['phase6', 'reflection', 'three_lens'],
  'Trina',
  'approved'
);
```

### A.3 Phase 7: Context-Aware (Text Medium)
```sql
INSERT INTO v3_vector.exemplars (phase, why, input_snippet, response_snippet, tags, steward, status)
VALUES (
  'message',
  'Shorter, simpler language for text medium',
  'This is for a text message',
  'For a text, let''s keep it brief and clear. One sentence about what you need, one about why it matters. What''s the core ask?',
  ARRAY['medium:text', 'brevity', 'clarity', 'phase7'],
  'Trina',
  'approved'
);
```

---

## Appendix B: Database Schema Changes

### New Tables

**admin_feedback_queue:**
```sql
CREATE TABLE admin_feedback_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  turn_index int NOT NULL,
  user_input text,
  ai_response text,
  suggested_phase text,
  suggested_tags text[],
  status text DEFAULT 'pending', -- pending, approved, rejected
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
```

**conversation_ratings:**
```sql
CREATE TABLE conversation_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  turn_index int NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  created_at timestamptz DEFAULT now()
);
```

### Schema Modifications

**conversation_traces:**
```sql
ALTER TABLE conversation_traces ADD COLUMN user_rating int;
ALTER TABLE conversation_traces ADD COLUMN rating_feedback text;
```

---

*This specification is a living document. Updates should be tracked via version control and referenced against the v3.0 governance snapshot baseline.*

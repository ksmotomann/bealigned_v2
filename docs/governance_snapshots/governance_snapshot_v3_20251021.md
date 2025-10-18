# BeAligned v3 Governance Snapshot
**Date:** October 21, 2025
**Status:** Production Active
**Purpose:** Frozen record of v3's operational philosophy — "known good state" for rollback/comparison

---

## System Architecture

**Engine:** `supabase/functions/chat-v3/index.ts`
**Governance:** `supabase/functions/shared/governance/systemPrompt.ts`
**Phase Metadata:** `supabase/functions/shared/flow/phaseMeta.ts`
**Composer:** `supabase/functions/shared/flow/composer.ts`
**Context Detection:** `supabase/functions/shared/flow/context.ts`
**Phase 7 Logic:** `supabase/functions/shared/flow/phase7.ts`

---

## Canonical Phase Structure

| Phase | Canonical Key | Label | Emoji | Aliases |
|-------|---------------|-------|-------|---------|
| 1 | `issue` | Let's Name It | 🌿 | - |
| 2 | `feelings` | What's Beneath That | 🌊 | - |
| 3 | `why` | Why This Matters | 🌞 | - |
| 4 | `shoes` | Step Into Your Co-Parent's Shoes | 🥿 | `perspective` (deprecated) |
| 5 | `child` | See Through Your Child's Eyes | 👶 | `options` |
| 6 | `choose` | Choose Small Next Steps | 🧭 | - |
| 7 | `message` | Co-Author Your CLEAR Message | 🕊️ | - |

**Alias Resolution:** `phaseMeta.ts:canonicalPhaseKey()`
**Telemetry:** Non-canonical keys log warning to console (chat-v3/index.ts:372-375)

---

## Core Governance Principles

### BeH2O® Methodology
- **Strength** (beryllium-like clarity)
- **Stability** (shared goals)
- **Flow** (water-like responsiveness)
- **Mindset drives behavior**
- **The Third Side** - hold space for all perspectives
- **Safeguarding Childhoods** - center the child's needs

### BeAligned™ Mindset
- Purpose over position
- Reflection before reaction
- Alignment > Agreement
- Child-centered lens always
- Warmth, neutrality, and reflection (NOT therapist/mediator)
- Guide, don't tell - let AI conversational intelligence emerge

### Formatting & Labels (Added: Oct 21, 2025)
- **Do not print phase headings** - UI shows phase name/emoji
- **Use canonical phase concepts** - Phase 4 is "Step Into Your Co-Parent's Shoes"
- **Avoid invented labels** like "Perspective"
- **Keep responses as plain conversational text**
- **Never start with markdown headings (##), emoji labels, or phase titles**

### Pronoun Mirroring (Added: Oct 20, 2025)
- Mirror user's gendered pronouns ("he/she") in reflections
- Use neutral "they" only when pronoun unknown/unspecified
- Remain consistent within conversation
- No alternating unless user changes
- Creates personalization without assumptions

---

## Retrieval Scoring Boosts (chat-v3/index.ts)

### Base Scoring (lines 79-103)
```typescript
s = item.similarity_score || 0.5  // Base semantic score
s += (item.weight ?? 1) * 0.02    // Weight boost
```

### Steward Boosts (lines 84-85)
- **Trina:** +0.15
- **admin:** +0.08

### Phase Match Boost (line 88)
- **Same phase:** +0.10

### Context-Specific Boosts

**Phase 2 (Feelings):**
- `closure_and_ready` tag: +0.15 (when user says "no" after depth)
- `phase_transition` tag: +0.06 (issue → feelings bridge)

**Phase 6 (Choose):**
- `why_recap` kind: +0.12 (three-why recap)
- `option_invite` kind: +0.08 (invitation over directive)
- `bridge` kind: +0.06
- `lens_tie` kind: +0.06
- `reengage` kind: +0.06
- `confirm_why` kind: +0.05

**Phase 7 (Message):**
- `coauthor_seed` kind: +0.10 (user's own language)
- `collect` kind: +0.06 (when vars missing)
- `clear_frame` kind: +0.05 (after seed exists)
- `contain` kind: +0.04

**Pronoun Mirroring (lines 113-123):**
- `pronoun:he` tag + user said "he/him/his": +0.10
- `pronoun:she` tag + user said "she/her/hers": +0.10
- `pronoun:unknown` tag + no pronoun detected: +0.05

**Phase 4 Canonical Normalization (lines 125-129):**
- `phase=shoes` content: +0.10
- `phase=perspective` content: -0.10 (legacy penalty)

### Additional Boosts (filterAndBoostResults, lines 250-305)

**Closure Detection:**
- `containment` tag + user said closure: +0.10

**Boundary Containment:**
- `containment` tag + user set boundary ("no"/"not now"/"I'm good"): +0.15

**Emotional Intensity:**
- `containment` tag + intensity ≥ 0.75: +0.10

**Coaching Feedback:**
- `coaching` tag: +0.08

---

## Active Exemplar Tag Categories

### Phase Transitions
- `closure_and_ready` - Containment → meaning bridge (Phase 2 → 3)
- `phase_transition` - General phase bridges

### Pronoun Mirroring
- `pronoun:he` - Masculine pronoun examples
- `pronoun:she` - Feminine pronoun examples
- `pronoun:unknown` - Neutral fallback

### Phase 4 Canonical
- `phase4:shoes` - Canonical Phase 4 content
- `phase4:perspective` - Legacy (deprecated, penalized)

### Tone & Style
- `tone:soft`
- `tone:gentle`
- `tone:warm`
- `tone:empathetic`
- `tone:validating`
- `tone:grounded`
- `tone:honoring`
- `tone:purposeful`

### Coaching & Refinement
- `coaching` - Real-world feedback-driven
- `containment` - Boundary honoring
- `bridge_to_meaning` - Phase 2 → 3 transition

---

## Phase-Specific Guidance

### Phase 1: Issue (Let's Name It)
**Objective:** Help user name the situation clearly without judgment

**Key Patterns:**
- Warm validation using varied acknowledgments
- Open exploration: "What's sticking with you?"
- No fixing, just naming

**Containment Before Progression:**
- If user signals completion ("that's it", "nothing more"), **contain** and do not invite depth
- Use containment bridge: "You named what matters. Before we go deeper, notice how that lands."
- **FORBIDDEN after completion:** "explore", "unpack", "look deeper", "beneath"

**Readiness Signals:**
- Described situation with specificity
- Some emotional language present
- Engagement with conversation

### Phase 2: Feelings (What's Beneath)
**Objective:** Explore feelings beneath the surface

**Key Patterns:**
- Gentle probing for emotional layers
- Validate without over-analyzing
- Use conversational language over clinical

**Honoring Boundaries:**
- If user declines ("no", "not now", "I'm good"), **contain** instead of re-inviting
- Soft closure: "Got it. That's enough for now."
- Avoid follow-up questions after clear boundary

**Containment → Meaning Bridge (NEW: Oct 19, 2025):**
- If user says "no" **after** sustained emotional work:
  - Contain first: "Got it. That's enough for now."
  - Then bridge to meaning: "As you hold that, what does this show you about what matters?"
  - This signals readiness for reflection, not disengagement
  - Move to Phase 3 only after user affirms/responds

**Child Impact Nudge:**
- After feeling is named AND readiness ≥ 0.65 AND not asked recently:
  - "As you notice that feeling, how might that energy show up for your [child]?"
- Use sparingly - only when it serves reflection

**Readiness Signals:**
- Identified emotions beyond surface (anger → hurt)
- Some self-awareness emerging
- Willing to explore "what's beneath"

### Phase 3: Why (Why This Matters)
**Objective:** Connect to deeper values and purpose

**Key Patterns:**
- "What feels important about this to you?"
- "What are you hoping for - for your child, yourself, the relationship?"
- Listen for values and purpose statements

**Readiness Signals:**
- Articulated values or goals
- "For my child" or purpose language
- Connection to bigger picture

### Phase 4: Shoes (Step Into Your Co-Parent's Shoes)
**Canonical Name:** "Step Into Your Co-Parent's Shoes"
**Deprecated Alias:** "perspective" (penalized in retrieval)

**Objective:** Gentle perspective-taking without forcing

**Key Patterns:**
- "If your co-parent described this, how might they see it?"
- "What do you imagine they're feeling or needing?"
- Hold space for resistance - this is hard

**Readiness Signals:**
- Made authentic attempt at perspective-taking
- May still disagree, but showing understanding
- Less defensive language

### Phase 5: Child (See Through Your Child's Eyes)
**Objective:** Consider child's experience

**Key Patterns:**
- "What might your child be noticing?"
- Reflect on child's needs
- Balance everyone's needs

**Readiness Signals:**
- Recognition of child's experience
- Engaged with options
- Child-centered thinking visible

### Phase 6: Choose (Choose Small Next Steps)
**Objective:** Reflective co-creation of options

**CRITICAL:** Phase 6 MUST begin with three-why recap

**Flow:**
1. **Three-Why Recap** - Restate parent's why, co-parent's why, child's why
   - Make each feel relational and seen (not summary list)
   - Use grounded language: "Let's hold those in mind..."
2. **Bridge** - Pause with what's been named
3. **Confirm** - "Does that sound true to you?"
4. **Options** - Exactly TWO invitation-style possibilities
   - Use "One possibility might be..." language
   - Tie to child/coparent names if known
5. **Lens Tie** - Connect back to three lenses
6. **Re-engage** - "Which feels most aligned—or do you see another path?"

**Tone:** Invitation over direction. Co-creation, not prescription.

**Readiness Signals:**
- Engaged with options and shown preference
- Some ownership of next step
- Ready to move to expression

### Phase 7: Message (Co-Author Your CLEAR Message)
**Objective:** Integration and co-creation (NOT automation)

**CRITICAL:** This is collaboration, NOT AI generation

**Substates:** integrate → option → coauthor → fitcheck → contain

**Key Principles:**
- **PRESERVE user's language and agency**
- **COLLABORATE** on expression (never auto-generate)
- **NO FILLER TEMPLATES** - draft only when user provides language
- If user language missing, ask first
- Use CLEAR framework only AFTER co-authoring seed exists (fit-check polish only)
- Offer containment: "You don't have to send it today"
- Deep Think Mode available for complex situations

**CLEAR Framework (polish only, not generation):**
- **C**oncise - One issue at a time
- **L**isten-first - Show you heard them
- **E**xpress - Share your perspective
- **A**ligned - Anchor to shared goals
- **R**equest - Be specific

**Deep Think Mode:**
- Triggered when emotion ≥ 0.75 OR complexity ≥ 0.75
- Offers 48-hour pause for human-crafted Aligned Insight
- User choice: Outward, Inward, or Deep Think

---

## Response Sanitization

### stripPhaseHeadings() (composer.ts:463-497)
Removes AI-generated headings to prevent drift:
- Markdown headings starting with "Phase"
- Emoji-prefixed phase headings
- Common phase heading patterns
- Legacy "Perspective" labels specifically
- Cleans up extra whitespace

**Patterns Removed:**
```regex
/^#+\s*phase.*$/gmi
/^[🌿🌊🌞🥿👶🧭🕊️].*phase.*$/gmi
/^Phase \d+[:\s·•].*$/gmi
/^#+\s*Perspective.*$/gmi
/^Perspective[:\s·•].*$/gmi
```

---

## Non-Terminal Design Philosophy

**Core Principle:** Use conversational intelligence pattern recognition, NOT rigid rules

**Universal Completion Recognition:**
- Authentic engagement check
- Capacity indicator recognition (brief responses, closure language, resistance, repetition)
- Progress over perfection
- Advance when user shows understanding and authentic attempt

**Implementation Approach:**
- ✅ Conversational flow intelligence
- ✅ Contextual completion recognition
- ✅ Authentic effort detection
- ❌ NOT word detection
- ❌ NOT rigid criteria

**Per-Phase Recognition:**
- **Phase 1:** Named/described situation authentically (even if messy)
- **Phase 2:** Identified emotional layers beyond surface
- **Phase 3:** Connected to deeper why/values
- **Phase 4:** Made genuine attempt at perspective-taking (even if resistant)
- **Phase 5:** Considered child's experience with authentic reflection
- **Phase 6:** Engaged with solution possibilities or shown preference
- **Phase 7:** Shows commitment to action or message refinement

---

## Database Schema (v3_vector)

### Tables
- `v3_vector.flows` - Flow snippets (ack, bridge, contain, prompt, nudge)
- `v3_vector.exemplars` - Conversational examples with embeddings
- `v3_vector.principles` - BeH2O core principles (future use)

### Key Fields
- `phase` - Canonical phase key
- `tags` - Array of tags for retrieval scoring
- `kind` - Flow snippet type (Phase 6/7)
- `steward` - Content curator (Trina, admin)
- `status` - Approval status (only 'approved' content retrieved)
- `version_tag` - Content version (e.g., '2025-Q4')
- `embedding` - vector(1536) for semantic search
- `why` - Curator's intent note

### Status Filter
**CRITICAL:** Retrieval filters to `status='approved'` only (chat-v3/index.ts:242)

---

## Recent Enhancements (Oct 2025)

### Oct 19: Phase 2 → Phase 3 Transition
- Added 4 `closure_and_ready` exemplars
- Added 2 bridge flow snippets
- Governance updated with containment → meaning guidance
- Migration: `20251019000000_phase2_transition_to_meaning.sql`

### Oct 20: Pronoun Mirroring System
- Added 10 pronoun exemplars across Phases 2, 3, 4
- Added pronoun detection in enrichment.ts
- Added retrieval scoring for pronoun matching
- Governance updated with pronoun mirroring principles
- Migrations:
  - `20251020000000_pronoun_mirroring_examples.sql`
  - `20251020000001_pronoun_fallback_flow.sql`

### Oct 21: Phase 4 Canonical Naming
- Created `phaseMeta.ts` - single source of truth
- Normalized all "perspective" → "shoes" in database
- Added retrieval scoring: +0.10 shoes, -0.10 perspective
- Added `stripPhaseHeadings()` response sanitizer
- Updated governance with canonical naming
- Added telemetry for non-canonical keys
- Migration: `20251021000000_phase4_retag_shoes.sql`

---

## Configuration

### Environment Variables
- `RETRIEVAL_ENABLED` - Toggle retrieval (default: true)
- `OPENAI_API_KEY` - Required
- `SUPABASE_URL` - Required
- `SUPABASE_SERVICE_ROLE_KEY` - Required

### Flow Configuration (database-driven)
Table: `flow_config`
- `min_readiness_to_advance` - Threshold (default: 0.7)
- `max_reprompts` - Force advance after N reprompts
- `enabled` - Phase toggle
- `next_phase` - Advancement target
- `allow_deepthink` - Phase 7 Deep Think Mode

---

## Known Limitations & Future Work

### Current Gaps
1. **No actual semantic retrieval** - Placeholder returns empty array (lines 194)
2. **Flow snippet retrieval** - Not yet implemented (line 687)
3. **Embedding generation** - Migrations use placeholder vectors
4. **Phase 5 name discrepancy** - Code uses "options" but should be "child"

### Future Enhancements
1. Implement actual vector search with OpenAI embeddings
2. Populate flow snippet retrieval for data-driven composition
3. Generate real embeddings for exemplars
4. Normalize Phase 5 canonical naming
5. Admin retraining interface for batch feedback
6. Phase jump logging for transition analysis
7. Phase health monitoring dashboard

---

## Rollback Procedure

If v3 behavior degrades, revert to this snapshot:

1. **Code Files:**
   - Restore: `chat-v3/index.ts`, `systemPrompt.ts`, `phaseMeta.ts`, `composer.ts`
   - Redeploy: `npx supabase functions deploy chat-v3`

2. **Database:**
   - Check migration history
   - Identify changes after Oct 21, 2025
   - Restore via migration rollback or manual SQL

3. **Verification:**
   - Test Phase 2 → Phase 3 transition ("no" after depth)
   - Test pronoun mirroring (he/she/they)
   - Verify Phase 4 uses "shoes" not "perspective"
   - Check response sanitization (no phase headings)

---

## Maintenance Schedule

**Weekly (Fridays):**
- Review conversation_traces for phase progression patterns
- Check telemetry logs for non-canonical phase keys
- Review coaching feedback tags for new learnings

**Monthly:**
- Audit exemplar coverage across phases
- Review retrieval scoring effectiveness
- Update version_tag for new content

**Quarterly:**
- Major governance review
- Alignment testing against BeAligned GPT baseline
- Performance tuning (boost values, thresholds)

---

## Contact & Stewardship

**Primary Steward:** Trina
**Technical Lead:** Robert
**Intern Developer:** Anish

**Documentation Location:** `/docs/governance_snapshots/`
**Migration History:** `/supabase/migrations/`
**Spec Documents:** `/docs/specs/`

---

*This snapshot represents the operational state of BeAligned v3 as of October 21, 2025. All subsequent changes should be documented in future snapshots with reference to this baseline.*

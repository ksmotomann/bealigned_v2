# 🌊 BeAligned™ Master Assets - Holy Grail Reference

**Created:** October 12, 2025
**Status:** CANONICAL SOURCE OF TRUTH

---

## ⚠️ CRITICAL: Single Source of Truth

**All markdown files in `assets/master/` are the HOLY GRAIL for this project.**

These files represent the definitive, canonical source of truth for:
- BeH2O® principles and methodology
- BeAligned™ operational instructions
- Flow Engine architecture and governance
- All implementation guidance

**NO OTHER SOURCE should contradict or override these master files.**

---

## 📁 Master Assets Inventory

### **Core Governance & Philosophy**

| File | Purpose | Used By |
|------|---------|---------|
| **governance.md** | Flow Engine governance rules, phase progression logic | `supabase/functions/chat-v2/governance.ts` |
| **philosophy.md** | BeH2O® principles, mindset, "The Third Side" | `supabase/functions/chat-v2/governance.ts` |
| **architecture.md** | System architecture, FlowState model, technical design | Development team, architectural decisions |
| **readme.md** | Master documentation overview and navigation | Development team |

### **GPT Instructions (Converted from .txt)**

| File | Purpose | Original Source | Used By |
|------|---------|-----------------|---------|
| **instructions.md** | BeAligned™ Beta Lite operational instructions | `BeAligned_Lite_Revised_Instructions.txt` | `supabase/functions/chat-v2/governance.ts` |
| **knowledge.md** | BeAligned™ GPT knowledge base, BeH2O® content | `BeAligned_Lite_Knowledge_Page.txt` | `supabase/functions/chat-v2/governance.ts` |

### **Implementation Guides**

| File | Purpose | Used By |
|------|---------|---------|
| **prompt_library.md** | Prompt templates, variations, coaching mindsets | `supabase/functions/chat-v2/prompt-library.ts` |
| **prompts.md** | Additional prompt guidance | Edge functions |
| **json.md** | JSON response format specifications | `supabase/functions/chat-v2/types.ts` |
| **typescript.md** | TypeScript interfaces and types | Type definitions |
| **edge_functions.md** | Supabase Edge Function implementation patterns | All edge functions |
| **client_hooks.md** | React hooks documentation | Frontend hooks |
| **context.md** | Context management, FlowState handling | State management |

### **User-Facing Content**

| File | Purpose | Size | Used By |
|------|---------|------|---------|
| **Reflection.md** | Reflection flow documentation | 6.9KB | User documentation |
| **guide_short.md** | Short user guide (Editor's Guidebook) | 39KB | Onboarding, help system |
| **guide_long.md** | Comprehensive guide | 1.2MB | Advanced users, training |

### **Reference Assets**

| File | Purpose | Size | Used By |
|------|---------|------|---------|
| **feelings.jpg** | Feelings reference chart | 304KB | UI modals, help system |
| **needs.jpg** | Needs reference chart | 301KB | UI modals, help system |

---

## 🔒 Governance Rules

### **1. Master Files Are Read-Only References**

- Master files in `assets/master/` should be treated as **canonical references**
- Implementation code may adapt these principles for technical requirements, BUT:
  - Core BeH2O® principles MUST NOT be violated
  - Phase flow logic MUST align with master governance
  - Voice & tone guidelines MUST be preserved

### **2. All Code References Master**

Every implementation file that embodies BeAligned™ logic MUST include header comments referencing the master source:

```typescript
/**
 * [Component/Module Name]
 * Based on assets/master/[relevant-file].md
 *
 * Purpose: [Brief description]
 * Master Reference: [Specific section if applicable]
 */
```

**Example (already implemented):**
```typescript
/**
 * BeAligned™ Governance - System Prompt Builder
 * Based on assets/master/instructions.md (GPT operational instructions)
 * and assets/master/governance.md (flow engine governance)
 * and assets/master/knowledge.md (BeH2O® principles)
 */
```

### **3. Change Approval Process**

**To modify master files:**
1. Propose changes with clear rationale
2. Verify alignment with BeH2O® methodology
3. Obtain approval from Trina Nudson (Founder, The Layne Project®)
4. Document change in file header with date and reason
5. Update all dependent implementation code

**To modify implementation code:**
1. Verify change aligns with master files
2. If conflict arises, master files take precedence
3. Document alignment in code comments

### **4. Testing Against Master**

All AI behavior testing MUST reference master files:
- **Test scenarios** should be derived from `instructions.md`
- **Expected behavior** should match `governance.md` phase guidance
- **Voice/tone validation** should align with `philosophy.md`
- **GPT parity** should use sampling data compared against master instructions

---

## 📊 Current Implementation Status

### ✅ **Files Currently Referencing Master:**

1. **`supabase/functions/chat-v2/governance.ts`**
   - References: `instructions.md`, `governance.md`, `knowledge.md`
   - Status: ✅ Header comments present
   - Last Updated: October 12, 2025

### 🔄 **Files That Should Reference Master:**

2. **`supabase/functions/chat-v2/prompt-library.ts`**
   - Should Reference: `prompt_library.md`, `prompts.md`
   - Status: ⚠️ TODO - Add header comments

3. **`supabase/functions/chat-v2/types.ts`**
   - Should Reference: `json.md`, `typescript.md`, `architecture.md`
   - Status: ⚠️ TODO - Add header comments

4. **`supabase/functions/chat-v2/index.ts`**
   - Should Reference: `edge_functions.md`, `architecture.md`
   - Status: ⚠️ TODO - Add header comments

5. **`hooks/useReflectionSession.ts`**
   - Should Reference: `client_hooks.md`, `context.md`
   - Status: ⚠️ TODO - Add header comments

### 📝 **Documentation Files:**

6. **`CLAUDE.md`** (project instructions)
   - Should Reference: Master assets overview
   - Status: ✅ Contains master asset references

---

## 🎯 Quick Reference: When to Use Which File

| Need | Use This Master File |
|------|---------------------|
| Understanding BeH2O® principles | `philosophy.md`, `knowledge.md` |
| Implementing phase logic | `governance.md` |
| Writing AI prompts | `instructions.md`, `prompt_library.md` |
| Defining data structures | `json.md`, `typescript.md`, `architecture.md` |
| Building edge functions | `edge_functions.md` |
| Creating React hooks | `client_hooks.md` |
| Managing FlowState | `context.md`, `architecture.md` |
| User documentation | `guide_short.md`, `guide_long.md`, `Reflection.md` |
| Understanding 7-phase flow | `instructions.md` (lines 10-46) |
| CLEAR communication framework | `instructions.md` (line 45-46) |

---

## 🚨 Common Pitfalls to Avoid

### ❌ **DON'T:**
- Copy content from master files into code as hardcoded strings (violates DRY)
- Create duplicate versions of master content elsewhere
- Override master guidance with contradictory implementation logic
- Make changes to implementation without verifying alignment with master

### ✅ **DO:**
- Reference master files in code comments
- Import/load master content programmatically when possible
- Keep implementation synchronized with master principles
- Test against master guidance as source of truth
- Propose changes to master files when misalignment is discovered

---

## 📞 Contact & Ownership

**Master Files Maintained By:**
Trina Nudson, Founder
The Layne Project®
BeH2O® and BeAligned™ Systems

**Copyright:**
© The Layne Project, LLC. All rights reserved.

**Development Team:**
For questions about implementation alignment with master files, consult:
- Robert Mann (Lead Developer)
- Anish (Intern Developer)

---

## 📚 Related Documentation

- **GPT Sampling Reference:** `/public/assets/BeAligned_GPT_Reflection_Sampling_20250913.md`
- **Project Instructions:** `/CLAUDE.md`
- **Governance Documentation:** `/GOVERNANCE.md`
- **Architecture Overview:** `/assets/master/architecture.md`

---

## 🔄 Version History

| Date | Change | Author |
|------|--------|--------|
| 2025-10-12 | Initial creation, established master assets as holy grail | Robert Mann |
| 2025-10-12 | Documented GPT instruction file conversion (.txt → .md) | Robert Mann |
| 2025-10-12 | Added Phase 5 (options) AI-presentation behavior from GPT sampling | Robert Mann |

---

**Remember: When in doubt, the master files in `assets/master/` are ALWAYS the source of truth.** ✨

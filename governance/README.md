# BeAligned™ Governance Documents

This folder contains the **single source of truth** for all BeAligned™ and BeH2O® governance, prompts, and methodology.

## Purpose

All AI behavior, conversation flows, and coaching guidance are derived from these documents. This ensures:
- **Version control** - Track every change to BeH2O methodology
- **Consistency** - Every AI interaction uses the same foundation
- **Auditability** - Know exactly which guidance version was used
- **Maintainability** - Update prompts without code deployments

## File Structure

```
governance/
├── README.md                          # This file
├── gpt-instructions.txt               # Core GPT system prompt
├── beh2o-principles.json             # BeH2O® foundational principles
├── prompt-library.json               # Phase-specific prompts and follow-ups
├── governance-rules.json             # Tone, language, and quality standards
└── feelings-needs-library.json       # Emotion and needs vocabulary
```

## Document Sources

Each governance file is extracted from official BeAligned™ source documents:

| Governance File | Source Document | Location |
|---|---|---|
| `gpt-instructions.txt` | BeAligned_Lite_Revised_GPT_Instructions.txt | `/assets/` |
| `beh2o-principles.json` | BeAligned_Lite_GPT_Knowledge_Page.txt | `/assets/` |
| `prompt-library.json` | BeAligned_Lite_Reflection_Flow_Prompts.docx | `/assets/` |
| `governance-rules.json` | BeAligned™ Editor's Guidebook Final.docx | `/assets/` |
| `feelings-needs-library.json` | feelings.jpg + needs.jpg | `/assets/` |

## Usage

### Edge Functions
```typescript
// Load governance in Edge Functions
const gptInstructions = await Deno.readTextFile('./governance/gpt-instructions.txt')
const principles = JSON.parse(await Deno.readTextFile('./governance/beh2o-principles.json'))
```

### TypeScript Utils
```typescript
// Load governance in app code
import { loadGovernance } from '@/lib/governance'
const { prompts, principles } = await loadGovernance()
```

## Version History

- **2025-01-11** - Initial governance structure created from source documents
- Archive of original working code: `supabase/functions/chat/index.ts.backup`

## Important Notes

⚠️ **Do not edit these files directly without:**
1. Consulting with Trina (BeH2O® methodology owner)
2. Testing changes against GPT samples
3. Documenting the reason for changes
4. Creating a git commit with clear description

✅ **These files power the AI** - Changes here affect every user conversation.

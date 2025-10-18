/**
 * Canonical Phase Metadata - Single Source of Truth
 *
 * This is the ONLY place where phase labels, emojis, and keys are defined.
 * All other parts of the system should reference this metadata.
 *
 * CRITICAL: Phase 4 is "shoes" (Step Into Your Co-Parent's Shoes), NOT "perspective"
 */

export interface PhaseMeta {
  num: number;
  key: string;
  label: string;
  emoji: string;
}

export interface PhaseAlias {
  aliasOf: string;
}

export const PHASE_META: Record<string, PhaseMeta | PhaseAlias> = {
  issue: {
    num: 1,
    key: "issue",
    label: "Phase 1 · Let's Name It",
    emoji: "🌿"
  },
  feelings: {
    num: 2,
    key: "feelings",
    label: "Phase 2 · What's Beneath That",
    emoji: "🌊"
  },
  why: {
    num: 3,
    key: "why",
    label: "Phase 3 · Why This Matters",
    emoji: "🌞"
  },
  shoes: {
    num: 4,
    key: "shoes",
    label: "Phase 4 · Step Into Your Co-Parent's Shoes",
    emoji: "🥿"
  },
  // Backwards-compatibility alias ONLY (deprecated - use shoes)
  perspective: {
    aliasOf: "shoes"
  },
  child: {
    num: 5,
    key: "child",
    label: "Phase 5 · See Through Your Child's Eyes",
    emoji: "👶"
  },
  choose: {
    num: 6,
    key: "choose",
    label: "Phase 6 · Choose Small Next Steps",
    emoji: "🧭"
  },
  message: {
    num: 7,
    key: "message",
    label: "Phase 7 · Co-Author Your CLEAR Message",
    emoji: "🕊️"
  }
} as const;

/**
 * Get the canonical phase key, resolving any aliases
 *
 * Example: canonicalPhaseKey("perspective") returns "shoes"
 *
 * @param k - Phase key (may be an alias)
 * @returns Canonical phase key or null if invalid
 */
export function canonicalPhaseKey(k?: string): string | null {
  if (!k) return null;

  const meta = (PHASE_META as any)[k];
  if (!meta) return null;

  // If it's an alias, return the canonical key
  if ('aliasOf' in meta) {
    return meta.aliasOf;
  }

  // Already canonical
  return k;
}

/**
 * Get phase metadata by key (resolves aliases automatically)
 *
 * @param k - Phase key (may be an alias)
 * @returns Phase metadata or null if invalid
 */
export function getPhaseMeta(k?: string): PhaseMeta | null {
  const canonical = canonicalPhaseKey(k);
  if (!canonical) return null;

  const meta = (PHASE_META as any)[canonical];
  if (!meta || 'aliasOf' in meta) return null;

  return meta as PhaseMeta;
}

/**
 * Get phase label for display
 *
 * @param k - Phase key (may be an alias)
 * @returns Phase label or fallback
 */
export function getPhaseLabel(k?: string): string {
  const meta = getPhaseMeta(k);
  return meta?.label || `Phase · ${k || 'unknown'}`;
}

/**
 * Get phase emoji
 *
 * @param k - Phase key (may be an alias)
 * @returns Phase emoji or default
 */
export function getPhaseEmoji(k?: string): string {
  const meta = getPhaseMeta(k);
  return meta?.emoji || "❖";
}

/**
 * Lean Content Composer - Data-Driven Behavior
 *
 * Composes responses from retrieved flow snippets (acks, bridges, contains, nudges, prompts)
 * with simple variable replacement. No hardcoded phrases.
 */

export interface FlowSnippet {
  id: string;
  content: string;
  kind: 'ack' | 'bridge' | 'contain' | 'nudge' | 'prompt' | 'confirm_why' | 'option_invite' | 'lens_tie' | 'reengage' | 'coauthor_seed' | 'clear_frame' | 'collect' | 'why_recap';
  phase: string;
  weight?: number;
  vars?: string[];
  tags?: string[];
  steward?: string;
  score: number;
}

export interface ComposerContext {
  phase: string;
  userSaidClosure?: boolean;
  needsBridge?: boolean;  // Phase 1 → 2 transition
  needsNudge?: boolean;   // Phase 2 child-impact
  childName?: string;
  coparentName?: string;
  lastFeelingNamed?: string;
  lastValueNamed?: string;
  // Phase 6 three-why recap variables
  parentWhy?: string;
  coparentWhy?: string;
  childWhy?: string;
  coparentPronoun?: string;
  coparentPronounCap?: string;
  primaryFeelingBeneath?: string;
  // Phase 7 variables
  whyPhrase?: string;
  needPhrase?: string;
  askPhrase?: string;
  contextLine?: string;
  listenerLine?: string;
  empathyLine?: string;
  repairLine?: string;
}

export interface ComposedResponse {
  content: string;
  snippets_used: Array<{
    kind: string;
    id: string;
    steward?: string;
  }>;
}

/**
 * Pick one snippet of each kind based on context
 *
 * Priority order (Phases 1-5):
 * 1. ack (if available) - for tone
 * 2. contain (if closure) - for containment
 * 3. bridge (if transition) - for phase bridges
 * 4. prompt - main content
 * 5. nudge (if appropriate) - for child-impact
 *
 * Phase 6 (choose):
 * 1. bridge (1) - reflective pause
 * 2. confirm_why (1) - short confirmation
 * 3. option_invite (2) - two invitation-style options
 * 4. lens_tie (1) - connect to three lenses
 * 5. reengage (1) - invite user input
 *
 * Phase 7 (message):
 * 1. collect (if vars missing) - ask for user language
 * 2. coauthor_seed (if vars present) - draft in user's words
 * 3. clear_frame (after seed) - CLEAR structure
 * 4. contain (always) - containment close
 */
export function pickByKind(
  snippets: FlowSnippet[],
  ctx: ComposerContext
): {
  ack?: FlowSnippet;
  contain?: FlowSnippet;
  bridge?: FlowSnippet;
  prompt?: FlowSnippet;
  nudge?: FlowSnippet;
  // Phase 6
  why_recap?: FlowSnippet;
  confirm_why?: FlowSnippet;
  option_invite?: FlowSnippet[];
  lens_tie?: FlowSnippet;
  reengage?: FlowSnippet;
  // Phase 7
  collect?: FlowSnippet;
  coauthor_seed?: FlowSnippet;
  clear_frame?: FlowSnippet;
} {
  const byKind: Record<string, FlowSnippet[]> = {
    ack: [],
    contain: [],
    bridge: [],
    prompt: [],
    nudge: [],
    why_recap: [],
    confirm_why: [],
    option_invite: [],
    lens_tie: [],
    reengage: [],
    collect: [],
    coauthor_seed: [],
    clear_frame: []
  };

  // Group by kind
  for (const snippet of snippets) {
    if (snippet.kind && byKind[snippet.kind]) {
      byKind[snippet.kind].push(snippet);
    }
  }

  // Sort each group by score (already boosted during retrieval)
  for (const kind in byKind) {
    byKind[kind].sort((a, b) => b.score - a.score);
  }

  // Pick top one of each kind based on context
  const result: any = {};

  // === PHASE 6 LOGIC ===
  if (ctx.phase === 'choose') {
    // Pick three-why recap first
    if (byKind.why_recap.length > 0) {
      result.why_recap = byKind.why_recap[0];
    }
    if (byKind.bridge.length > 0) {
      result.bridge = byKind.bridge[0];
    }
    if (byKind.confirm_why.length > 0) {
      result.confirm_why = byKind.confirm_why[0];
    }
    // Pick exactly TWO option_invite snippets
    if (byKind.option_invite.length > 0) {
      result.option_invite = byKind.option_invite.slice(0, 2);
    }
    if (byKind.lens_tie.length > 0) {
      result.lens_tie = byKind.lens_tie[0];
    }
    if (byKind.reengage.length > 0) {
      result.reengage = byKind.reengage[0];
    }
    return result;
  }

  // === PHASE 7 LOGIC ===
  if (ctx.phase === 'message') {
    // Check if we have user language variables
    const hasSeedVars = Boolean(ctx.whyPhrase || ctx.needPhrase || ctx.askPhrase);

    if (!hasSeedVars) {
      // Missing variables - ask for them
      if (byKind.collect.length > 0) {
        result.collect = byKind.collect[0];
      }
    } else {
      // Have variables - use coauthor seed
      if (byKind.coauthor_seed.length > 0) {
        result.coauthor_seed = byKind.coauthor_seed[0];
      }
      // Only include CLEAR frame if we have the ask phrase
      if (ctx.askPhrase && byKind.clear_frame.length > 0) {
        result.clear_frame = byKind.clear_frame[0];
      }
    }

    // Always include containment
    if (byKind.contain.length > 0) {
      result.contain = byKind.contain[0];
    }
    return result;
  }

  // === PHASES 1-5 LOGIC ===

  // Ack: pick top scoring (already boosted by steward, phase, etc.)
  if (byKind.ack.length > 0) {
    // Use randomization among top 3 to add variety
    const topAcks = byKind.ack.slice(0, 3);
    result.ack = topAcks[Math.floor(Math.random() * topAcks.length)];
  }

  // Contain: only if user said closure
  if (ctx.userSaidClosure && byKind.contain.length > 0) {
    result.contain = byKind.contain[0];
  }

  // Bridge: only if transitioning (e.g., Phase 1 → 2)
  if (ctx.needsBridge && byKind.bridge.length > 0) {
    result.bridge = byKind.bridge[0];
  }

  // Prompt: always pick one (fallback to default if needed)
  if (byKind.prompt.length > 0) {
    result.prompt = byKind.prompt[0];
  }

  // Nudge: only if appropriate (Phase 2 child-impact conditions met)
  if (ctx.needsNudge && byKind.nudge.length > 0) {
    result.nudge = byKind.nudge[0];
  }

  return result;
}

/**
 * Fill variable placeholders in content
 *
 * Phase 1-5 vars: {childName}, {feeling}, {value}
 * Phase 6 vars: {child_name}, {coparent_name}
 * Phase 7 vars: {why_phrase}, {need_phrase}, {ask_phrase},
 *               {context_line}, {listener_line}, {empathy_line}, {repair_line}
 */
export function fillVars(
  content: string | undefined,
  ctx: ComposerContext
): string | null {
  if (!content) return null;

  let filled = content;

  // Phase 1-5 variables
  if (ctx.childName) {
    filled = filled.replace(/\{childName\}/g, ctx.childName);
  } else {
    filled = filled.replace(/\{childName\}/g, 'your child');
  }

  if (ctx.lastFeelingNamed) {
    filled = filled.replace(/\{feeling\}/g, ctx.lastFeelingNamed);
  }

  if (ctx.lastValueNamed) {
    filled = filled.replace(/\{value\}/g, ctx.lastValueNamed);
  }

  // Phase 6 variables (gracefully omit if unavailable)
  if (ctx.childName) {
    filled = filled.replace(/\{child_name\}/g, ctx.childName);
  } else {
    // Gracefully remove the variable and surrounding space/punctuation
    filled = filled.replace(/for \{child_name\}\.?/g, '.');
    filled = filled.replace(/to \{child_name\}\.?/g, '.');
    filled = filled.replace(/\{child_name\}/g, 'your child');
  }

  if (ctx.coparentName) {
    filled = filled.replace(/\{coparent_name\}/g, ctx.coparentName);
  } else {
    // Gracefully remove or replace
    filled = filled.replace(/helping \{coparent_name\}/g, 'helping your co-parent');
    filled = filled.replace(/\{coparent_name\}/g, 'your co-parent');
  }

  // Phase 6 three-why recap variables
  if (ctx.parentWhy) {
    filled = filled.replace(/\{parent_why\}/g, ctx.parentWhy);
  }

  if (ctx.coparentWhy) {
    filled = filled.replace(/\{coparent_why\}/g, ctx.coparentWhy);
  }

  if (ctx.childWhy) {
    filled = filled.replace(/\{child_why\}/g, ctx.childWhy);
  }

  if (ctx.coparentPronoun) {
    filled = filled.replace(/\{coparent_pronoun\}/g, ctx.coparentPronoun);
  }

  if (ctx.coparentPronounCap) {
    filled = filled.replace(/\{coparent_pronoun_cap\}/g, ctx.coparentPronounCap);
  }

  // Phase 7 variables
  if (ctx.whyPhrase) {
    filled = filled.replace(/\{why_phrase\}/g, ctx.whyPhrase);
  }

  if (ctx.needPhrase) {
    filled = filled.replace(/\{need_phrase\}/g, ctx.needPhrase);
  }

  if (ctx.askPhrase) {
    filled = filled.replace(/\{ask_phrase\}/g, ctx.askPhrase);
  }

  if (ctx.contextLine) {
    filled = filled.replace(/\{context_line\}/g, ctx.contextLine);
  }

  if (ctx.listenerLine) {
    filled = filled.replace(/\{listener_line\}/g, ctx.listenerLine);
  }

  if (ctx.empathyLine) {
    filled = filled.replace(/\{empathy_line\}/g, ctx.empathyLine);
  }

  if (ctx.repairLine) {
    filled = filled.replace(/\{repair_line\}/g, ctx.repairLine);
  }

  return filled;
}

/**
 * Compose final response from picked snippets
 *
 * Phases 1-5 order: ack → contain → bridge → prompt → nudge
 * Phase 6 order: bridge → confirm_why → option_invite (2) → lens_tie → reengage
 * Phase 7 order: collect OR (coauthor_seed → clear_frame?) → contain
 */
export function compose(
  snippets: FlowSnippet[],
  ctx: ComposerContext
): ComposedResponse {
  const chosen = pickByKind(snippets, ctx);

  let parts: string[] = [];
  let snippets_used: any[] = [];

  // === PHASE 6 COMPOSITION ===
  if (ctx.phase === 'choose') {
    parts = [
      fillVars(chosen.why_recap?.content, ctx),
      fillVars(chosen.bridge?.content, ctx),
      fillVars(chosen.confirm_why?.content, ctx),
      // Add both option_invite snippets
      ...(chosen.option_invite?.map(opt => fillVars(opt.content, ctx)) || []),
      fillVars(chosen.lens_tie?.content, ctx),
      fillVars(chosen.reengage?.content, ctx),
    ].filter(Boolean) as string[];

    snippets_used = [
      chosen.why_recap && { kind: 'why_recap', id: chosen.why_recap.id, steward: chosen.why_recap.steward },
      chosen.bridge && { kind: 'bridge', id: chosen.bridge.id, steward: chosen.bridge.steward },
      chosen.confirm_why && { kind: 'confirm_why', id: chosen.confirm_why.id, steward: chosen.confirm_why.steward },
      ...(chosen.option_invite?.map(opt => ({ kind: 'option_invite', id: opt.id, steward: opt.steward })) || []),
      chosen.lens_tie && { kind: 'lens_tie', id: chosen.lens_tie.id, steward: chosen.lens_tie.steward },
      chosen.reengage && { kind: 'reengage', id: chosen.reengage.id, steward: chosen.reengage.steward },
    ].filter(Boolean) as any[];

    // Join Phase 6 parts with space, then add line breaks before options for readability
    const content = parts.join(' ').trim();

    return {
      content,
      snippets_used
    };
  }

  // === PHASE 7 COMPOSITION ===
  if (ctx.phase === 'message') {
    const hasSeedVars = Boolean(ctx.whyPhrase || ctx.needPhrase || ctx.askPhrase);

    if (!hasSeedVars) {
      // Missing variables - ask for them
      parts = [
        fillVars(chosen.collect?.content, ctx),
      ].filter(Boolean) as string[];

      snippets_used = [
        chosen.collect && { kind: 'collect', id: chosen.collect.id, steward: chosen.collect.steward },
      ].filter(Boolean) as any[];
    } else {
      // Have variables - use coauthor seed + optional clear frame + containment
      parts = [
        fillVars(chosen.coauthor_seed?.content, ctx),
        fillVars(chosen.clear_frame?.content, ctx),
        fillVars(chosen.contain?.content, ctx),
      ].filter(Boolean) as string[];

      snippets_used = [
        chosen.coauthor_seed && { kind: 'coauthor_seed', id: chosen.coauthor_seed.id, steward: chosen.coauthor_seed.steward },
        chosen.clear_frame && { kind: 'clear_frame', id: chosen.clear_frame.id, steward: chosen.clear_frame.steward },
        chosen.contain && { kind: 'contain', id: chosen.contain.id, steward: chosen.contain.steward },
      ].filter(Boolean) as any[];
    }

    // Join Phase 7 parts with double line breaks for better readability
    const content = parts.join('\n\n').trim();

    return {
      content,
      snippets_used
    };
  }

  // === PHASES 1-5 COMPOSITION ===
  parts = [
    fillVars(chosen.ack?.content, ctx),
    fillVars(chosen.contain?.content, ctx),
    fillVars(chosen.bridge?.content, ctx),
    fillVars(chosen.prompt?.content, ctx),
    fillVars(chosen.nudge?.content, ctx),
  ].filter(Boolean) as string[];

  const content = parts.join(' ').trim();

  // Track which snippets were used
  snippets_used = [
    chosen.ack && { kind: 'ack', id: chosen.ack.id, steward: chosen.ack.steward },
    chosen.contain && { kind: 'contain', id: chosen.contain.id, steward: chosen.contain.steward },
    chosen.bridge && { kind: 'bridge', id: chosen.bridge.id, steward: chosen.bridge.steward },
    chosen.prompt && { kind: 'prompt', id: chosen.prompt.id, steward: chosen.prompt.steward },
    chosen.nudge && { kind: 'nudge', id: chosen.nudge.id, steward: chosen.nudge.steward },
  ].filter(Boolean) as any[];

  return {
    content,
    snippets_used
  };
}

/**
 * Helper to extract child name from flow state
 */
export function extractChildName(flowState: any): string | undefined {
  return flowState?.childName || flowState?.context?.childName;
}

/**
 * Helper to extract last feeling from conversation
 */
export function extractLastFeeling(flowState: any): string | undefined {
  // Look for feeling words in recent user messages
  const history = flowState?.conversationHistory || [];
  const recentUserMessages = history
    .filter((m: any) => m.role === 'user')
    .slice(-3);

  const feelingWords = [
    'angry', 'frustrated', 'sad', 'hurt', 'worried', 'anxious',
    'scared', 'afraid', 'hopeless', 'helpless', 'overwhelmed',
    'disappointed', 'embarrassed', 'ashamed', 'guilty',
    'confused', 'uncertain', 'lost', 'stuck',
    'resentful', 'bitter', 'betrayed', 'rejected',
    'lonely', 'isolated', 'abandoned'
  ];

  for (const msg of recentUserMessages.reverse()) {
    const lowerContent = msg.content.toLowerCase();
    for (const feeling of feelingWords) {
      if (lowerContent.includes(feeling)) {
        return feeling;
      }
    }
  }

  return undefined;
}

/**
 * Strip phase headings from AI-generated text
 *
 * The UI PhaseMarker shows labels from PHASE_META, so the AI should never
 * print phase headings or labels in the response text.
 *
 * This function removes any accidentally generated headings.
 *
 * @param text - Content that may contain phase headings
 * @returns Content with headings stripped
 */
export function stripPhaseHeadings(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // Remove markdown headings starting with "Phase"
  cleaned = cleaned.replace(/^#+\s*phase.*$/gmi, '');

  // Remove emoji-prefixed phase headings
  cleaned = cleaned.replace(/^[🌿🌊🌞🥿👶🧭🕊️].*phase.*$/gmi, '');

  // Remove common phase heading patterns
  cleaned = cleaned.replace(/^Phase \d+[:\s·•].*$/gmi, '');

  // Remove "Perspective" specifically (legacy Phase 4 label)
  cleaned = cleaned.replace(/^#+\s*Perspective.*$/gmi, '');
  cleaned = cleaned.replace(/^Perspective[:\s·•].*$/gmi, '');

  // Clean up extra whitespace left behind
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

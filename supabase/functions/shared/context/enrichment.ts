/**
 * Context Enrichment Utilities
 *
 * Lightweight helpers for enriching conversation context with:
 * - Normalized emotions (frustration → hurt, anger → hurt)
 * - Coparent pronoun inference (he/she/they)
 * - Three-why extraction from earlier phases
 *
 * Keeps enrichment logic outside the composer - just enriched data context.
 */

/**
 * Normalize surface emotions to deeper feelings
 *
 * Maps common surface emotions to their underlying feelings:
 * - frustrated/frustration → hurt
 * - angry/anger → hurt
 * - annoyed → sad
 *
 * @param primary - The primary feeling identified
 * @returns Normalized emotion
 */
export function normalizeEmotion(primary: string): string {
  const lower = primary.toLowerCase().trim();

  // Frustration → hurt
  if (['frustrated', 'frustration'].includes(lower)) return 'hurt';

  // Anger → hurt
  if (['angry', 'anger'].includes(lower)) return 'hurt';

  // Annoyed → sad
  if (['annoyed'].includes(lower)) return 'sad';

  // Return as-is if no normalization needed
  return primary;
}

/**
 * Detect coparent pronoun for session persistence
 *
 * Returns pronoun only if clearly specified in user utterance.
 * Returns null if not specified, allowing fallback to neutral.
 *
 * @param utterance - User's utterance
 * @returns "he" | "she" | null
 */
export function detectCoparentPronoun(utterance: string): "he" | "she" | null {
  if (!utterance) return null;

  const u = utterance.toLowerCase();

  // Check for masculine pronouns
  if (/\b(he|him|his)\b/.test(u)) return "he";

  // Check for feminine pronouns
  if (/\b(she|her|hers)\b/.test(u)) return "she";

  // Not specified - return null
  return null;
}

/**
 * Infer coparent pronoun from user text
 *
 * Lightweight pronoun inference based on usage in conversation:
 * - Looks for he/him/his → "he"
 * - Looks for she/her/hers → "she"
 * - Defaults to "they" if unclear
 *
 * @param userText - User's conversation text
 * @returns Inferred pronoun (he/she/they)
 */
export function resolveCoparentPronoun(userText: string): string {
  if (!userText) return 'they';

  const lower = userText.toLowerCase();

  // Check for masculine pronouns
  if (/\b(he|him|his)\b/i.test(lower)) return 'he';

  // Check for feminine pronouns
  if (/\b(she|her|hers)\b/i.test(lower)) return 'she';

  // Default to gender-neutral
  return 'they';
}

/**
 * Capitalize first letter of pronoun
 *
 * @param pronoun - Pronoun to capitalize
 * @returns Capitalized pronoun
 */
export function capitalizeFirstLetter(pronoun: string): string {
  if (!pronoun) return '';
  return pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
}

/**
 * Extract three-why context from flow state
 *
 * Attempts to extract:
 * - Parent's why (from Phase 3)
 * - Coparent's why (from Phase 4 perspective-taking)
 * - Child's why (from Phase 5 child-lens)
 *
 * @param flowState - Current flow state with conversation history
 * @returns Object with parentWhy, coparentWhy, childWhy
 */
export function extractThreeWhys(flowState: any): {
  parentWhy?: string;
  coparentWhy?: string;
  childWhy?: string;
} {
  const result: {
    parentWhy?: string;
    coparentWhy?: string;
    childWhy?: string;
  } = {};

  // Try to extract from flow state context
  if (flowState?.context) {
    result.parentWhy = flowState.context.parentWhy;
    result.coparentWhy = flowState.context.coparentWhy;
    result.childWhy = flowState.context.childWhy;
  }

  // Fallback: try to extract from conversation history
  if (!result.parentWhy && flowState?.conversationHistory) {
    const history = flowState.conversationHistory;

    // Look for Phase 3 (why) user responses
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.role === 'user' && msg.phaseContext?.phase === 'why') {
        result.parentWhy = msg.content;
        break;
      }
    }

    // Look for Phase 4 (perspective) user responses
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.role === 'user' && msg.phaseContext?.phase === 'perspective') {
        result.coparentWhy = msg.content;
        break;
      }
    }

    // Look for Phase 5 (options) user responses about child
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.role === 'user' && msg.phaseContext?.phase === 'options') {
        result.childWhy = msg.content;
        break;
      }
    }
  }

  return result;
}

/**
 * Enrich composer context with pronouns, emotions, and three-whys
 *
 * This should be called before composing Phase 6 responses
 * to ensure all context variables are populated.
 *
 * @param ctx - Composer context to enrich
 * @param flowState - Current flow state
 * @param userText - Latest user input
 * @returns Enriched context
 */
export function enrichContextForPhase6(
  ctx: any,
  flowState: any,
  userText: string
): any {
  // Extract coparent pronoun
  const coparentPronoun = resolveCoparentPronoun(
    userText || flowState?.conversationHistory?.map((m: any) => m.content).join(' ') || ''
  );

  // Normalize primary feeling if present
  const primaryFeelingBeneath = ctx.lastFeelingNamed
    ? normalizeEmotion(ctx.lastFeelingNamed)
    : undefined;

  // Extract three-whys
  const { parentWhy, coparentWhy, childWhy } = extractThreeWhys(flowState);

  return {
    ...ctx,
    coparentPronoun,
    coparentPronounCap: capitalizeFirstLetter(coparentPronoun),
    primaryFeelingBeneath,
    parentWhy,
    coparentWhy,
    childWhy,
  };
}

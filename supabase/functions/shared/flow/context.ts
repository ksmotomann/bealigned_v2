/**
 * Lean Context Detection - No Content, Just Signals
 *
 * Detects user signals (closure, feelings, etc.) to inform retrieval and composition.
 * All content lives in the database.
 */

/**
 * Closure signals - user indicating they're done
 */
const CLOSURE_SIGNS = [
  "that's it",
  "that's it",
  "im done",
  "i'm done",
  "nothing else",
  "no more",
  "that is all",
  "thats all",
  "that's all"
];

/**
 * Detect if user is signaling closure/completion
 */
export function detectClosure(userText: string): boolean {
  const lowerText = userText.toLowerCase().trim();
  return CLOSURE_SIGNS.some(sign => lowerText.includes(sign));
}

/**
 * Detect if user has named a feeling in their input
 */
export function detectFeelingNamed(userText: string): boolean {
  const lowerText = userText.toLowerCase();

  const feelingWords = [
    "feel", "feeling", "felt",
    "angry", "frustrated", "sad", "hurt", "worried", "anxious",
    "scared", "afraid", "hopeless", "helpless", "overwhelmed",
    "disappointed", "embarrassed", "ashamed", "guilty",
    "confused", "uncertain", "lost", "stuck",
    "resentful", "bitter", "betrayed", "rejected",
    "lonely", "isolated", "abandoned"
  ];

  return feelingWords.some(word => lowerText.includes(word));
}

/**
 * Check if child-impact language appears in conversation history
 */
export function hasRecentChildImpactCue(
  history: Array<{ role: string; content: string }>,
  lastN: number = 3
): boolean {
  const recentTurns = history.slice(-lastN);
  const childImpactPhrases = [
    "for your son",
    "for your child",
    "for them",
    "how might that",
    "show up for",
    "impact on",
    "your child be noticing"
  ];

  return recentTurns.some(turn => {
    const lowerContent = turn.content.toLowerCase();
    return childImpactPhrases.some(phrase => lowerContent.includes(phrase));
  });
}

/**
 * Determine if we need a Phase 1 → 2 bridge
 */
export function needsPhaseBridge(currentPhase: string, previousPhase: string | null): boolean {
  // Bridge when transitioning from issue to feelings
  return previousPhase === 'issue' && currentPhase === 'feelings';
}

/**
 * Determine if we should offer child-impact nudge
 *
 * Conditions:
 * - In Phase 2 (feelings)
 * - User has named a feeling
 * - Readiness is moderate or higher (≥ 0.65)
 * - Haven't asked about child impact recently
 */
export function shouldOfferChildImpactNudge(
  phase: string,
  feelingNamed: boolean,
  readiness: number,
  hasRecentCue: boolean
): boolean {
  return (
    phase === 'feelings' &&
    feelingNamed &&
    readiness >= 0.65 &&
    !hasRecentCue
  );
}

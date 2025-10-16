/**
 * Phase 7 Flow Engine
 *
 * Phase 7 is integration and co-creation. Expression emerges through
 * collaboration, not automation. This module manages the Phase 7 substates
 * and decision logic.
 *
 * Key principles:
 * - Integrate, offer options, co-author, fit-check, contain
 * - Preserve user's language and agency
 * - Use CLEAR only to polish for listener readiness
 * - Offer Deep Think Mode when complexity or emotion is high
 */

export type Phase7Substate =
  | 'integrate'    // Mirror earlier insights
  | 'option'       // Offer outward/inward/complex options
  | 'coauthor'     // Co-create expression using user's language
  | 'fitcheck'     // Confirm ownership and tone
  | 'contain'      // Close with calm containment
  | 'deepthink';   // Pause for human-crafted insight

export type Phase7Decision =
  | 'coauthor'
  | 'offer_outward'
  | 'offer_inward'
  | 'offer_deepthink'
  | 'fitcheck'
  | 'contain';

export type Phase7NextState = Phase7Substate | 'done' | 'pause';

/**
 * Phase 7 flow map
 *
 * Defines the progression through Phase 7 substates
 */
export const phase7FlowMap: Record<Phase7Substate, Phase7NextState> = {
  integrate: 'option',
  option: 'coauthor',
  coauthor: 'fitcheck',
  fitcheck: 'contain',
  contain: 'done',
  deepthink: 'pause'
};

/**
 * Emotional/complexity signals that inform Phase 7 decisions
 */
export interface Phase7Signals {
  emotionLevel?: number;      // 0-1 scale
  complexity?: number;         // 0-1 scale
  resistanceDetected?: boolean;
  clarityScore?: number;       // 0-1 scale
}

/**
 * Determine if Deep Think Mode should be offered
 *
 * Deep Think Mode provides a 48-hour pause for a human-crafted
 * Aligned Insight when emotion or complexity is high.
 *
 * @param signals - Emotional and complexity signals
 * @returns true if Deep Think should be offered
 */
export function shouldEnterDeepThink(signals: Phase7Signals): boolean {
  const emotionLevel = signals.emotionLevel ?? 0;
  const complexity = signals.complexity ?? 0;

  // Offer Deep Think if either emotion or complexity is high (≥ 0.7)
  return emotionLevel >= 0.7 || complexity >= 0.7;
}

/**
 * Determine next Phase 7 decision based on current substate and signals
 *
 * @param currentSubstate - Current Phase 7 substate
 * @param signals - Emotional and complexity signals
 * @returns The decision to make for this turn
 */
export function determinePhase7Decision(
  currentSubstate: Phase7Substate,
  signals: Phase7Signals
): Phase7Decision {
  switch (currentSubstate) {
    case 'integrate':
      // Always start with integration
      return 'coauthor';

    case 'option':
      // Decide which option to offer based on signals
      if (shouldEnterDeepThink(signals)) {
        return 'offer_deepthink';
      }
      // Default to outward (message to co-parent/child)
      // In production, this would analyze user's context to decide
      return 'offer_outward';

    case 'coauthor':
      // After co-authoring, always fit-check
      return 'fitcheck';

    case 'fitcheck':
      // After fit-check, contain and close
      return 'contain';

    case 'contain':
      // Containment is the final step
      return 'contain';

    case 'deepthink':
      // Deep Think pauses the flow
      return 'offer_deepthink';

    default:
      return 'coauthor';
  }
}

/**
 * Get the next Phase 7 substate
 *
 * @param currentSubstate - Current Phase 7 substate
 * @param userChoseDeepThink - Whether user explicitly chose Deep Think Mode
 * @returns The next substate or flow directive
 */
export function getNextPhase7Substate(
  currentSubstate: Phase7Substate,
  userChoseDeepThink: boolean = false
): Phase7NextState {
  // If user chose Deep Think, pause the flow
  if (userChoseDeepThink) {
    return 'pause';
  }

  // Otherwise follow the flow map
  return phase7FlowMap[currentSubstate];
}

/**
 * Phase 7 context accumulated across substates
 */
export interface Phase7Context {
  integratedInsights?: string[];    // Key insights from earlier phases
  chosenOption?: 'outward' | 'inward' | 'deepthink';
  draftMessage?: string;            // Co-authored message
  userLanguage?: string[];          // User's own phrases to preserve
  tonePreference?: 'softer' | 'stronger' | 'as-is';
  readyToSend?: boolean;
}

/**
 * Extract user's key language patterns from earlier phases
 *
 * This helps preserve the user's voice in co-authoring
 *
 * @param flowContext - Context from earlier phases
 * @returns Array of user's key phrases
 */
export function extractUserLanguage(flowContext: Record<string, any>): string[] {
  const phrases: string[] = [];

  // Extract key phrases from issue, feelings, why phases
  if (flowContext.issue) {
    phrases.push(flowContext.issue);
  }

  if (flowContext.why) {
    phrases.push(flowContext.why);
  }

  // Could add more sophisticated extraction here
  return phrases;
}

/**
 * Validate if user has completed Phase 7 successfully
 *
 * Phase 7 is complete when:
 * 1. User has gone through fit-check
 * 2. User has confirmed ownership
 * 3. Containment message has been delivered
 *
 * @param context - Phase 7 context
 * @returns true if Phase 7 is complete
 */
export function isPhase7Complete(context: Phase7Context): boolean {
  // Must have chosen an option and either completed or paused for Deep Think
  const hasOption = context.chosenOption !== undefined;
  const hasCompletedFlow = context.draftMessage && context.tonePreference;
  const hasPausedForDeepThink = context.chosenOption === 'deepthink';

  return hasOption && (hasCompletedFlow || hasPausedForDeepThink);
}

/**
 * Generate containment message for Phase 7 closing
 *
 * @param context - Phase 7 context
 * @returns Calm, pressure-free containment message
 */
export function generateContainmentMessage(context: Phase7Context): string {
  if (context.chosenOption === 'deepthink') {
    return "We're pausing here. A human-crafted Aligned Insight will be ready within 48 hours. You'll receive a notification when it's available.";
  }

  if (context.chosenOption === 'inward') {
    return "This is yours to keep. You don't have to share it or act on it today. Staying aligned with your why is enough.";
  }

  // Outward message
  return "You do not have to send it today. Staying aligned with your why is enough. When you're ready, this message will be here.";
}

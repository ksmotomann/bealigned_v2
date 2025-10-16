/**
 * Phase transition logic
 *
 * Ensures we emit a single phase change per assistant turn,
 * preventing duplicate phase markers in the UI.
 */

/**
 * Compute whether a phase change has occurred
 *
 * @param prevPhase - The previous phase (from last assistant message)
 * @param nextPhase - The current/next phase
 * @returns true if phase has changed, false otherwise
 */
export function computePhaseChange(
  prevPhase: string | null | undefined,
  nextPhase: string
): boolean {
  return Boolean(prevPhase && prevPhase !== nextPhase);
}

/**
 * Track the last assistant phase to detect transitions
 * This should be updated once per assistant reply in chat-v3/index.ts
 */
export class PhaseTracker {
  private lastAssistantPhase: string | null = null;

  /**
   * Check if phase has changed from last assistant message
   */
  hasChanged(currentPhase: string): boolean {
    return computePhaseChange(this.lastAssistantPhase, currentPhase);
  }

  /**
   * Update the tracker with the new phase
   */
  update(phase: string): void {
    this.lastAssistantPhase = phase;
  }

  /**
   * Get the last recorded phase
   */
  getLast(): string | null {
    return this.lastAssistantPhase;
  }

  /**
   * Reset the tracker (useful for new sessions)
   */
  reset(): void {
    this.lastAssistantPhase = null;
  }
}

/**
 * BeAligned Content - TypeScript Exports
 * Direct imports for reliable bundling and instant access
 */

import { BEALIGNED_INSTRUCTIONS } from './beAlignedInstructions'

// For now, let's just start with instructions and build from there
export { BEALIGNED_INSTRUCTIONS }

// Combine all content into comprehensive system prompt
export function getBeAlignedGPTSystem(): string {
  return `${BEALIGNED_INSTRUCTIONS}

===== IMPLEMENTATION NOTES =====
- Follow the 7-phase process EXACTLY as outlined above
- Use the conversational, warm tone described
- Stay true to the BeH2O methodology and BeAligned mindset  
- Focus on reflection, empathy, and child-centered solutions
- Use the CLEAR communication framework for message crafting

IMPORTANT: This is the complete system content. Follow these instructions precisely to match the gold standard BeAligned GPT behavior.`
}

// Export async version for compatibility
export async function getBeAlignedGPTSystemAsync(): Promise<string> {
  return getBeAlignedGPTSystem()
}
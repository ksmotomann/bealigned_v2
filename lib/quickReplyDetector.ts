/**
 * Detects yes/no questions in AI messages and suggests quick reply buttons
 */

interface QuickReplyButton {
  label: string
  value: string
  style?: 'primary' | 'secondary'
}

/**
 * Patterns that indicate yes/no questions
 * NOTE: Must be specific to avoid matching open-ended questions like "What do you want to work through?"
 */
const YES_NO_PATTERNS = [
  /would you like (help )?(choosing|crafting|drafting|me to adjust|me to)/i,
  /would you like me to/i,
  /should i/i,
  /^do you want (?:me )?to/i, // Must be at start of sentence to avoid matching "What do you want to..."
  /are you ready to/i,
  /can i help you (?:with|to)/i,
  /shall i/i,
  /does (?:this|that) (?:sound|look|feel|work)/i,
  /is (?:this|that) (?:good|okay|alright)/i,
]

/**
 * Context-specific quick reply configurations
 */
const CONTEXT_REPLIES: Record<string, QuickReplyButton[]> = {
  // Phase 6: "Which of these feels most aligned?" / "Which would you like to explore?"
  'which of these': [
    { label: 'Option 1', value: '1', style: 'primary' },
    { label: 'Option 2', value: '2', style: 'primary' },
    { label: 'Option 3', value: '3', style: 'primary' },
  ],

  // Phase 7: "Would you like help drafting..."
  'drafting': [
    { label: 'Yes, draft', value: 'yes draft', style: 'primary' },
    { label: 'No thanks', value: 'no', style: 'secondary' },
  ],

  // Phase 7: "Would you like me to adjust anything?"
  'adjust': [
    { label: 'Yes, adjust', value: 'yes', style: 'primary' },
    { label: "Looks good", value: 'no', style: 'secondary' },
  ],

  // Generic ready/continue questions
  'ready': [
    { label: "I'm ready", value: 'yes', style: 'primary' },
    { label: 'Not yet', value: 'no', style: 'secondary' },
  ],
}

/**
 * Default yes/no buttons for generic questions
 */
const DEFAULT_YES_NO: QuickReplyButton[] = [
  { label: 'Yes', value: 'yes', style: 'primary' },
  { label: 'No', value: 'no', style: 'secondary' },
]

/**
 * Detects if a message warrants quick reply buttons
 * @param content The message content to analyze
 * @returns Quick reply button configuration or null
 */
export function detectQuickReplies(content: string): QuickReplyButton[] | null {
  if (!content) return null

  // Normalize content for pattern matching
  const normalizedContent = content.toLowerCase()

  // PRIORITY: Check for Phase 6 numbered options pattern
  // Pattern: "1) ... 2) ... 3) ..." or "1. ... 2. ... 3. ..."
  const hasNumberedOptions = /\b1[).]\s+.+\b2[).]\s+.+\b3[).]/i.test(content)
  if (hasNumberedOptions) {
    // Extract actual option text to create descriptive buttons
    const optionPattern = /(\d+)[).]\s+([^\n]+)/g
    const matches = [...content.matchAll(optionPattern)]

    if (matches.length >= 3) {
      return matches.slice(0, 3).map((match) => {
        const optionNum = match[1]
        let optionText = match[2].trim()

        // Truncate long options and add ellipsis
        if (optionText.length > 45) {
          optionText = optionText.substring(0, 45) + '...'
        }

        return {
          label: `Option ${optionNum}: ${optionText}`,
          value: optionNum,
          style: 'primary' as const
        }
      })
    }

    // Fallback to generic buttons if parsing fails
    return CONTEXT_REPLIES['which of these']
  }

  // Check if it contains any yes/no question pattern
  const hasYesNoQuestion = YES_NO_PATTERNS.some(pattern => pattern.test(content))

  if (!hasYesNoQuestion) return null

  // Check for context-specific patterns
  for (const [keyword, buttons] of Object.entries(CONTEXT_REPLIES)) {
    if (normalizedContent.includes(keyword)) {
      return buttons
    }
  }

  // Return default yes/no buttons for generic questions
  return DEFAULT_YES_NO
}

/**
 * Checks if the message is the most recent AI message in the conversation
 * Quick replies should only appear on the latest message
 */
export function shouldShowQuickReplies(
  messageId: string,
  messages: any[],
  isLastMessage: boolean
): boolean {
  // Only show on the last assistant message
  if (!isLastMessage) return false

  // Don't show if there's already a user response after this
  const messageIndex = messages.findIndex(m => m.id === messageId)
  if (messageIndex === -1) return false

  const nextMessage = messages[messageIndex + 1]
  if (nextMessage && nextMessage.role === 'user') {
    return false // User already responded
  }

  return true
}

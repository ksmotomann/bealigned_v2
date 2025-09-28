/**
 * FRONTEND UI DISPLAY DATA ONLY
 *
 * This file contains phase display information for the frontend UI:
 * - Phase titles, emojis, descriptions for progress menu
 * - Help text for user guidance
 * - Validation criteria for display purposes
 *
 * ⚠️ IMPORTANT: This data is NOT used for AI conversation behavior.
 * AI behavior is controlled by: supabase/functions/chat/index.ts
 *
 * Used by:
 * - app/(tabs)/chat.tsx - Progress menu display
 * - Frontend UI components for phase information
 */

export interface ReflectionStep {
  number: number
  title: string
  description: string
  prompts: string[]
  validationCriteria: string[]
  helpText: string
}

export const REFLECTION_STEPS: ReflectionStep[] = [
  {
    number: 1,
    title: "🌿 **PHASE 1:** *LET'S NAME IT*",
    description: "What's the situation that's been sticking with you lately?",
    prompts: [
      'What specific situation would you like to reflect on?',
      'Can we phrase this in a way that focuses on the situation, not the person?',
      'What\'s the heart of the matter here?',
      'How would you describe this issue in one neutral sentence?'
    ],
    validationCriteria: [
      'Issue is stated clearly and briefly',
      'Language is neutral and non-blaming',
      'Focuses on the situation, not attacking the person'
    ],
    helpText: 'Start by expressing what\'s weighing on you, even if it feels messy. We\'ll work together to capture the core issue in neutral language that invites conversation rather than conflict.'
  },
  {
    number: 2,
    title: "🌊 **PHASE 2:** *WHAT'S BENEATH THAT?*",
    description: 'What feelings come up when you think about this?',
    prompts: [
      'What feelings are coming up for you?',
      'What else do you notice when you sit with that feeling?',
      'Sometimes beneath anger or frustration, there are softer feelings like hurt or disappointment. Do any of those resonate?',
      'What do these feelings tell you about what matters most to you?'
    ],
    validationCriteria: [
      'Names specific emotions',
      'Explores beyond surface feelings',
      'Connects feelings to what matters'
    ],
    helpText: 'Strong emotions like anger often sit on the surface. Beneath them may be more vulnerable feelings. Being curious about all your emotions helps discover what truly matters to you.'
  },
  {
    number: 3,
    title: '💫 **PHASE 3:** *YOUR WHY*',
    description: 'What is it about this that feels important to you?',
    prompts: [
      'Why does this matter to you?',
      'What value or hope sits underneath this?',
      'What do you most want your child to experience here?',
      'If this were resolved in a way that aligned with your deeper purpose, what would that look like?'
    ],
    validationCriteria: [
      'Identifies core values or needs',
      'Moves beyond "what I want" to "why it matters"',
      'Connects to child-centered purpose'
    ],
    helpText: 'Your Why is about values, vision, and purpose - like safety, belonging, respect, or stability. When you anchor in Why rather than What, it reduces defensiveness and helps find shared ground.'
  },
  {
    number: 4,
    title: "👥 **PHASE 4:** *STEP INTO YOUR CO-PARENT'S SHOES*",
    description: 'If your co-parent described this, how might they see it?',
    prompts: [
      'If you were in their shoes, what might they be worried about?',
      'What might your co-parent say matters most to them here?',
      'From your child\'s point of view, what might they most want or need right now?',
      'What might be the deeper Why behind their position?'
    ],
    validationCriteria: [
      'Shows genuine attempt to understand other perspectives',
      'Considers both co-parent and child viewpoints',
      'Acknowledges without necessarily agreeing'
    ],
    helpText: 'This isn\'t about agreement; it\'s about awareness. By imagining how others see the situation, you expand from "me versus you" to understanding what\'s happening in the whole family system.'
  },
  {
    number: 5,
    title: "👶 **PHASE 5:** *SEE THROUGH YOUR CHILD'S EYES*",
    description: 'What might your child be noticing about this?',
    prompts: [
      'What might your child be noticing about this situation?',
      'How might they be feeling?',
      'What might they need right now - not from either parent, but in general?',
      'What would your child hope for if they could express it?'
    ],
    validationCriteria: [
      'Generates at least 3 different options',
      'Options connect to both parents\' Whys',
      'Focuses on child-centered outcomes'
    ],
    helpText: 'Having multiple possibilities reframes from rigid positions to creative collaboration. The goal isn\'t to win - it\'s to find options that serve your shared purpose of safeguarding your child\'s well-being.'
  },
  {
    number: 6,
    title: '💡 **PHASE 6:** *EXPLORE ALIGNED OPTIONS*',
    description: "Given everything we've explored, what ideas come to mind?",
    prompts: [
      'Given everything we\'ve explored — your why, your co-parent\'s possible why, your child\'s needs — I\'d like to offer you some concrete options to consider:',
      '💡 **Option 1:** [Generate specific actionable solution based on their context]',
      '💡 **Option 2:** [Generate alternative approach that addresses different aspects]', 
      '💡 **Option 3:** [Generate creative solution that blends perspectives]',
      'Do any of these resonate with you? Would you like to explore one further, or would blending them work better?'
    ],
    validationCriteria: [
      'Recognizes preference for specific option',
      'Expresses desire to blend approaches',
      'Indicates readiness to move forward'
    ],
    helpText: 'Rather than asking you to generate ideas from scratch, I\'ll present concrete options based on everything you\'ve shared. You can choose one that resonates, blend multiple approaches, or use them as inspiration for your own path forward.'
  },
  {
    number: 7,
    title: '✉️ **PHASE 7:** *CHOOSE + COMMUNICATE*',
    description: 'Which of these feels most aligned with everyone\'s needs?',
    prompts: [
      'Based on your choice, I\'ll help you draft a CLEAR message using our framework:',
      '**C**oncise • **L**istener-Ready • **E**ssential • **A**ppropriate • **R**elevant',
      '📩 **Message Draft:**',
      '[Generate specific message based on their chosen option and context]',
      'Would you like me to adjust this message, create an alternative version, or help you plan how to deliver it?'
    ],
    validationCriteria: [
      'Approves message draft',
      'Requests message modifications',
      'Asks for delivery guidance',
      'Expresses readiness to communicate'
    ],
    helpText: 'The CLEAR framework ensures your message is powerful yet appropriate. I\'ll craft a specific draft based on your situation, then help you refine it until it feels aligned with your values and goals.'
  }
]

export function getStepByNumber(stepNumber: number): ReflectionStep | undefined {
  return REFLECTION_STEPS.find(step => step.number === stepNumber)
}

export function validateStepCompletion(stepNumber: number, userInput: string, responses: Record<string, any> = {}): boolean {
  // Mode B (Gold Standard): AI-driven validation - simple check, let AI handle phase transitions
  return userInput?.trim().length > 2
  
  // Legacy validation system - kept for reference but not used
  const step = getStepByNumber(stepNumber)
  if (!step) return false
  
  // More flexible validation based on meaningful engagement
  const inputLength = userInput?.trim().length || 0
  const hasSubstantiveContent = inputLength > 15 // Reduced from 30 - allow shorter meaningful responses
  
  // Check for minimal engagement patterns that suggest incomplete response
  // But allow completion signals for Phase 2
  const isMinimalResponse = /^(yes|ok|okay|sure|maybe|idk|i don't know)$/i.test(userInput?.trim() || '')
  const isCompletionSignal = /^(no|nothing|that's it|that's all|i'm done)$/i.test(userInput?.trim().toLowerCase())
  
  if (isMinimalResponse && !isCompletionSignal) return false
  
  // Step-specific validation with more flexibility
  switch (stepNumber) {
    case 1: // Issue Naming
      // Just needs a clear description of a situation
      return hasSubstantiveContent && inputLength > 15
      
    case 2: // Feelings Exploration
      // Look for emotion words or feeling descriptions - expanded list for co-parenting
      const emotionWords = /\b(angry|sad|hurt|frustrated|disappointed|scared|worried|anxious|happy|relieved|confused|overwhelmed|upset|mad|afraid|nervous|excited|hopeful|grateful|peaceful|calm|stressed|shame|guilt|embarrassed|betrayed|abandoned|rejected|lonely|helpless|powerless|bitter|resentful|exhausted|defeated|inadequate|hate|stuck|regretful|torn|conflicted|trapped|drained|furious|devastated|heartbroken|guilty|ashamed|disgusted|annoyed|irritated|jealous|envious|terrified|panicked)\b/i
      const feelingPhrases = /feel|feeling|emotion|overwhelm|lash out|don't want to be|envisioned|that's it|nothing else|hate|love|loathe|can't stand|drives me crazy|makes me|i'm so|it's so|just want|don't know what to do/i
      const completionSignals = /^(no|nothing|that's it|that's all|i'm done)$/i
      
      return hasSubstantiveContent && (emotionWords.test(userInput) || feelingPhrases.test(userInput) || completionSignals.test(userInput.trim().toLowerCase()) || inputLength > 25)
      
    case 3: // Deeper Why
      // Look for values, needs, or "because" statements - more flexible
      const whyIndicators = /\b(because|need|want|value|important|matter|care about|believe|hope|wish|love|protect|safe|secure|family|child|respect|trust|connection)\b/i
      const valuesPhrases = /for my|for our|so that|i want them|best for|what matters/i
      return hasSubstantiveContent && (whyIndicators.test(userInput) || valuesPhrases.test(userInput) || inputLength > 20)
      
    case 4: // Perspective Shift
      // Look for perspective-taking language or completion signals
      const perspectiveWords = /\b(they|them|their|might|maybe|perhaps|could be|probably|understand|feel|need|want)\b/i
      const phase4CompletionSignals = /^(no|nothing|that's it|that's all|i'm done|thats it)$/i
      return hasSubstantiveContent && (perspectiveWords.test(userInput) || phase4CompletionSignals.test(userInput.trim().toLowerCase()))
      
    case 5: // Child's Eyes - looking for child-focused observations
      const childWords = /\b(he|she|they|child|kid|son|daughter|wants|needs|feels|thinks|notices|sees|confused|scared|happy|sad)\b/i
      const childPhrases = /just wants|might be|probably|likely|doesn't want|would feel|is feeling/i
      const phase5CompletionSignals = /^(no|nothing|that's it|that's all|i'm done|thats it)$/i
      return hasSubstantiveContent && (childWords.test(userInput) || childPhrases.test(userInput) || phase5CompletionSignals.test(userInput.trim().toLowerCase()) || inputLength > 20)
      
    case 6: // Solution Generation - Explore Aligned Options
      // Look for desires, hopes, solutions, or expressions of what they want
      const solutionWords = /\b(could|would|can|will|try|maybe we|what if|how about|suggest|idea|option)\b/i
      const desireWords = /\b(want|hope|wish|need|would like|looking for|trying to|goal|desire)\b/i
      const outcomeWords = /\b(voice|change|different|better|stop|end|freedom|respect|peace|harmony|work together)\b/i
      const phase6CompletionSignals = /^(i don't know|nothing|no ideas|i'm stuck|it won't work|never going to work)$/i
      
      return hasSubstantiveContent && (solutionWords.test(userInput) || desireWords.test(userInput) || outcomeWords.test(userInput) || phase6CompletionSignals.test(userInput.trim().toLowerCase()) || inputLength > 25)
      
    case 7: // Message Drafting - Choose + Communicate
      // Look for choice indicators, message preferences, or communication willingness
      const messageStructure = /\b(feel|when|because|we both|would like|appreciate|understand)\b/i
      const choiceWords = /\b(yes|ok|sure|try|first|option|message|draft|send|tell|say|communicate)\b/i
      const preferenceWords = /\b(prefer|like|better|best|choose|pick|go with|sounds good)\b/i
      
      return hasSubstantiveContent && (messageStructure.test(userInput) || choiceWords.test(userInput) || preferenceWords.test(userInput) || inputLength > 15)
      
    default:
      return hasSubstantiveContent
  }
}
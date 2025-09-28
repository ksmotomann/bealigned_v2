import { supabase } from './supabase'
import { promptService } from './promptService'

interface ValidationPhrase {
  category: string
  phrase: string
  context?: string
}

interface SafetyGuardrail {
  rule_type: string
  rule_description: string
  redirect_to: string
}

interface TrainingPattern {
  trigger_pattern: string
  trigger_type: string
  response_template: string
  confidence_score: number
}

class EnhancedPromptService {
  private validationPhrases: Map<string, ValidationPhrase[]> = new Map()
  private safetyRules: SafetyGuardrail[] = []
  private trainingPatterns: Map<number, TrainingPattern[]> = new Map()
  private reframingPatterns: Map<string, string> = new Map()
  private loaded: boolean = false

  async loadEnhancements(): Promise<void> {
    if (this.loaded) return

    try {
      // Load validation phrases
      const { data: phrases } = await supabase
        .from('validation_phrases')
        .select('*')
      
      if (phrases) {
        phrases.forEach(phrase => {
          if (!this.validationPhrases.has(phrase.category)) {
            this.validationPhrases.set(phrase.category, [])
          }
          this.validationPhrases.get(phrase.category)?.push(phrase)
        })
      }

      // Load safety guardrails
      const { data: rules } = await supabase
        .from('safety_guardrails')
        .select('*')
      
      if (rules) {
        this.safetyRules = rules
      }

      // Load training patterns
      const { data: patterns } = await supabase
        .from('training_patterns')
        .select('*')
        .eq('is_active', true)
        .order('confidence_score', { ascending: false })
      
      if (patterns) {
        patterns.forEach(pattern => {
          if (!this.trainingPatterns.has(pattern.phase_number)) {
            this.trainingPatterns.set(pattern.phase_number, [])
          }
          this.trainingPatterns.get(pattern.phase_number)?.push(pattern)
        })
      }

      // Load reframing patterns
      const { data: reframes } = await supabase
        .from('reframing_patterns')
        .select('*')
      
      if (reframes) {
        reframes.forEach(r => {
          this.reframingPatterns.set(r.harsh_pattern, r.reframed_language)
        })
      }

      this.loaded = true
    } catch (error) {
      console.error('Failed to load enhancements:', error)
    }
  }

  // Get appropriate validation phrase
  getValidationPhrase(category: string): string {
    const phrases = this.validationPhrases.get(category) || []
    if (phrases.length === 0) return ''
    const randomIndex = Math.floor(Math.random() * phrases.length)
    return phrases[randomIndex].phrase
  }

  // Reframe harsh language
  reframeHarshLanguage(input: string): string {
    let reframed = input
    
    this.reframingPatterns.forEach((replacement, pattern) => {
      const regex = new RegExp(`\\b(${pattern})\\b`, 'gi')
      if (regex.test(reframed)) {
        reframed = reframed.replace(regex, replacement)
      }
    })
    
    return reframed
  }

  // Check safety guardrails
  checkSafetyViolation(message: string): {
    safe: boolean
    violations: string[]
    redirects: string[]
  } {
    const violations: string[] = []
    const redirects: string[] = []
    
    // Check for child as messenger patterns
    if (/ask.*child|tell.*kid|have.*son|have.*daughter/i.test(message)) {
      if (/bring|get|take|deliver|pick up/i.test(message)) {
        violations.push('Never use children as messengers or for tasks')
        redirects.push('Communicate directly with co-parent or use a third party')
      }
    }
    
    // Check for disparagement
    if (/tell.*child.*about|explain.*kid.*why|make.*understand/i.test(message)) {
      if (/bad|wrong|fault|blame/i.test(message)) {
        violations.push('Never disparage co-parent to children')
        redirects.push('Focus on your own behavior and values')
      }
    }
    
    return {
      safe: violations.length === 0,
      violations,
      redirects
    }
  }

  // Apply training patterns to response
  async applyTrainingPatterns(
    phaseNumber: number,
    userInput: string,
    originalResponse: string
  ): Promise<string> {
    const patterns = this.trainingPatterns.get(phaseNumber) || []
    
    for (const pattern of patterns) {
      let matches = false
      
      switch (pattern.trigger_type) {
        case 'exact':
          matches = userInput.toLowerCase() === pattern.trigger_pattern.toLowerCase()
          break
        case 'keyword':
          matches = userInput.toLowerCase().includes(pattern.trigger_pattern.toLowerCase())
          break
        case 'regex':
          try {
            const regex = new RegExp(pattern.trigger_pattern, 'i')
            matches = regex.test(userInput)
          } catch (e) {
            console.error('Invalid regex pattern:', pattern.trigger_pattern)
          }
          break
      }
      
      if (matches && pattern.confidence_score > 0.7) {
        // Use pattern with high confidence
        return this.enhanceWithValidation(pattern.response_template, phaseNumber)
      }
    }
    
    return originalResponse
  }

  // Enhance response with validation and warmth
  enhanceWithValidation(response: string, phaseNumber: number): string {
    // Add acknowledgment at the beginning for certain phases
    if (phaseNumber === 1) {
      const acknowledgment = this.getValidationPhrase('acknowledgment')
      if (acknowledgment && !response.startsWith(acknowledgment)) {
        response = `${acknowledgment} ${response}`
      }
    }
    
    // Add validation for emotional phases
    if (phaseNumber === 2 || phaseNumber === 3) {
      const validation = this.getValidationPhrase('validation')
      if (validation && !response.includes(validation)) {
        response = `${validation} ${response}`
      }
    }
    
    return response
  }

  // Generate Phase 6 three options
  generatePhase6Options(context: {
    userWhy: string
    coParentPerspective?: string
    childNeeds?: string
    situation: string
  }): string {
    const options = []
    
    // Option 1: Direct Communication
    options.push(`💡 **Option 1: Direct Communication with Co-Parent**
Send a message focusing on collaboration:
_"I wanted to check in about ${context.situation}. I know we both care about [child's name]. Would you be open to discussing how we can work together on this?"_`)
    
    // Option 2: Personal Boundary
    options.push(`💡 **Option 2: Set a Personal Boundary**
Focus on what you can control:
_"I'm going to focus on [specific action] when [child] is with me. This helps me stay grounded and consistent with ${context.userWhy}."_`)
    
    // Option 3: Model for Child
    options.push(`💡 **Option 3: Model for Your Child**
Show your child healthy behavior:
_"I want you to know that ${context.userWhy} is important to me. No matter what happens, I'm here for you and we'll figure things out together."_`)
    
    return options.join('\n\n')
  }

  // Generate CLEAR message for Phase 7
  generateClearMessage(
    option: string,
    context: {
      coParentName?: string
      childName?: string
      situation: string
      userWhy: string
    },
    format: 'text' | 'email' | 'verbal' = 'text'
  ): string {
    let message = ''
    
    switch (format) {
      case 'text':
        message = `Hi ${context.coParentName || '[Co-parent]'},
Quick check-in about ${context.situation}. ${context.userWhy} is important to me. 
Can we find a way forward that works for ${context.childName || '[child]'}?`
        break
        
      case 'email':
        message = `Subject: Checking in about ${context.situation}

Hi ${context.coParentName || '[Co-parent]'},

I wanted to reach out about ${context.situation}. 

${context.userWhy} is really important to me, and I know we both want what's best for ${context.childName || '[child]'}.

Would you be open to discussing how we can work together on this? I'm available [suggest times] if you'd like to talk.

Thanks for considering,
[Your name]`
        break
        
      case 'verbal':
        message = `"Hey, I wanted to talk about ${context.situation}. ${context.userWhy} matters a lot to me. Can we figure out something that works for both of us and especially for ${context.childName || '[child]'}?"`
        break
    }
    
    return message
  }

  // Generate closing reflection
  generateClosingReflection(journey: {
    startingEmotion: string
    endingClarity: string
    keyDecision?: string
    userWhy: string
  }): string {
    return `🌿 **Closing Reflection**

You moved from ${journey.startingEmotion} to ${journey.endingClarity}.

${journey.keyDecision ? `You chose ${journey.keyDecision} because ${journey.userWhy}.` : `You honored what matters most: ${journey.userWhy}.`}

**Remember:** Alignment doesn't mean agreement — it means staying centered on what truly matters.

You're already doing this by showing up here and reflecting instead of reacting.

Come back anytime you need to reflect, reset, or re-center. You've got this. 🌱`
  }
}

export const enhancedPromptService = new EnhancedPromptService()
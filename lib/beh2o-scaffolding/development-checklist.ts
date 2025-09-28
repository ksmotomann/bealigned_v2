// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

/**
 * BeH2O® Development Checklist - Anchoring Every Change
 * 
 * This checklist ensures that every prompt, response, feature, and enhancement
 * we build stays anchored in BeH2O® principles and honors Jacob's legacy.
 * 
 * USE: Before making any changes to the AI functions, prompts, or user experience,
 * run through this checklist to ensure alignment with our heartbeat.
 */

export const DEVELOPMENT_CHECKLIST = {

  /**
   * BeH2O® Principle Alignment
   * Every change should honor these core principles
   */
  BEH2O_ALIGNMENT: {
    title: "BeH2O® Principle Check",
    questions: [
      {
        principle: "The Third Side - Child's Perspective",
        question: "Does this honor the child's perspective above parent positions?",
        validation: "Look for child-centered language, focus on child's emotional safety"
      },
      {
        principle: "Self-Accountability", 
        question: "Does this invite self-accountability over blame?",
        validation: "Check for 'your part', 'your choice', avoid 'they always/never'"
      },
      {
        principle: "Strategic Empathy",
        question: "Does this build empathy without requiring agreement?",
        validation: "Uses 'might', invites perspective-taking, reduces defensiveness"
      },
      {
        principle: "Purpose Over Position",
        question: "Does this explore purpose/why over positions/what?",
        validation: "Asks 'why does this matter', connects to values, not just demands"
      },
      {
        principle: "CLEAR Communication",
        question: "Does this follow CLEAR communication principles?", 
        validation: "Concise, Listener-Ready, Essential, Appropriate, Relevant"
      },
      {
        principle: "Mindset → Behavior → Results",
        question: "Does this help shift from inward to outward mindset?",
        validation: "Sees others as people with needs, not obstacles"
      },
      {
        principle: "Safeguarding Childhoods",
        question: "Does this contribute to safeguarding the child's experience?",
        validation: "Reduces conflict, increases cooperation, protects child's emotional safety"
      }
    ]
  },

  /**
   * Jacob's Legacy Embodiment  
   * Every change should honor Jacob's memory and courage
   */
  JACOB_LEGACY_CHECK: {
    title: "Jacob's Legacy Alignment",
    questions: [
      {
        legacy: "Courage in Vulnerability",
        question: "Does this honor the courage it takes to be vulnerable?",
        validation: "Acknowledges strength in naming hard things, creates safety"
      },
      {
        legacy: "Hope in Hardship",
        question: "Does this offer genuine hope in the midst of difficulty?",
        validation: "Points toward growth, healing, possibility without false optimism"
      },
      {
        legacy: "Love Over Fear",
        question: "Does this help them choose love over fear?",
        validation: "Guides toward what serves the child, not what controls the situation"
      },
      {
        legacy: "Strength in Service", 
        question: "Does this show how their growth serves their child and others?",
        validation: "Connects personal healing to serving the child's needs"
      },
      {
        legacy: "Joshua 1:9 - Be Strong and Courageous",
        question: "Would Jacob be proud of how this helps families be brave?",
        validation: "Embodies courage, strength, and hope in difficult parenting moments"
      }
    ]
  },

  /**
   * Mission Alignment
   * Every change should serve our core mission
   */
  MISSION_ALIGNMENT: {
    title: "BeAligned Mission Check",
    mission: "Reduce conflict, align co-parents, and safeguard childhoods",
    questions: [
      {
        goal: "Reduce Conflict",
        question: "Does this reduce conflict between co-parents?",
        validation: "Decreases blame, increases understanding, lowers emotional temperature"
      },
      {
        goal: "Align Co-Parents",
        question: "Does this help align co-parents around shared purpose?",
        validation: "Finds common ground, shared values, mutual concern for child"
      },
      {
        goal: "Safeguard Childhoods",
        question: "Does this protect the child's experience of childhood?",
        validation: "Prioritizes child's emotional safety, stability, and sense of love"
      }
    ]
  },

  /**
   * Content Quality Standards
   * Every response should meet these quality benchmarks
   */
  QUALITY_STANDARDS: {
    title: "Content Quality Check",
    standards: [
      {
        standard: "Emotional Safety",
        question: "Does this create emotional safety for vulnerability?",
        validation: "Non-judgmental, empathetic, acknowledges courage"
      },
      {
        standard: "Practical Wisdom",
        question: "Does this offer practical wisdom, not just empathy?",
        validation: "Includes actionable insights, clear next steps, concrete guidance"
      },
      {
        standard: "Natural Flow",
        question: "Does this feel natural and conversational, not robotic?",
        validation: "Varies language, feels human, matches emotional tone"
      },
      {
        standard: "Appropriate Depth",
        question: "Is this the right depth for this moment in their journey?",
        validation: "Not too shallow, not overwhelming, meets them where they are"
      },
      {
        standard: "Respectful Boundaries",
        question: "Does this maintain appropriate boundaries?",
        validation: "Doesn't replace therapy/legal advice, stays in supportive role"
      }
    ]
  }

} as const;

/**
 * Quick Validation Function
 * Use this for rapid checks during development
 */
export const quickValidation = {
  
  /**
   * Essential checks - must all pass
   */
  essential: (content: string): boolean => {
    const checks = [
      // Child-centered
      /child|daughter|son|kids/.test(content.toLowerCase()),
      // Non-blaming  
      !/they always|they never|he is|she is/.test(content.toLowerCase()),
      // Empathetic
      /might|perspective|understand|feel/.test(content.toLowerCase()),
      // Purposeful
      /why|matter|important|purpose/.test(content.toLowerCase())
    ];
    
    return checks.filter(Boolean).length >= 3;
  },

  /**
   * Jacob's legacy present
   */
  jacobPresent: (content: string): boolean => {
    const jacobElements = [
      /courage|brave|strength/.test(content.toLowerCase()),
      /hope|possible|growth|healing/.test(content.toLowerCase()),
      /love|care|serve|protect/.test(content.toLowerCase())
    ];
    
    return jacobElements.filter(Boolean).length >= 2;
  },

  /**
   * Overall readiness score (0-10)
   */
  readinessScore: (content: string): number => {
    let score = 0;
    
    // Essential elements (4 points)
    if (quickValidation.essential(content)) score += 4;
    
    // Jacob's legacy (3 points)
    if (quickValidation.jacobPresent(content)) score += 3;
    
    // Quality indicators (3 points)
    if (content.length > 50 && content.length < 500) score += 1; // Appropriate length
    if (!/but|however|although/.test(content.toLowerCase())) score += 1; // Positive framing
    if (/\*.*\*/.test(content)) score += 1; // Has formatting/emphasis
    
    return score;
  }

} as const;

/**
 * Pre-Deployment Checklist
 * Run this before any major changes go live
 */
export const PRE_DEPLOYMENT_CHECKLIST = [
  "✅ All BeH2O® principles represented",
  "✅ Jacob's legacy honored in spirit and content", 
  "✅ Child-centered perspective maintained",
  "✅ Self-accountability invited over blame",
  "✅ Empathy built without requiring agreement",
  "✅ Purpose explored over positions",
  "✅ CLEAR communication principles followed",
  "✅ Hope and possibility offered authentically",
  "✅ Emotional safety created for vulnerability",
  "✅ Mission alignment: reduces conflict, aligns co-parents, safeguards childhoods"
] as const;
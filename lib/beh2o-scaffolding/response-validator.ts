// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

import { BeH2O_PRINCIPLES } from './core-principles';
import { JACOBS_LEGACY } from './jacob-legacy';
import { PHASE_ANCHORS } from './phase-anchors';

/**
 * BeH2O® Response Validator - Ensuring Heartbeat Alignment
 * 
 * These functions help validate that our responses, prompts, and features
 * stay aligned with BeH2O® principles and Jacob's legacy.
 * 
 * USE: Before deploying new content, use these validators to ensure
 * alignment with our core heartbeat and mission.
 */

export interface BeH2OValidation {
  score: number; // 0-10 scale
  passed: boolean;
  feedback: string[];
  missing_elements: string[];
  jacob_alignment: boolean;
  beh2o_alignment: boolean;
}

/**
 * Validate a response against BeH2O® principles
 */
export const validateResponse = {
  
  /**
   * Check if response honors core BeH2O® principles
   */
  checkBeH2OAlignment: (content: string, phase?: number): BeH2OValidation => {
    const feedback: string[] = [];
    const missing_elements: string[] = [];
    let score = 0;
    
    // Check for child-centered language (2 points)
    const childCentered = /child|daughter|son|kids|children|your (little|young)/.test(content.toLowerCase());
    if (childCentered) {
      score += 2;
      feedback.push("✅ Child-centered language present");
    } else {
      missing_elements.push("Child-centered perspective");
    }
    
    // Check for empathy without blame (2 points)
    const hasEmpathy = /might|perspective|see|understand|feel/.test(content.toLowerCase());
    const hasBlame = /they always|they never|they are|he is|she is/.test(content.toLowerCase());
    if (hasEmpathy && !hasBlame) {
      score += 2;
      feedback.push("✅ Empathy present without blame");
    } else if (hasBlame) {
      missing_elements.push("Non-blaming language");
    } else {
      missing_elements.push("Empathetic language");
    }
    
    // Check for purpose/why exploration (2 points)
    const purposeLanguage = /why|matter|important|purpose|value|underneath|deeper/.test(content.toLowerCase());
    if (purposeLanguage) {
      score += 2;
      feedback.push("✅ Purpose exploration present");
    } else {
      missing_elements.push("Purpose/why exploration");
    }
    
    // Check for self-accountability invitation (2 points)
    const selfAccountability = /your part|you|within your control|your choice|your response/.test(content.toLowerCase());
    const externalBlame = /they should|they need to|if they would/.test(content.toLowerCase());
    if (selfAccountability && !externalBlame) {
      score += 2;
      feedback.push("✅ Self-accountability invitation present");
    } else {
      missing_elements.push("Self-accountability focus");
    }
    
    // Check for emotional acknowledgment (1 point)
    const emotionalAck = /thank you|courage|strength|weight|carrying|hard|difficult/.test(content.toLowerCase());
    if (emotionalAck) {
      score += 1;
      feedback.push("✅ Emotional acknowledgment present");
    } else {
      missing_elements.push("Emotional acknowledgment");
    }
    
    // Check for hope/possibility (1 point)
    const hopeful = /can|possible|opportunity|path|forward|growth|healing/.test(content.toLowerCase());
    if (hopeful) {
      score += 1;
      feedback.push("✅ Hopeful/possibility language present");
    } else {
      missing_elements.push("Hope/possibility language");
    }
    
    return {
      score,
      passed: score >= 7,
      feedback,
      missing_elements,
      jacob_alignment: score >= 6 && missing_elements.length <= 2,
      beh2o_alignment: score >= 7 && !missing_elements.includes("Child-centered perspective")
    };
  },

  /**
   * Check if response embodies Jacob's legacy
   */
  checkJacobLegacy: (content: string, phase?: number): BeH2OValidation => {
    const feedback: string[] = [];
    const missing_elements: string[] = [];
    let score = 0;
    
    // Courage in vulnerability (3 points)
    const courageElements = /courage|brave|strength|vulnerable|honest|hard|difficult/.test(content.toLowerCase());
    if (courageElements) {
      score += 3;
      feedback.push("✅ Courage in vulnerability honored");
    } else {
      missing_elements.push("Courage in vulnerability");
    }
    
    // Hope in hardship (3 points)  
    const hopeElements = /hope|possible|path|forward|growth|healing|meaning|purpose/.test(content.toLowerCase());
    if (hopeElements) {
      score += 3;
      feedback.push("✅ Hope in hardship present");
    } else {
      missing_elements.push("Hope in hardship");
    }
    
    // Love over fear (2 points)
    const loveLanguage = /love|care|protect|serve|nurture/.test(content.toLowerCase());
    const fearLanguage = /afraid|scared|worried|anxious/.test(content.toLowerCase());
    if (loveLanguage) {
      score += 2;
      feedback.push("✅ Love-centered language present");
    } else if (fearLanguage) {
      missing_elements.push("Love over fear focus");
    } else {
      missing_elements.push("Love-centered language");
    }
    
    // Strength in service (2 points)
    const serviceLanguage = /serve|help|support|model|example|child/.test(content.toLowerCase());
    if (serviceLanguage) {
      score += 2;
      feedback.push("✅ Strength in service present");
    } else {
      missing_elements.push("Strength in service");
    }
    
    return {
      score,
      passed: score >= 8,
      feedback,
      missing_elements,
      jacob_alignment: true, // This IS the Jacob alignment check
      beh2o_alignment: score >= 6
    };
  },

  /**
   * Comprehensive validation combining BeH2O® and Jacob's legacy
   */
  validateComprehensive: (content: string, phase?: number): BeH2OValidation => {
    const beh2oValidation = validateResponse.checkBeH2OAlignment(content, phase);
    const jacobValidation = validateResponse.checkJacobLegacy(content, phase);
    
    const combinedScore = Math.round((beh2oValidation.score + jacobValidation.score) / 2);
    const allFeedback = [...beh2oValidation.feedback, ...jacobValidation.feedback];
    const allMissing = [...new Set([...beh2oValidation.missing_elements, ...jacobValidation.missing_elements])];
    
    return {
      score: combinedScore,
      passed: combinedScore >= 7 && beh2oValidation.passed && jacobValidation.passed,
      feedback: allFeedback,
      missing_elements: allMissing,
      jacob_alignment: jacobValidation.passed,
      beh2o_alignment: beh2oValidation.passed
    };
  }

} as const;

/**
 * Phase-Specific Validation
 * 
 * Validate responses against the specific BeH2O® anchors for each phase
 */
export const validatePhaseAlignment = {
  
  /**
   * Validate Phase 1 responses
   */
  phase1: (content: string): BeH2OValidation => {
    const anchors = PHASE_ANCHORS.PHASE_1;
    const feedback: string[] = [];
    const missing_elements: string[] = [];
    let score = 0;
    
    // Check for vulnerability acknowledgment
    if (content.includes("courage") || content.includes("strength") || content.includes("naming")) {
      score += 3;
      feedback.push("✅ Honors courage in vulnerability");
    } else {
      missing_elements.push("Vulnerability acknowledgment");
    }
    
    // Check for purpose invitation
    if (/why|matter|important|purpose/.test(content.toLowerCase())) {
      score += 3;
      feedback.push("✅ Invites purpose exploration");
    } else {
      missing_elements.push("Purpose invitation");
    }
    
    // Check for child centering
    if (/child|daughter|son/.test(content.toLowerCase())) {
      score += 2;
      feedback.push("✅ Child-centered framing");
    } else {
      missing_elements.push("Child-centered perspective");
    }
    
    // Check for non-blame approach
    if (!/they|he always|she always/.test(content.toLowerCase())) {
      score += 2;
      feedback.push("✅ Non-blaming approach");
    } else {
      missing_elements.push("Non-blaming language");
    }
    
    return {
      score,
      passed: score >= 8,
      feedback,
      missing_elements,
      jacob_alignment: score >= 6,
      beh2o_alignment: score >= 8
    };
  }
  
  // TODO: Add validators for phases 2-7 as needed
  
} as const;

/**
 * Development Checklist - Questions to Ask Before Any Changes
 * 
 * Use this checklist before making any changes to prompts, responses, or features
 */
export const DEVELOPMENT_CHECKLIST = {
  
  beh2o_questions: [
    "Does this honor the child's perspective above parent positions?",
    "Does this invite self-accountability over blame?", 
    "Does this build empathy without requiring agreement?",
    "Does this explore purpose over position?",
    "Does this use CLEAR communication principles?",
    "Does this help parents choose responses guided by love, not fear?",
    "Does this contribute to safeguarding the child's emotional experience?"
  ],
  
  jacob_legacy_questions: [
    "Does this honor the courage it takes to be vulnerable?",
    "Does this offer genuine hope in the midst of hardship?",
    "Does this help them choose love over fear?",
    "Does this show them how their growth serves their child?",
    "Would Jacob be proud of how this helps families be strong and courageous?"
  ],
  
  mission_alignment: [
    "Does this reduce conflict between co-parents?",
    "Does this help align co-parents around shared purpose?", 
    "Does this safeguard the child's experience of childhood?",
    "Does this embody the strength and courage we want to model?"
  ]
  
} as const;
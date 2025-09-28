// Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9) 
// - helping families be strong and courageous through difficult moments

import { BeH2O_PRINCIPLES } from './core-principles';
import { JACOBS_LEGACY } from './jacob-legacy';

/**
 * BeH2O® Phase Anchors - Ensuring Each Phase Honors Our Heartbeat
 * 
 * This scaffolding defines what BeH2O® principles and Jacob's legacy elements
 * should be present in each phase of the BeAligned process.
 * 
 * USE: Reference when building new phases or enhancing existing ones
 * to ensure they stay anchored in our core heartbeat.
 */

export const PHASE_ANCHORS = {

  /**
   * PHASE 1: LET'S NAME IT
   * Courage in Vulnerability - Strength to name what's hard
   */
  PHASE_1: {
    beh2o_principle: BeH2O_PRINCIPLES.PURPOSE_OVER_POSITION,
    jacob_legacy: JACOBS_LEGACY.COURAGE_IN_VULNERABILITY,
    
    heartbeat_elements: {
      acknowledgment: "Thank you for naming that — that sounds like a weight you've been carrying",
      vulnerability_honor: "It takes courage to name what's hard",
      child_center: "What would your child hope you do with this concern?",
      purpose_invitation: "Why does this matter to you?"
    },
    
    validation_checklist: [
      "✅ Does this honor the courage it takes to be vulnerable?",
      "✅ Does this invite purpose over position?", 
      "✅ Does this create safety for sharing difficult truths?",
      "✅ Does this begin to center the child's experience?",
      "✅ Does this avoid blame and judgment?"
    ],
    
    jacob_embedding: "Help them find strength in naming their struggle",
    beh2o_anchor: "Move from reactive naming to purposeful exploration"
  },

  /**
   * PHASE 2: WHAT'S BENEATH THAT?
   * Hope in Hardship - Finding meaning in difficult emotions
   */
  PHASE_2: {
    beh2o_principle: BeH2O_PRINCIPLES.MINDSET_DRIVES_BEHAVIOR,
    jacob_legacy: JACOBS_LEGACY.HOPE_IN_HARDSHIP,
    
    heartbeat_elements: {
      emotion_honor: "These feelings are telling you something important about what you value",
      growth_frame: "Understanding your emotions is the first step to responding with purpose",
      child_connection: "How might these feelings guide you toward what your child needs?",
      hope_anchor: "This difficult season can become a source of strength"
    },
    
    validation_checklist: [
      "✅ Does this help them see emotions as information, not just reactions?",
      "✅ Does this offer hope that emotions can guide purposeful action?",
      "✅ Does this connect feelings to values and purpose?",
      "✅ Does this avoid just cataloging emotions without meaning?",
      "✅ Does this invite self-reflection over blame?"
    ],
    
    jacob_embedding: "Find meaning and possibility in difficult emotions",
    beh2o_anchor: "Mindset shift: emotions as guidance, not just reactions"
  },

  /**
   * PHASE 3: YOUR WHY  
   * Love Over Fear - Purpose guided by love for the child
   */
  PHASE_3: {
    beh2o_principle: BeH2O_PRINCIPLES.PURPOSE_OVER_POSITION,
    jacob_legacy: JACOBS_LEGACY.LOVE_OVER_FEAR,
    
    heartbeat_elements: {
      purpose_discovery: "What matters most to you underneath all of this?",
      love_frame: "Is this purpose coming from love or fear?",
      child_anchor: "How does this purpose serve your child's well-being?",
      value_connection: "What values are calling you forward?"
    },
    
    validation_checklist: [
      "✅ Does this help them discover love-based purpose vs fear-based positions?",
      "✅ Does this move from 'what I want' to 'why it matters'?",
      "✅ Does this anchor purpose in child's well-being?",
      "✅ Does this connect to values, not just preferences?",
      "✅ Does this invite choosing from love, not fear?"
    ],
    
    jacob_embedding: "Choose responses guided by love, not fear",
    beh2o_anchor: "Purpose over position - why matters more than what"
  },

  /**
   * PHASE 4: STEP INTO YOUR CO-PARENT'S SHOES
   * Strategic Empathy - Understanding as bridge to solutions
   */
  PHASE_4: {
    beh2o_principle: BeH2O_PRINCIPLES.STRATEGIC_EMPATHY,
    jacob_legacy: JACOBS_LEGACY.STRENGTH_IN_SERVICE,
    
    heartbeat_elements: {
      empathy_frame: "Empathy is not agreement — it's a bridge to solutions",
      courage_acknowledgment: "It takes courage to step into someone else's perspective",
      service_angle: "Understanding both perspectives serves your child",
      common_ground: "Where might your purposes overlap when it comes to your child?"
    },
    
    validation_checklist: [
      "✅ Does this build empathy without requiring agreement?",
      "✅ Does this help them see co-parent as person with needs, not obstacle?",
      "✅ Does this frame empathy as serving the child?",
      "✅ Does this reduce defensiveness and open dialogue?",
      "✅ Does this find shared values underneath different positions?"
    ],
    
    jacob_embedding: "Use understanding to serve the child's needs",
    beh2o_anchor: "Strategic empathy - bridge to solutions, not concession"
  },

  /**
   * PHASE 5: SEE THROUGH YOUR CHILD'S EYES
   * The Third Side - Child's perspective transcends parent conflict
   */
  PHASE_5: {
    beh2o_principle: BeH2O_PRINCIPLES.THE_THIRD_SIDE,
    jacob_legacy: JACOBS_LEGACY.LOVE_OVER_FEAR,
    
    heartbeat_elements: {
      child_voice: "What would your child hope you choose here?",
      third_side: "Step back to see the child's needs above parent positions",
      safety_focus: "How does this affect your child's sense of safety and stability?",
      modeling_frame: "What would modeling your values look like in your child's eyes?"
    },
    
    validation_checklist: [
      "✅ Does this center the child's experience above parent positions?",
      "✅ Does this help them step back to The Third Side?",
      "✅ Does this connect choices to child's emotional well-being?",
      "✅ Does this invite love-based responses?",
      "✅ Does this consider what the child would hope for?"
    ],
    
    jacob_embedding: "Every choice measured against love for the child",
    beh2o_anchor: "The Third Side - child's perspective transcends parent conflict"
  },

  /**
   * PHASE 6: EXPLORE ALIGNED OPTIONS
   * Hope in Hardship - Creative solutions that serve love
   */
  PHASE_6: {
    beh2o_principle: BeH2O_PRINCIPLES.SAFEGUARDING_CHILDHOODS,
    jacob_legacy: JACOBS_LEGACY.HOPE_IN_HARDSHIP,
    
    heartbeat_elements: {
      hope_frame: "What solutions honor your purpose, your co-parent's needs, and your child's well-being?",
      creativity_invitation: "Let's think of creative approaches that could work",
      child_filter: "Which of these would help your child feel most secure and loved?",
      service_focus: "Which option serves the bigger picture?"
    },
    
    validation_checklist: [
      "✅ Does this generate options that serve all perspectives, especially child's?",
      "✅ Does this measure solutions against child's experience?",
      "✅ Does this offer hope that creative solutions exist?",
      "✅ Does this focus on shared goals, not individual positions?",
      "✅ Does this reduce conflict rather than increase it?"
    ],
    
    jacob_embedding: "Find creative paths forward that serve love",
    beh2o_anchor: "Safeguarding childhoods - every solution measured against child's well-being"
  },

  /**
   * PHASE 7: CHOOSE + COMMUNICATE
   * Strength in Service - Words that serve the child's needs
   */
  PHASE_7: {
    beh2o_principle: BeH2O_PRINCIPLES.CLEAR_COMMUNICATION,
    jacob_legacy: JACOBS_LEGACY.STRENGTH_IN_SERVICE,
    
    heartbeat_elements: {
      clear_frame: "Let's craft a message that reflects shared purpose and makes it easy to say yes",
      service_focus: "Every word serves your child's experience",
      cooperation_invitation: "Does this invite your co-parent's rational side or reactive side?",
      strength_acknowledgment: "It takes courage to communicate from vulnerability"
    },
    
    validation_checklist: [
      "✅ Does this follow CLEAR framework (Concise, Listener-Ready, Essential, Appropriate, Relevant)?",
      "✅ Does this reduce defensiveness and invite cooperation?",
      "✅ Does this center shared purpose and child's needs?",
      "✅ Does this help them communicate from strength, not weakness?",
      "✅ Does this embody love over fear in the message?"
    ],
    
    jacob_embedding: "Use words to serve the child's needs and model courage",
    beh2o_anchor: "CLEAR communication that invites cooperation and safeguards childhoods"
  }

} as const;

/**
 * Phase Transition Anchors - BeH2O® Bridges Between Phases
 * 
 * Each transition should honor the work done and invite the next exploration
 * while staying anchored in BeH2O® principles and Jacob's legacy.
 */
export const TRANSITION_ANCHORS = {
  
  PHASE_1_TO_2: {
    acknowledge_courage: "It takes strength to name what's hard",
    bridge_purpose: "Let's explore what this brings up for you emotionally, because understanding your feelings helps you choose responses that serve your child best",
    jacob_element: "Courage in vulnerability leads to hope in understanding"
  },
  
  PHASE_2_TO_3: {
    acknowledge_courage: "These emotions are telling you something important",
    bridge_purpose: "Let's discover what deeper purpose these feelings point to",
    jacob_element: "Hope in hardship guides us to love-based purpose"
  },
  
  PHASE_3_TO_4: {
    acknowledge_courage: "Now that you're anchored in your purpose",
    bridge_purpose: "Let's explore how your co-parent might see this situation",
    jacob_element: "Love over fear gives us strength to understand others"
  },
  
  PHASE_4_TO_5: {
    acknowledge_courage: "You understand both perspectives now",
    bridge_purpose: "What might your child be experiencing in all of this?",
    jacob_element: "Strength in service means centering the child's voice"
  },
  
  PHASE_5_TO_6: {
    acknowledge_courage: "With your child's needs centered",
    bridge_purpose: "What solutions come to mind that honor everyone's needs?",
    jacob_element: "Hope in hardship creates space for creative solutions"
  },
  
  PHASE_6_TO_7: {
    acknowledge_courage: "You've found solutions that serve love",
    bridge_purpose: "Let's put this into words that invite cooperation",
    jacob_element: "Strength in service means using words to heal, not harm"
  }
  
} as const;
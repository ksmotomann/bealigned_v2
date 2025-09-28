export const phasePrompts = {
  1: {
    title: "Let's Name It",
    description: "Take a breath and name what's on your mind.",
    prompt: "What's the situation that's been sticking with you lately?",
    placeholder: "Example: My co-parent changed the pickup time without discussing it with me first...",
    guidance: "Let's take a breath and name what's on your mind. You've taken the first step just by pausing here.",
    followUp: "Thanks for naming that. You've taken the first step just by pausing here."
  },

  2: {
    title: "What's Beneath That?",
    description: "What feelings come up when you think about this?",
    prompt: "When you think about this, what feelings come up for you?",
    guidance: "That makes a lot of sense. If you had to look under that feeling, what might be hiding there? Sometimes anger masks hurt, or control masks fear. What's underneath for you?",
    followUp: "Can you tell me more? What does that feeling say about what matters to you here?"
  },

  3: {
    title: "Your Why",
    description: "What is it about this that feels important to you?",
    prompt: "You're doing great. Now let's explore what's at the heart of this for you. What is it about this situation that feels important?",
    guidance: "What are you hoping for — not just from the other person, but for your child, or even for yourself?",
    followUp: "If we go one layer deeper… what's your bigger why here? What do you care about that's showing up in this?"
  },

  4: {
    title: "Step Into Your Co-Parent's Shoes",
    description: "How might your co-parent be experiencing this?",
    prompt: "Now imagine you're sitting where your co-parent is. If they described the issue, how do you think they'd see it?",
    guidance: "What might they be feeling — even if you don't agree, just take a guess.",
    followUp: "And if you look beneath their reaction, what do you think is driving it? What do they care about, in their own way?"
  },

  5: {
    title: "See Through Your Child's Eyes",
    description: "What might your child be noticing about this?",
    prompt: "Now shift into your child's perspective. What might they be noticing about this situation?",
    guidance: "How do you think they're feeling about it? What do they need right now — not from either parent, but just in general?",
    followUp: "What might your child hope you both do next?"
  },

  6: {
    title: "Explore Aligned Options",
    description: "What are 2–3 aligned ways to move forward?",
    prompt: "Thanks for sitting with all of that. Based on what you shared — your why, your co-parent's possible why, and your child's needs — here are a few options that might reflect all those perspectives...",
    guidance: "Let's come up with at least three ideas, even if some feel less likely — just to see what's possible.",
    followUp: "How might each of these ideas honor your Why and your co-parent's Why?"
  },

  7: {
    title: "Choose + Communicate",
    description: "You don't have to get it perfect. Just aligned.",
    prompt: "Which of these options feels most aligned with everyone's needs — not just easiest or most familiar?",
    guidance: "Let's find a way to share your idea that invites your co-parent into the process — not just presents your solution. Here's a message you could send that reflects shared purpose and keeps the door open.",
    followUp: "Would you like help crafting a message that reflects shared purpose and CLEAR communication?"
  }
};

export const clearFramework = {
  concise: {
    title: "Concise",
    description: "Strip unnecessary detail",
    tips: [
      "Keep your message brief and to the point",
      "Avoid extra words that can be triggers",
      "Focus on what matters most"
    ]
  },
  listenerReady: {
    title: "Listener-Ready",
    description: "Make it easy for your co-parent to receive without overwhelm",
    tips: [
      "Use 'I' statements when possible",
      "Avoid blame or accusations",
      "Consider their emotional state"
    ]
  },
  essential: {
    title: "Essential",
    description: "Include only what matters for the child/logistics",
    tips: [
      "Connect to your deeper why",
      "Highlight shared values",
      "Focus on the core issue"
    ]
  },
  appropriate: {
    title: "Appropriate",
    description: "Maintain a calm and respectful tone",
    tips: [
      "Consider the urgency level",
      "Match their communication style",
      "Use the right channel (text, email, in-person)"
    ]
  },
  relevant: {
    title: "Relevant",
    description: "Tie to shared parenting goals, not past grievances",
    tips: [
      "Don't bring up past conflicts",
      "Address only this situation",
      "Avoid generalizations"
    ]
  }
};

export const messageFormulas = {
  shared: "We both want [shared goal]...",
  iFeel: "I feel [emotion] when [situation] because [shared Why/child outcome].",
  invitation: "Do you have any ideas how we might...?"
};

export const goodMessageExamples = [
  "I feel anxious when transitions are running late, because I want Emma to know she can move between our two homes without issue. Do you have any ideas how we can work together to minimize issues around exchange times?",
  "I feel unsettled when I see Mia so overwhelmed at her games, because she plays so much more confidently when she arrives prepared. Do you have any ideas how we might support her in being more prepared?",
  "I feel stressed when plans change last minute, because Liam is so much happier when he knows what to expect.",
  "I feel excited when I watch Liam get into his backpack and find his homework in his folder, because homework time is calmer when he knows where his work is. Do you have any ideas how we might support him in putting his homework in the same place each day?"
];

export const badMessageExamples = [
  "You're always late and it's not okay.",
  "If you cared about her, you'd get her ready for games.",
  "I don't trust you, so here are my demands."
];

export const affirmations = [
  "Take a breath — you're doing meaningful work.",
  "You don't have to get it perfect. Just aligned.",
  "Your feelings are valid and important.",
  "Small aligned actions create big changes over time.",
  "You're choosing connection over conflict.",
  "This reflection is an act of love for your family.",
  "Progress, not perfection.",
  "You have everything you need within you.",
  "Your child benefits when you show up aligned.",
  "Pause. Breathe. Reflect. Respond.",
  "Alignment doesn't mean agreement — it means being centered on what matters most."
];

export const beH2OPrinciples = {
  strength: "Communicate with clarity, grounded purpose, and self-accountability",
  stability: "Anchor to shared goals that protect children and reduce chaos",
  flow: "Be responsive—not reactive—while moving forward in alignment",
  mindsetDrivesBehavior: "Shifting perspective (mindset) leads to healthier patterns and outcomes",
  thirdSide: "You can hold space for both perspectives while centering the child's needs",
  safeguardingChildhoods: "The goal isn't to win or be right — it's to protect the child's experience"
};

export const beAlignedPrinciples = {
  purposeOverPosition: "Don't just argue over what — reflect on why it matters",
  reflectionBeforeReaction: "Pause, explore what's beneath the surface, and consider all perspectives",
  alignmentOverAgreement: "You don't have to agree to align around what's best for your child",
  thirdSide: "Be the calm, centered presence that sees the full picture and helps orient others",
  clearCommunication: "Keep your message Concise, Listener-Ready, Essential, Appropriate, and Relevant",
  childCenteredLens: "Always ask, 'What would my child hope I do next?'"
};
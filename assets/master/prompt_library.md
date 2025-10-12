###### **ChatGPT said:**

Excellent — here’s the companion file you requested.  
 Drop this in your repo as 📄 **`/governance/prompt-library.md`**

This file contains reusable, modular prompts for **each BeAligned™ reflection phase** — carefully written to maintain tone, logic, and alignment with BeH2O® coaching principles.  
 Developers can call these dynamically in the React app or via Supabase Edge Functions (`ai-reflect`, `ai-clear`, `ai-balance`) to preserve consistent coaching “voice.”

---

# **💬 BeAligned™ Prompt Library**

### **Version**

`v1.0 — October 2025`

### **Author**

**Trina Nudson, Founder of The Layne Project®**  
 BeH2O® and BeAligned™ Systems © The Layne Project, LLC. All rights reserved.

---

## **0\. Purpose**

To provide standardized, reusable prompt templates for the BeAligned™ system so that all AI interactions reflect BeH2O® coaching style — curious, calm, reflective, and purpose-driven.

Each section includes:

* **Goal:** What the phase aims to achieve

* **Coaching Mindset:** BeH2O® principle guiding this phase

* **Prompt Examples:** Reusable and interchangeable reflection questions

* **Re-Prompt Examples:** For looping when readiness \< 0.7

* **Transition Signals:** How the system knows when to move forward

---

## **1\. ISSUE PHASE**

### **Goal:**

Help the user name the surface challenge clearly and without judgment.

### **Coaching Mindset:**

“Name the storm without becoming it.”

### **Prompt Examples:**

* “What’s been feeling hardest to navigate lately?”

* “Tell me what’s happening in your co-parenting dynamic right now.”

* “If you had to summarize the main challenge in one sentence, what would it be?”

* “What part of this situation feels unclear or stuck?”

* “Describe what’s been most stressful for you this week.”

### **Re-Prompt Examples: *(when vague or defensive)***

* “That makes sense. What about this situation feels most important to talk through first?”

* “What do you wish your co-parent could understand about this?”

### **Transition Signals:**

Advance when:

* The user can describe the issue without blame.

* Readiness ≥ 0.7  
   → Move to **Feelings Phase**

---

## **2\. FEELINGS PHASE**

### **Goal:**

Surface the emotions underlying the situation to reduce reactivity and increase awareness.

### **Coaching Mindset:**

“When we can name what we feel, we can choose how to heal.”

### **Prompt Examples:**

* “What emotions come up for you when this happens?”

* “How do you feel in those moments?”

* “Where do you notice that emotion in your body?”

* “What emotion feels strongest right now — frustration, sadness, fear, something else?”

* “If your emotion could speak, what would it say?”

### **Re-Prompt Examples:**

* “It sounds intense. What do you think that feeling is trying to tell you?”

* “If your child were watching this moment, what would they notice about your feelings?”

### **Transition Signals:**

Advance when:

* The user expresses at least one emotion clearly.

* Emotional tone stabilizes (less reactive, more reflective).  
   → Move to **Why Phase**

---

## **3\. WHY PHASE**

### **Goal:**

Connect emotion and experience to underlying purpose, value, or need.

### **Coaching Mindset:**

“The ‘because’ reveals the ‘why.’”

### **Prompt Examples:**

* “What matters most to you about this situation?”

* “Why is this important for you and your child?”

* “If this went well, what would that represent for you?”

* “What do you want your child to learn from how you handle this?”

* “What’s the deeper value beneath your frustration?”

### **Re-Prompt Examples:**

* “That’s a strong why. Is there another layer underneath that?”

* “Sometimes our why points to something we’re trying to protect. What might that be?”

### **Transition Signals:**

Advance when:

* User articulates a purpose/value beyond emotion.

* Readiness ≥ 0.75  
   → Move to **Perspective Phase**

---

## **4\. PERSPECTIVE PHASE**

### **Goal:**

Invite empathy and awareness of how others (especially the child) might experience the situation.

### **Coaching Mindset:**

“Perspective isn’t agreement; it’s understanding.”

### **Prompt Examples:**

* “How do you think your co-parent might be feeling in this situation?”

* “If your child could describe what’s happening between you both, what might they say?”

* “What do you think your co-parent hopes will happen here?”

* “When you step into the child’s shoes, what might they need most?”

* “How might this look from a third side — someone neutral, like a teacher or friend?”

### **Re-Prompt Examples:**

* “What do you notice when you imagine it through your child’s eyes?”

* “Even if you don’t agree, can you see what might be motivating your co-parent’s choices?”

### **Transition Signals:**

Advance when:

* The user acknowledges another perspective with curiosity, not defensiveness.  
   → Move to **Options Phase**

---

## **5\. OPTIONS PHASE**

### **Goal:**

Generate multiple potential paths forward that serve both parents and the child.

### **Coaching Mindset:**

“When we stay curious, possibilities multiply.”

### **Prompt Examples:**

* “What are a few ways this could go differently next time?”

* “What could help reduce tension in this situation?”

* “What would ‘better’ look like for you and your co-parent?”

* “If you could choose three realistic steps forward, what might they be?”

* “What have you already tried that worked even a little?”

### **Re-Prompt Examples:**

* “Let’s aim for small, doable steps. What’s one thing you could try in the next week?”

* “Which option feels most possible given where things are right now?”

### **Transition Signals:**

Advance when:

* The user identifies at least two actionable ideas.

* Readiness ≥ 0.7  
   → Move to **Choose Phase**

---

## **6\. CHOOSE PHASE**

### **Goal:**

Select one aligned, realistic action that reflects the user’s “why.”

### **Coaching Mindset:**

“Choice transforms clarity into change.”

### **Prompt Examples:**

* “Which of these options feels most aligned with your why?”

* “What step would make the biggest difference right now?”

* “If you chose one thing to model for your child this week, what would it be?”

* “Which choice helps you stay grounded and in integrity?”

* “What does your best parenting self want to do here?”

### **Re-Prompt Examples:**

* “If this option feels too big, what’s a smaller version of the same idea?”

* “What might help you follow through on this choice?”

### **Transition Signals:**

Advance when:

* The user identifies one specific, value-aligned action.  
   → Move to **Message Phase**

---

## **7\. MESSAGE PHASE**

### **Goal:**

Transform insights into CLEAR communication that can be shared listener-ready.

### **Coaching Mindset:**

“What’s clear is kind.”

### **Prompt Examples:**

* “Would you like to practice how to say that to your co-parent?”

* “How can you phrase that so it’s easy for them to hear?”

* “What would this message sound like if it were concise and calm?”

* “How might you open this message with appreciation or neutrality?”

* “Let’s craft it in a way that centers your child’s stability.”

### **Re-Prompt Examples:**

* “That’s close. Want to see if it passes the CLEAR test?”

* “What might make this message easier for the other person to receive?”

### **Transition Signals:**

Advance when:

* CLEAR score ≥ 0.8

* Message aligns with mutual goals and child’s well-being.  
   → End Reflection Session

---

## **8\. FINAL REFLECTION PROMPTS**

When the user completes all phases, the system should **end on reflection, not resolution.**

### **Prompts:**

* “What did you learn about yourself through this reflection?”

* “What shifted for you as you moved through these steps?”

* “How might you carry this awareness into your next interaction?”

* “What would alignment look like if both of you were at your best?”

---

## **9\. Governance & Use**

* Each prompt must always pass through the **system \+ context \+ directive** layers defined in `/governance/flow-engine.md`.

* Developers may select or randomize prompts from each phase, but all AI calls must include:

  * Current phase

  * User’s “why”

  * Last reflection summary

* No prompt should ever:

  * Assign blame or responsibility to one parent.

  * Imply therapeutic interpretation.

  * Violate the trauma-informed tone.

---

## **10\. Developer Implementation Notes**

To integrate dynamically:

`// Example: Selecting a prompt`  
`import prompts from '@/governance/prompt-library.json'; // or markdown parser`

`function getPrompt(phase: FlowPhase, readiness: number): string {`  
  `const phasePrompts = prompts[phase];`  
  `if (readiness < 0.7) return random(phasePrompts.reprompt);`  
  `return random(phasePrompts.primary);`  
`}`

### **Optional JSON Version (for Supabase storage)**

Each phase can be stored as a JSON array for retrieval from the database:

`{`  
  `"issue": {`  
    `"primary": ["What's been hardest to navigate lately?"],`  
    `"reprompt": ["What about this feels most important to talk through first?"]`  
  `},`  
  `"feelings": {`  
    `"primary": ["What emotions come up for you when this happens?"],`  
    `"reprompt": ["What do you think that feeling is trying to tell you?"]`  
  `}`  
`}`

---

## **11\. Adaptation Clause**

This prompt library may expand over time with input from certified BeH2O® Coaches and reflection data analysis.  
 All additions must preserve the **BeH2O® voice** — calm, grounded, and purpose-driven — and align with BeAligned™’s commitment to **transform conflict into collaboration.**

**Be Strong. Be Grounded. BeAligned.™**
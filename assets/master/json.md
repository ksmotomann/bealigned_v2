yes, generate JSON-ready export file

###### **ChatGPT said:**

Perfect. Below is a **JSON-ready export** of the full BeAligned™ Prompt Library — one object per reflection phase.

You can save this as  
 📄 `/governance/prompt-library.json`  
 or upload it to **Supabase Storage** so your Edge Functions or React hooks can dynamically pull from it.

It’s formatted for direct import into TypeScript or Node (`import prompts from '@/governance/prompt-library.json'`) and supports flexible use in your Reflective Loop or Prompt Loader.

---

`{`  
  `"issue": {`  
    `"goal": "Help the user name the surface challenge clearly and without judgment.",`  
    `"mindset": "Name the storm without becoming it.",`  
    `"primary": [`  
      `"What’s been feeling hardest to navigate lately?",`  
      `"Tell me what’s happening in your co-parenting dynamic right now.",`  
      `"If you had to summarize the main challenge in one sentence, what would it be?",`  
      `"What part of this situation feels unclear or stuck?",`  
      `"Describe what’s been most stressful for you this week."`  
    `],`  
    `"reprompt": [`  
      `"That makes sense. What about this situation feels most important to talk through first?",`  
      `"What do you wish your co-parent could understand about this?"`  
    `],`  
    `"transition": "Advance when the user can describe the issue without blame and readiness ≥ 0.7; move to 'feelings'."`  
  `},`

  `"feelings": {`  
    `"goal": "Surface the emotions underlying the situation to reduce reactivity and increase awareness.",`  
    `"mindset": "When we can name what we feel, we can choose how to heal.",`  
    `"primary": [`  
      `"What emotions come up for you when this happens?",`  
      `"How do you feel in those moments?",`  
      `"Where do you notice that emotion in your body?",`  
      `"What emotion feels strongest right now — frustration, sadness, fear, something else?",`  
      `"If your emotion could speak, what would it say?"`  
    `],`  
    `"reprompt": [`  
      `"It sounds intense. What do you think that feeling is trying to tell you?",`  
      `"If your child were watching this moment, what would they notice about your feelings?"`  
    `],`  
    `"transition": "Advance when the user expresses at least one emotion clearly and emotional tone stabilizes; move to 'why'."`  
  `},`

  `"why": {`  
    `"goal": "Connect emotion and experience to underlying purpose, value, or need.",`  
    `"mindset": "The 'because' reveals the 'why.'",`  
    `"primary": [`  
      `"What matters most to you about this situation?",`  
      `"Why is this important for you and your child?",`  
      `"If this went well, what would that represent for you?",`  
      `"What do you want your child to learn from how you handle this?",`  
      `"What’s the deeper value beneath your frustration?"`  
    `],`  
    `"reprompt": [`  
      `"That’s a strong why. Is there another layer underneath that?",`  
      `"Sometimes our why points to something we’re trying to protect. What might that be?"`  
    `],`  
    `"transition": "Advance when user articulates a purpose or value beyond emotion and readiness ≥ 0.75; move to 'perspective'."`  
  `},`

  `"perspective": {`  
    `"goal": "Invite empathy and awareness of how others, especially the child, might experience the situation.",`  
    `"mindset": "Perspective isn’t agreement; it’s understanding.",`  
    `"primary": [`  
      `"How do you think your co-parent might be feeling in this situation?",`  
      `"If your child could describe what’s happening between you both, what might they say?",`  
      `"What do you think your co-parent hopes will happen here?",`  
      `"When you step into the child’s shoes, what might they need most?",`  
      `"How might this look from a third side — someone neutral, like a teacher or friend?"`  
    `],`  
    `"reprompt": [`  
      `"What do you notice when you imagine it through your child’s eyes?",`  
      `"Even if you don’t agree, can you see what might be motivating your co-parent’s choices?"`  
    `],`  
    `"transition": "Advance when user acknowledges another perspective with curiosity, not defensiveness; move to 'options'."`  
  `},`

  `"options": {`  
    `"goal": "Generate multiple potential paths forward that serve both parents and the child.",`  
    `"mindset": "When we stay curious, possibilities multiply.",`  
    `"primary": [`  
      `"What are a few ways this could go differently next time?",`  
      `"What could help reduce tension in this situation?",`  
      `"What would ‘better’ look like for you and your co-parent?",`  
      `"If you could choose three realistic steps forward, what might they be?",`  
      `"What have you already tried that worked even a little?"`  
    `],`  
    `"reprompt": [`  
      `"Let’s aim for small, doable steps. What’s one thing you could try in the next week?",`  
      `"Which option feels most possible given where things are right now?"`  
    `],`  
    `"transition": "Advance when user identifies at least two actionable ideas and readiness ≥ 0.7; move to 'choose'."`  
  `},`

  `"choose": {`  
    `"goal": "Select one aligned, realistic action that reflects the user’s 'why.'",`  
    `"mindset": "Choice transforms clarity into change.",`  
    `"primary": [`  
      `"Which of these options feels most aligned with your why?",`  
      `"What step would make the biggest difference right now?",`  
      `"If you chose one thing to model for your child this week, what would it be?",`  
      `"Which choice helps you stay grounded and in integrity?",`  
      `"What does your best parenting self want to do here?"`  
    `],`  
    `"reprompt": [`  
      `"If this option feels too big, what’s a smaller version of the same idea?",`  
      `"What might help you follow through on this choice?"`  
    `],`  
    `"transition": "Advance when user identifies one specific, value-aligned action; move to 'message'."`  
  `},`

  `"message": {`  
    `"goal": "Transform insights into CLEAR communication that can be shared listener-ready.",`  
    `"mindset": "What’s clear is kind.",`  
    `"primary": [`  
      `"Would you like to practice how to say that to your co-parent?",`  
      `"How can you phrase that so it’s easy for them to hear?",`  
      `"What would this message sound like if it were concise and calm?",`  
      `"How might you open this message with appreciation or neutrality?",`  
      `"Let’s craft it in a way that centers your child’s stability."`  
    `],`  
    `"reprompt": [`  
      `"That’s close. Want to see if it passes the CLEAR test?",`  
      `"What might make this message easier for the other person to receive?"`  
    `],`  
    `"transition": "Advance when CLEAR score ≥ 0.8 and message aligns with mutual goals; end reflection session."`  
  `},`

  `"final": {`  
    `"goal": "Encourage self-reflection and accountability at session end.",`  
    `"mindset": "Reflection sustains alignment.",`  
    `"primary": [`  
      `"What did you learn about yourself through this reflection?",`  
      `"What shifted for you as you moved through these steps?",`  
      `"How might you carry this awareness into your next interaction?",`  
      `"What would alignment look like if both of you were at your best?"`  
    `],`  
    `"transition": "Close session with reflection summary and readiness reset."`  
  `}`  
`}`

---

### **✅ Implementation Tips**

* **Store this JSON in Supabase Storage** (e.g., `/prompts/prompt-library.json`) or in a local `/src/data` folder.

* **Fetch dynamically** based on the current `phase` and `readiness` level.

* Each Edge Function (`ai-reflect`, `ai-clear`, `ai-balance`) can pull the right phase block and insert its `primary` or `reprompt` list into the system message.

* You can also add a `"tone"` property later (e.g., `"calm"`, `"motivational"`) for style tuning or coach-specific personalization.
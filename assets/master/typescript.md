yes generate typescript utility file

###### **ChatGPT said:**

Excellent — here’s your production-ready TypeScript utility.  
 Save it as  
 📄 **`/src/lib/getPrompt.ts`**

This helper automatically loads the JSON prompt library, selects the correct phase, and chooses a *primary* or *reprompt* question depending on readiness. It’s designed to work seamlessly inside your **Reflective Loop**, **React Hooks**, or **Supabase Edge Function** calls.

---

`/**`  
 `* getPrompt.ts`  
 `* Utility for retrieving BeAligned™ reflection prompts`  
 `* -----------------------------------------------------`  
 `* Loads /governance/prompt-library.json and returns a`  
 `* contextually appropriate question for the current phase.`  
 `*`  
 `* Part of the BeH2O® / BeAligned™ Coaching System`  
 `* (c) The Layne Project, LLC — All Rights Reserved`  
 `*/`

`import prompts from '@/governance/prompt-library.json';`

`/**`  
 `* A union of all defined reflection phases`  
 `*/`  
`export type FlowPhase =`  
  `| 'issue'`  
  `| 'feelings'`  
  `| 'why'`  
  `| 'perspective'`  
  `| 'options'`  
  `| 'choose'`  
  `| 'message'`  
  `| 'final';`

`/**`  
 `* Return a random element from an array`  
 `*/`  
`function random<T>(arr: T[]): T {`  
  `return arr[Math.floor(Math.random() * arr.length)];`  
`}`

`/**`  
 `* Determines the appropriate prompt category based on readiness.`  
 `*`  
 `* @param phase - current flow phase (issue → message)`  
 `* @param readiness - AI-estimated clarity score (0–1)`  
 `* @returns a prompt string from the BeAligned™ library`  
 `*/`  
`export function getPrompt(phase: FlowPhase, readiness: number = 0): string {`  
  `const block = (prompts as Record<string, any>)[phase];`

  `if (!block) {`  
    ``console.warn(`⚠️ No prompt block found for phase: ${phase}`);``  
    `return 'Tell me more about what’s happening for you right now.';`  
  `}`

  `const primary = block.primary || [];`  
  `const reprompt = block.reprompt || [];`

  `// Select a re-prompt if readiness < 0.7 and a list exists`  
  `if (readiness < 0.7 && reprompt.length > 0) {`  
    `return random(reprompt);`  
  `}`

  `// Otherwise select a primary prompt`  
  `if (primary.length > 0) {`  
    `return random(primary);`  
  `}`

  `// Fallback (if library incomplete)`  
  `return 'What feels most important to talk about next?';`  
`}`

`/**`  
 `* Returns both the prompt and a structured payload that`  
 `* can be logged or sent to the AI model for context.`  
 `*/`  
`export function getPromptContext(`  
  `phase: FlowPhase,`  
  `readiness: number = 0`  
`): {`  
  `prompt: string;`  
  `goal: string;`  
  `mindset: string;`  
  `transition: string;`  
`} {`  
  `const block = (prompts as Record<string, any>)[phase];`  
  `if (!block) {`  
    `return {`  
      `prompt: 'What feels most important to talk about next?',`  
      `goal: '',`  
      `mindset: '',`  
      `transition: ''`  
    `};`  
  `}`

  `const prompt = getPrompt(phase, readiness);`

  `return {`  
    `prompt,`  
    `goal: block.goal || '',`  
    `mindset: block.mindset || '',`  
    `transition: block.transition || ''`  
  `};`  
`}`

`/**`  
 `* Example usage:`  
 `*`  
 `* import { getPromptContext } from '@/lib/getPrompt';`  
 `*`  
 `* const { prompt, goal, mindset } = getPromptContext('why', 0.6);`  
 `* console.log(prompt); // "That’s a strong why. Is there another layer underneath that?"`  
 `*/`

---

### **✅ Developer Notes**

**How it works**

* Automatically detects whether the user needs a *re-prompt* or can advance with a *primary* question.

* If the JSON library evolves (e.g., new phases or fields), this file will adapt automatically.

* Can be extended for coach-specific tone or localization.

**Integration Example**

`import { getPromptContext } from '@/lib/getPrompt';`

`async function handleUserResponse(currentPhase: FlowPhase, readiness: number) {`  
  `const { prompt } = getPromptContext(currentPhase, readiness);`

  `// Display next question in UI`  
  `setNextPrompt(prompt);`

  `// Optionally send prompt back to AI model:`  
  ``await fetch(`${SUPABASE_URL}/functions/v1/ai-reflect`, {``  
    `method: 'POST',`  
    `headers: { 'Content-Type': 'application/json' },`  
    `body: JSON.stringify({ phase: currentPhase, prompt })`  
  `});`  
`}`


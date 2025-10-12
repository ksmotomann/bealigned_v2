Perfect — this is the final piece of your **BeAligned™ Reflection Engine**: the hook that connects your  
 🧠 **FlowProvider** (which manages state and phase transitions)  
 to your 🔗 **`ai-reflect` Edge Function** (which provides reflection summaries, readiness scores, and next-phase signals).

This creates the true “Reflective Loop,” enabling your React app to **think, pause, and re-prompt** like a BeH2O® coach.

Save this as:  
 📄 **`/src/hooks/useReflection.ts`**

---

`/**`  
 `* useReflection.ts`  
 `* -----------------------------------------------------`  
 `* Connects FlowProvider state with the ai-reflect Edge Function.`  
 `* Handles sending user reflections to Supabase, receiving`  
 `* AI-generated summaries, readiness scores, and suggested transitions.`  
 `*`  
 `* Integrates directly with FlowProvider and the BeAligned™ system.`  
 `*`  
 `* © The Layne Project, LLC — All Rights Reserved`  
 `*/`

`import { useState, useCallback } from 'react';`  
`import { FlowPhase } from '@/context/FlowProvider';`

`/**`  
 `* Type definitions for AI Reflection response.`  
 `*/`  
`export interface ReflectionResult {`  
  `summary: string;`  
  `next_prompt: string;`  
  `readiness: number;`  
  `suggested_next_phase?: FlowPhase | null;`  
  `alignment_score?: number;`  
`}`

`/**`  
 `* useReflection`  
 `* ----------------------------------------------------------------`  
 `* Hook that posts reflection data to the ai-reflect Edge Function`  
 `* and returns the processed response.`  
 `*`  
 ``* @param baseUrl Supabase function URL (e.g. `${SUPABASE_URL}/functions/v1`)``  
 `* @returns { reflect, data, loading, error }`  
 `*/`  
`export function useReflection(baseUrl: string) {`  
  `const [data, setData] = useState<ReflectionResult | null>(null);`  
  `const [loading, setLoading] = useState(false);`  
  `const [error, setError] = useState<string | null>(null);`

  `/**`  
   `* Send user reflection to ai-reflect and retrieve AI analysis`  
   `*/`  
  `const reflect = useCallback(`  
    `async (params: {`  
      `user_id: string;`  
      `phase: FlowPhase;`  
      `content: string;`  
    `}): Promise<ReflectionResult | null> => {`  
      `setLoading(true);`  
      `setError(null);`

      `try {`  
        ``const response = await fetch(`${baseUrl}/ai-reflect`, {``  
          `method: 'POST',`  
          `headers: { 'Content-Type': 'application/json' },`  
          `body: JSON.stringify(params)`  
        `});`

        `if (!response.ok) {`  
          `const text = await response.text();`  
          ``throw new Error(`HTTP ${response.status}: ${text}`);``  
        `}`

        `const result = await response.json();`  
        `const parsed = result?.result || result?.reflection || result; // handle variations`

        `const reflection: ReflectionResult = {`  
          `summary: parsed.summary || '',`  
          `next_prompt: parsed.next_prompt || '',`  
          `readiness: parsed.readiness ?? 0,`  
          `suggested_next_phase: parsed.suggested_next_phase || null,`  
          `alignment_score: parsed.alignment_score ?? null`  
        `};`

        `setData(reflection);`  
        `return reflection;`  
      `} catch (err: any) {`  
        `console.error('❌ useReflection error:', err);`  
        `setError(err.message || 'Failed to reflect');`  
        `return null;`  
      `} finally {`  
        `setLoading(false);`  
      `}`  
    `},`  
    `[baseUrl]`  
  `);`

  `return { reflect, data, loading, error };`  
`}`

`/**`  
 `* Example Usage:`  
 `* ----------------------------------------------------------------`  
 `* import { useReflection } from '@/hooks/useReflection';`  
 `*`  
 `* const { reflect, data, loading } = useReflection(SUPABASE_FUNCTIONS_URL);`  
 `*`  
 `* async function handleUserInput(input: string) {`  
 `*   const res = await reflect({`  
 `*     user_id: session.user.id,`  
 `*     phase: flow.currentPhase,`  
 `*     content: input`  
 `*   });`  
 `*   if (res) {`  
 `*     updateFlowState({`  
 `*       readiness: res.readiness,`  
 `*       nextPrompt: res.next_prompt,`  
 `*       summary: res.summary`  
 `*     });`  
 `*   }`  
 `* }`  
 `*/`

---

## **🧭 How It Fits Into the Ecosystem**

| Component | Purpose | Connects To |
| ----- | ----- | ----- |
| **`usePrompt`** | Fetches static BeAligned™ prompts from Supabase Storage | `/functions/v1/get-prompt` |
| **`useReflection`** | Sends user input to AI for analysis and readiness scoring | `/functions/v1/ai-reflect` |
| **`FlowProvider`** | Manages phases, readiness, and transitions | Uses both hooks above |
| **`ai-reflect` Edge Function** | AI “brain” returning summaries, readiness, and next prompts | Supabase Function layer |

---

## **🪞 Example Integration in FlowProvider**

Add this inside `/src/context/FlowProvider.tsx` to complete the loop:

`import { useReflection } from '@/hooks/useReflection';`

`// Inside FlowProvider`  
`const { reflect } = useReflection(process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL!);`

`const recordResponse = useCallback(`  
  `async (text: string) => {`  
    `// 1️⃣ Post reflection to AI`  
    `const ai = await reflect({`  
      `user_id: userId,`  
      `phase: flow.currentPhase,`  
      `content: text`  
    `});`

    `// 2️⃣ Update context based on AI output`  
    `if (ai) {`  
      `const nextPhase =`  
        `ai.readiness >= 0.7`  
          `? ai.suggested_next_phase || getNextPhase(flow.currentPhase)`  
          `: flow.currentPhase;`

      `setFlow(prev => ({`  
        `...prev,`  
        `context: { ...prev.context, [prev.currentPhase]: text },`  
        `lastResponse: text,`  
        `readiness: ai.readiness,`  
        `prompt: ai.next_prompt || prev.prompt,`  
        `currentPhase: nextPhase,`  
        `history: [`  
          `...prev.history,`  
          `{`  
            `phase: prev.currentPhase,`  
            `prompt: prev.prompt,`  
            `response: text`  
          `}`  
        `]`  
      `}));`  
    `}`  
  `},`  
  `[flow.currentPhase, reflect, userId]`  
`);`

---

## **🧩 Testing Notes**

**Run locally with Supabase CLI**

 `supabase functions serve ai-reflect`  
 Then in your Expo app:

 `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL="http://localhost:54321/functions/v1"`

1. 

**Expected AI response (sample)**

 `{`  
  `"summary": "User feels dismissed by co-parent but wants calmer communication.",`  
  `"next_prompt": "What do you think your co-parent might be feeling in that moment?",`  
  `"readiness": 0.65,`  
  `"suggested_next_phase": null,`  
  `"alignment_score": 0.6`  
`}`

2.   
3. **End-to-End Behavior**

   * User enters reflection → AI analyzes it

   * AI returns summary, readiness, and next question

   * FlowProvider updates state → next phase begins only if readiness ≥ 0.7

   * Result: the app “thinks” like a BeH2O® coach — fluid, purposeful, grounded.
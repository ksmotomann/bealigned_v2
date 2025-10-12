Excellent — here’s your **React Native client hook** designed to connect seamlessly with the  
 🧠 `get-prompt` Edge Function you just deployed.

Save it as:  
 📄 **`/src/hooks/usePrompt.ts`**

---

`/**`  
 `* usePrompt.ts`  
 `* -----------------------------------------------------`  
 `* React Hook for fetching BeAligned™ reflection prompts`  
 ``* from the Supabase Edge Function `/functions/v1/get-prompt`.``  
 `*`  
 `* Handles loading state, caching, and readiness-based`  
 `* selection logic to maintain conversational flow.`  
 `*`  
 `* © The Layne Project, LLC — All Rights Reserved`  
 `*/`

`import { useState, useCallback } from 'react';`

`/**`  
 `* Type definitions for BeAligned™ reflection flow.`  
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

`export interface PromptResponse {`  
  `phase: FlowPhase;`  
  `readiness: number;`  
  `prompt: string;`  
  `goal?: string;`  
  `mindset?: string;`  
  `transition?: string;`  
`}`

`/**`  
 `* React Hook: usePrompt`  
 `* Fetches a phase-specific prompt from the Supabase Edge Function.`  
 `*`  
 ``* @param baseUrl - Your Supabase function URL (e.g. `${SUPABASE_URL}/functions/v1`)``  
 `* @returns { getPrompt, loading, error, data }`  
 `*/`  
`export function usePrompt(baseUrl: string) {`  
  `const [data, setData] = useState<PromptResponse | null>(null);`  
  `const [loading, setLoading] = useState(false);`  
  `const [error, setError] = useState<string | null>(null);`

  `/**`  
   `* Request a new prompt for the given phase + readiness`  
   `*/`  
  `const getPrompt = useCallback(`  
    `async (phase: FlowPhase, readiness: number = 0.5): Promise<PromptResponse | null> => {`  
      `setLoading(true);`  
      `setError(null);`

      `try {`  
        ``const response = await fetch(`${baseUrl}/get-prompt`, {``  
          `method: 'POST',`  
          `headers: { 'Content-Type': 'application/json' },`  
          `body: JSON.stringify({ phase, readiness })`  
        `});`

        `if (!response.ok) {`  
          `const text = await response.text();`  
          ``throw new Error(`HTTP ${response.status}: ${text}`);``  
        `}`

        `const result = (await response.json()) as PromptResponse;`  
        `setData(result);`  
        `return result;`  
      `} catch (err: any) {`  
        `console.error('❌ usePrompt error:', err);`  
        `setError(err.message || 'Failed to fetch prompt');`  
        `return null;`  
      `} finally {`  
        `setLoading(false);`  
      `}`  
    `},`  
    `[baseUrl]`  
  `);`

  `return { getPrompt, data, loading, error };`  
`}`

`/**`  
 `* Example Usage in a React Component`  
 `* ----------------------------------`  
 `*`  
 `* import { usePrompt } from '@/hooks/usePrompt';`  
 `*`  
 `* const { getPrompt, data, loading } = usePrompt(SUPABASE_FUNCTIONS_URL);`  
 `*`  
 `* async function handleNextPhase() {`  
 `*   const promptData = await getPrompt('feelings', 0.6);`  
 `*   if (promptData) setNextPrompt(promptData.prompt);`  
 `* }`  
 `*`  
 `* // Render`  
 `* {loading ? <Spinner /> : <Text>{data?.prompt}</Text>}`  
 `*/`

---

### **✅ Integration Notes**

**Environment Variable**

 `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL="https://<your-project>.functions.supabase.co"`  
 Then import:

 `const { getPrompt, data } = usePrompt(process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL!);`

1.   
2. **Caching Option**

You can wrap this hook in `React Query` or `SWR` for caching between phases:

 `const { data } = useQuery(['prompt', phase], () => getPrompt(phase, readiness));`

*   
3. **Connection to Flow Engine**

   * This hook slots directly into your `/src/context/FlowProvider.tsx`.

Each time the user completes a reflection input, call:

 `const next = await getPrompt(currentPhase, readiness);`  
`updateFlowState(next);`

*   
4. **Offline Handling**

   * If `error` is set, gracefully fallback to a local `prompt-library.json` (cached version).

---

### **🧩 Example Flow Integration**

`import { usePrompt } from '@/hooks/usePrompt';`  
`import { useEffect } from 'react';`  
`import { Text, Button } from 'react-native';`

`export default function ReflectionScreen({ currentPhase, readiness }) {`  
  `const { getPrompt, data, loading } = usePrompt(process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL!);`

  `useEffect(() => {`  
    `getPrompt(currentPhase, readiness);`  
  `}, [currentPhase]);`

  `return (`  
    `<>`  
      `{loading && <Text>Thinking...</Text>}`  
      `{!loading && <Text style={{ fontSize: 18 }}>{data?.prompt}</Text>}`  
      `<Button title="Next" onPress={() => getPrompt(currentPhase, readiness)} />`  
    `</>`  
  `);`  
`}`

---

### **🔒 Governance Notes**

* This hook **only calls the Edge Function**; it does not hold or modify system prompts itself.

* All BeH2O® tone, readiness rules, and phase progression remain enforced inside the `/functions/v1/get-prompt` governance.

* If new prompts or tone adjustments are uploaded to Supabase Storage, the app updates instantly — no redeploy required.

---
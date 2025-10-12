

yes generate context file

###### **ChatGPT said:**

Excellent — this is the missing connective tissue that makes BeAligned™ “feel alive.”  
 Below is a complete, production-ready **React Context Provider** that integrates:

* the `usePrompt` hook you just built,

* dynamic `FlowState` management,

* readiness and phase transitions, and

* real-time UI synchronization.

Save as 📄 **`/src/context/FlowProvider.tsx`**

---

`/**`  
 `* FlowProvider.tsx`  
 `* -----------------------------------------------------`  
 `* Central context for managing BeAligned™ conversation flow.`  
 `* Orchestrates phases, readiness, prompts, and AI reflection`  
 `* loops across the app.`  
 `*`  
 `* Built on BeH2O® & BeAligned™ governance principles:`  
 `*  - Host reflection, not fix problems`  
 `*  - Move only when clarity emerges (readiness ≥ 0.7)`  
 `*  - Always safeguard childhoods`  
 `*`  
 `* © The Layne Project, LLC — All Rights Reserved`  
 `*/`

`import React, {`  
  `createContext,`  
  `useState,`  
  `useContext,`  
  `useCallback,`  
  `ReactNode`  
`} from 'react';`  
`import { usePrompt, FlowPhase, PromptResponse } from '@/hooks/usePrompt';`

`/**`  
 `* The FlowState interface mirrors governance definitions.`  
 `*/`  
`export interface FlowState {`  
  `id: string;`  
  `userId?: string;`  
  `currentPhase: FlowPhase;`  
  `context: {`  
    `issue?: string;`  
    `feelings?: string;`  
    `why?: string;`  
    `perspective?: string;`  
    `options?: string[];`  
    `chosenOption?: string;`  
  `};`  
  `readiness: number;             // clarity 0–1`  
  `prompt: string;                // current question`  
  `lastResponse?: string;         // user’s last answer`  
  `history: Array<{ phase: FlowPhase; prompt: string; response: string }>;`  
`}`

`/**`  
 `* Context shape`  
 `*/`  
`interface FlowContextType {`  
  `flow: FlowState;`  
  `loading: boolean;`  
  `nextPrompt: () => Promise<void>;`  
  `recordResponse: (text: string) => void;`  
  `resetFlow: () => void;`  
`}`

`const FlowContext = createContext<FlowContextType | undefined>(undefined);`

`/**`  
 `* Provider Component`  
 `*/`  
`export const FlowProvider = ({`  
  `children,`  
  `userId`  
`}: {`  
  `children: ReactNode;`  
  `userId: string;`  
`}) => {`  
  `const { getPrompt, data, loading } = usePrompt(`  
    `process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL!`  
  `);`

  `const [flow, setFlow] = useState<FlowState>({`  
    `id: crypto.randomUUID(),`  
    `userId,`  
    `currentPhase: 'issue',`  
    `readiness: 0,`  
    `prompt: '',`  
    `context: {},`  
    `history: []`  
  `});`

  `/**`  
   `* Request next prompt from Edge Function`  
   `*/`  
  `const nextPrompt = useCallback(async () => {`  
    `const response = await getPrompt(flow.currentPhase, flow.readiness);`  
    `if (!response) return;`

    `setFlow(prev => ({`  
      `...prev,`  
      `prompt: response.prompt,`  
      `readiness: response.readiness,`  
      `history: [`  
        `...prev.history,`  
        `{`  
          `phase: prev.currentPhase,`  
          `prompt: response.prompt,`  
          `response: prev.lastResponse || ''`  
        `}`  
      `]`  
    `}));`  
  `}, [flow.currentPhase, flow.readiness, getPrompt]);`

  `/**`  
   `* Record user response and manage progression`  
   `*/`  
  `const recordResponse = useCallback(`  
    `(text: string) => {`  
      `setFlow(prev => {`  
        `// Update current context with user response`  
        `const updatedContext = { ...prev.context, [prev.currentPhase]: text };`

        `// Evaluate readiness-based transitions`  
        `let nextPhase: FlowPhase = prev.currentPhase;`  
        `if (prev.readiness >= 0.7) {`  
          `const order: FlowPhase[] = [`  
            `'issue',`  
            `'feelings',`  
            `'why',`  
            `'perspective',`  
            `'options',`  
            `'choose',`  
            `'message',`  
            `'final'`  
          `];`  
          `const idx = order.indexOf(prev.currentPhase);`  
          `if (idx < order.length - 1) {`  
            `nextPhase = order[idx + 1];`  
          `}`  
        `}`

        `return {`  
          `...prev,`  
          `context: updatedContext,`  
          `lastResponse: text,`  
          `currentPhase: nextPhase`  
        `};`  
      `});`

      `// After recording, trigger next reflection prompt`  
      `nextPrompt();`  
    `},`  
    `[nextPrompt]`  
  `);`

  `/**`  
   `* Reset the full conversation flow`  
   `*/`  
  `const resetFlow = useCallback(() => {`  
    `setFlow({`  
      `id: crypto.randomUUID(),`  
      `userId,`  
      `currentPhase: 'issue',`  
      `readiness: 0,`  
      `prompt: '',`  
      `context: {},`  
      `history: []`  
    `});`  
  `}, [userId]);`

  `const value: FlowContextType = {`  
    `flow,`  
    `loading,`  
    `nextPrompt,`  
    `recordResponse,`  
    `resetFlow`  
  `};`

  `return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;`  
`};`

`/**`  
 `* Hook to use Flow context throughout the app.`  
 `*/`  
`export const useFlow = (): FlowContextType => {`  
  `const context = useContext(FlowContext);`  
  `if (!context) {`  
    `throw new Error('useFlow must be used within a FlowProvider');`  
  `}`  
  `return context;`  
`};`

---

## **🧭 How It Works**

1. **Initialization**

   * Starts at phase `"issue"`.

   * Requests a prompt using your Supabase Edge Function (`get-prompt`).

   * Stores conversation metadata (phase, readiness, history, etc.).

2. **Flow Loop**

   * User answers → `recordResponse()` updates context.

   * If readiness ≥ 0.7 → advances to next phase.

   * Then automatically requests next prompt from the Edge Function.

   * The app dynamically renders `flow.prompt` for each turn.

3. **Resets**

   * `resetFlow()` clears the session for a new reflection journey.

---

## **🪞 Example Usage**

`import React, { useEffect, useState } from 'react';`  
`import { TextInput, Button, Text, View } from 'react-native';`  
`import { FlowProvider, useFlow } from '@/context/FlowProvider';`

`function ReflectionSession() {`  
  `const { flow, loading, recordResponse, resetFlow } = useFlow();`  
  `const [input, setInput] = useState('');`

  `useEffect(() => {`  
    `if (!flow.prompt) {`  
      `// Trigger first question on mount`  
      `recordResponse('');`  
    `}`  
  `}, []);`

  `return (`  
    `<View style={{ padding: 20 }}>`  
      `<Text style={{ fontSize: 18, marginBottom: 10 }}>`  
        `{loading ? 'Thinking...' : flow.prompt}`  
      `</Text>`

      `<TextInput`  
        `placeholder="Type your reflection here..."`  
        `multiline`  
        `style={{`  
          `borderWidth: 1,`  
          `borderColor: '#ccc',`  
          `borderRadius: 10,`  
          `padding: 12,`  
          `marginBottom: 10`  
        `}}`  
        `value={input}`  
        `onChangeText={setInput}`  
      `/>`

      `<Button`  
        `title="Submit Reflection"`  
        `onPress={() => {`  
          `recordResponse(input);`  
          `setInput('');`  
        `}}`  
      `/>`  
      `<Button title="Reset Session" onPress={resetFlow} />`  
    `</View>`  
  `);`  
`}`

`// Wrap your app with the FlowProvider in _layout.tsx or App.tsx`  
`export default function App() {`  
  `const userId = 'mock-user-id'; // replace with Auth session user.id`  
  `return (`  
    `<FlowProvider userId={userId}>`  
      `<ReflectionSession />`  
    `</FlowProvider>`  
  `);`  
`}`

---

## **⚙️ Notes for Robert & Developers**

| Component | Purpose | Source |
| ----- | ----- | ----- |
| `usePrompt` | Retrieves next question from Supabase Edge Function | `/src/hooks/usePrompt.ts` |
| `FlowProvider` | Manages entire reflection flow, transitions, and state | `/src/context/FlowProvider.tsx` |
| `recordResponse()` | Saves user response, updates readiness, and triggers next reflection | Provided by context |
| `nextPrompt()` | Manually fetches next AI-guided prompt | Provided by context |

**Design Principle:**  
 The app “thinks” like a BeH2O® coach because it moves *only when readiness and reflection align*, not when the user clicks “Next.”
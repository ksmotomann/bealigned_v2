yes generate edge function

###### **ChatGPT said:**

Perfect — here’s a **Supabase Edge Function** version that dynamically retrieves the BeAligned™ prompt library from **Supabase Storage**, selects the correct phase and prompt (primary or reprompt), and returns it as JSON for your React app or Edge Functions to use.

Save this as:  
 📄 **`/supabase/functions/get-prompt/index.ts`**

---

`/**`  
 `* get-prompt Edge Function`  
 `* -----------------------------------------------------`  
 `* Dynamically retrieves the BeAligned™ prompt library from`  
 `* Supabase Storage, selects the correct reflection prompt,`  
 `* and returns it to the client.`  
 `*`  
 `* This function allows prompts to be updated without`  
 `* redeploying the app — keeping all AI interactions aligned`  
 `* with the BeH2O® voice and BeAligned™ governance.`  
 `*`  
 `* © The Layne Project, LLC — All Rights Reserved`  
 `*/`

`import { Hono } from 'https://esm.sh/hono@3';`  
`import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';`

`const app = new Hono();`

`interface PromptRequest {`  
  `phase: string;`  
  `readiness?: number; // 0–1`  
  `bucket?: string;    // optional custom bucket name`  
  `path?: string;      // optional file path`  
`}`

`function random<T>(arr: T[]): T {`  
  `return arr[Math.floor(Math.random() * arr.length)];`  
`}`

`app.post('/', async (c) => {`  
  `const supabase = createClient(`  
    `Deno.env.get('SUPABASE_URL')!,`  
    `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!`  
  `);`

  `const { phase, readiness = 0.5, bucket = 'governance', path = 'prompt-library.json' } =`  
    `(await c.req.json()) as PromptRequest;`

  `try {`  
    `// 1️⃣ Fetch prompt library file from Supabase Storage`  
    `const { data, error } = await supabase.storage.from(bucket).download(path);`  
    `if (error || !data) {`  
      `console.error(error);`  
      `return c.json({ error: 'Unable to load prompt library from storage.' }, 500);`  
    `}`

    `const text = await data.text();`  
    `const library = JSON.parse(text);`  
    `const block = library[phase];`

    `if (!block) {`  
      `return c.json({`  
        `prompt: 'What feels most important to talk about next?',`  
        `phase,`  
        `note: 'No prompt block found for this phase.'`  
      `});`  
    `}`

    `const primary = block.primary || [];`  
    `const reprompt = block.reprompt || [];`

    `// 2️⃣ Choose primary or re-prompt`  
    `let chosenPrompt: string;`  
    `if (readiness < 0.7 && reprompt.length > 0) {`  
      `chosenPrompt = random(reprompt);`  
    `} else if (primary.length > 0) {`  
      `chosenPrompt = random(primary);`  
    `} else {`  
      `chosenPrompt = 'What feels most important to talk about next?';`  
    `}`

    `// 3️⃣ Construct payload with context metadata`  
    `const response = {`  
      `phase,`  
      `readiness,`  
      `prompt: chosenPrompt,`  
      `goal: block.goal || '',`  
      `mindset: block.mindset || '',`  
      `transition: block.transition || ''`  
    `};`

    `return c.json(response);`  
  `} catch (err) {`  
    `console.error('Error retrieving prompt:', err);`  
    `return c.json({ error: 'Internal server error', details: String(err) }, 500);`  
  `}`  
`});`

`export default app;`

---

## **🪜 Deployment Instructions**

**Add prompt file to Supabase Storage**  
 Upload your JSON prompt library (`prompt-library.json`) to the bucket `governance`:

 `supabase storage create-bucket governance --public=false`  
`supabase storage upload governance/prompt-library.json ./governance/prompt-library.json`

1. 

**Deploy Edge Function**

 `supabase functions deploy get-prompt`  
`supabase functions list`

2. 

**Example Client Call (React Native or Edge Function)**

 ``const res = await fetch(`${SUPABASE_URL}/functions/v1/get-prompt`, {``  
  `method: 'POST',`  
  `headers: { 'Content-Type': 'application/json' },`  
  `body: JSON.stringify({`  
    `phase: 'feelings',`  
    `readiness: 0.5`  
  `})`  
`});`

`const data = await res.json();`  
`console.log('Next prompt:', data.prompt);`

3. 

---

## **🔐 Security & Governance**

* Store prompt file in a **non-public bucket** (`governance`) for integrity.

* Use only the **service role key** in Edge Functions (never in client).

* This ensures the **coaching voice** stays centrally governed and cannot be tampered with at runtime.

* If you later version prompts (e.g., `/v2/prompt-library.json`), the same function will automatically pick up the new version once replaced.

---

## **✅ Example Response**

`{`  
  `"phase": "why",`  
  `"readiness": 0.65,`  
  `"prompt": "That’s a strong why. Is there another layer underneath that?",`  
  `"goal": "Connect emotion and experience to underlying purpose, value, or need.",`  
  `"mindset": "The 'because' reveals the 'why.'",`  
  `"transition": "Advance when user articulates a purpose or value beyond emotion and readiness ≥ 0.75; move to 'perspective'."`  
`}`
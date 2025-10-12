

Here’s your **developer-ready README** — a single, cohesive file that documents the full BeAligned™ Beta Lite system: its purpose, architecture, governance, and build flow.  
 Save as 📄 **`README.md`** in the root of your project.

---

# **🌊 BeAligned™ Beta Lite**

*AI-guided reflection system built on the BeH2O® Framework — transforming conflict into alignment.*

---

## **🧭 Overview**

**BeAligned™ Beta Lite** helps parents and professionals pause, reflect, and realign before communicating.  
 It reproduces the voice and logic of a **BeH2O® coach** — grounded, neutral, child-centered — inside a structured React Native \+ Supabase application.

**Core Principle:**

*Host reflection, don’t fix problems.*

The system adapts dynamically to a user’s emotional readiness, moving only when clarity and calm have emerged.

---

## **⚙️ Tech Stack**

| Layer | Technology | Purpose |
| ----- | ----- | ----- |
| **Frontend** | Expo \+ React Native \+ Expo Router | Mobile cross-platform interface |
| **State Mgmt** | React Context \+ Hooks (`FlowProvider`) | Tracks phase, readiness, and conversation flow |
| **Backend DB** | Supabase (PostgreSQL \+ RLS) | Stores reflections, feedback, alignment metrics |
| **Edge Functions** | Supabase Functions (Deno \+ TypeScript) | Hosts Claude/Anthropic logic and governance |
| **AI Model** | Anthropic Claude 3.5 Sonnet | Generates reflections and prompts |
| **Storage** | Supabase Storage | Holds JSON prompt libraries and assets |

---

## **🧩 Core Concepts**

### **BeH2O® Principles**

* **Strength** like Beryllium → stable, principled

* **Flow** like Water → adaptive, responsive

* **Safeguard Childhoods** → apply a child-impact lens

### **Coaching Laws of BeAligned™**

1. Start from Why

2. Hold the Third Side

3. Clarity before Conclusion

4. Listener-Readiness Check (CLEAR framework)

5. Accountability without Judgment

---

## **🧠 System Architecture**

`User Input`  
   `↓`  
`FlowProvider (context)`  
   `↓`  
`useReflection → ai-reflect Edge Function`  
   `↓`  
`Claude API → analyzes + scores readiness`  
   `↓`  
`FlowProvider updates state (phase + prompt)`  
   `↓`  
`usePrompt → get-prompt Edge Function`  
   `↓`  
`Displays next reflection question`

### **Phase Flow**

`issue → feelings → why → perspective → options → choose → message → final`

Each phase has its own **goal**, **mindset**, **prompt set**, and **readiness rules**.

---

## **📁 Directory Structure**

`/src`  
 `├─ /context`  
 `│   └─ FlowProvider.tsx`  
 `├─ /hooks`  
 `│   ├─ usePrompt.ts`  
 `│   ├─ useReflection.ts`  
 `│   └─ useFlowState.ts (optional)`  
 `├─ /lib`  
 `│   └─ getPrompt.ts`  
 `└─ /governance`  
     `├─ flow-engine.md`  
     `├─ prompt-library.md`  
     `└─ prompt-library.json`  
`/supabase`  
 `├─ /functions`  
 `│   ├─ ai-reflect/`  
 `│   ├─ ai-clear/`  
 `│   ├─ ai-balance/`  
 `│   └─ get-prompt/`  
 `└─ /migrations`  
     `└─ 20251011_bealigned_init.sql`

---

## **🧩 Core Files & Purpose**

| File | Description |
| ----- | ----- |
| **`flow-engine.md`** | Defines governance, ethos, readiness logic, and coaching mindset |
| **`prompt-library.json`** | JSON version of prompts (stored in Supabase Storage) |
| **`getPrompt.ts`** | Local utility to retrieve appropriate phase prompt |
| **`usePrompt.ts`** | Hook calling the `get-prompt` Edge Function |
| **`useReflection.ts`** | Hook posting reflections to `ai-reflect` and receiving readiness feedback |
| **`FlowProvider.tsx`** | Central state manager orchestrating reflection phases and AI integration |
| **Edge Functions** | Claude-powered “brains” performing reflection analysis, CLEAR scoring, and boundary coaching |

---

## **🚀 Setup & Deployment**

### **1️⃣ Clone and Install**

`git clone https://github.com/<your-org>/bealigned-lite.git`  
`cd bealigned-lite`  
`npm install`

### **2️⃣ Environment Variables**

Create `.env` or use Expo config:

`EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co`  
`EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`  
`EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=https://<project>.functions.supabase.co`  
`ANTHROPIC_API_KEY=<anthropic-key>`

### **3️⃣ Database & Storage**

`supabase db push`  
`supabase storage create-bucket governance --public=false`  
`supabase storage upload governance/prompt-library.json ./governance/prompt-library.json`

### **4️⃣ Deploy Edge Functions**

`supabase functions deploy ai-reflect`  
`supabase functions deploy ai-clear`  
`supabase functions deploy ai-balance`  
`supabase functions deploy get-prompt`

### **5️⃣ Run App**

`npx expo start`

---

## **🪞 Developer Flow Example**

`import { useFlow } from '@/context/FlowProvider';`

`function ReflectionScreen() {`  
  `const { flow, recordResponse, loading } = useFlow();`  
  `const [input, setInput] = useState('');`

  `return (`  
    `<View>`  
      `<Text>{loading ? 'Thinking...' : flow.prompt}</Text>`  
      `<TextInput`  
        `placeholder="Type your reflection..."`  
        `value={input}`  
        `onChangeText={setInput}`  
      `/>`  
      `<Button`  
        `title="Submit"`  
        `onPress={() => {`  
          `recordResponse(input);`  
          `setInput('');`  
        `}}`  
      `/>`  
    `</View>`  
  `);`  
`}`

**Under the hood:**

1. User enters a reflection → `useReflection` sends it to `ai-reflect`.

2. Claude returns summary \+ readiness \+ next prompt.

3. `FlowProvider` updates phase and renders new question via `usePrompt`.

4. Conversation flows until alignment is achieved.

---

## **🔐 Governance & Ethical Safeguards**

* Trauma-informed, non-therapeutic tone

* No diagnostic or prescriptive outputs

* Strict data privacy via Supabase RLS

* Alignment over Neutrality → the system “hosts,” not “fixes”

* Every session ends with a self-reflection, not a directive

---

## **📊 Future Extensions**

| Feature | Description |
| ----- | ----- |
| **`ai-insights` Function** | Aggregate alignment metrics for coach dashboards |
| **Realtime Reflection Feed** | Live updates across devices |
| **Institutional Dashboards** | Aggregate child-impact and alignment analytics |
| **Multilingual Prompts** | International expansion of BeH2O® programs |

---

## **🧭 Design Philosophy**

**Strong like beryllium. Fluid like water. Always safeguard childhoods.**

Every interaction—whether human or AI—should embody:

* **Calm curiosity** instead of control

* **Purposeful progress** over perfection

* **Reflection before reaction**

---

## **🧱 Contributors**

* **Trina Nudson** – Founder & Visionary ( The Layne Project ® )

* **Robert Mann** – Developer & System Architect

* **BeH2O® Certified Coaches** – Voice & Content Auditing

---

## **🩵 License & Attribution**

BeH2O® and BeAligned™ are registered intellectual property of **The Layne Project, LLC**.  
 Code and configuration may be reused under private license with attribution:  
 **“Powered by BeAligned™, built on BeH2O® principles.”**

---

### **✅ End State**

By combining **React Native’s fluid UX**, **Supabase’s secure infrastructure**, and **BeH2O®’s human ethos**,  
 BeAligned™ Beta Lite delivers an AI-guided reflective experience that truly *thinks like a coach.*

**Be Strong. Be Grounded. Be Aligned™.**

---

Would you like me to now generate a **visual system diagram (Mermaid \+ Markdown)** you can embed at the top of this README to show funders or developers how the entire BeAligned™ pipeline flows end-to-end?

ChatGPT can make mistakes. Check important info.
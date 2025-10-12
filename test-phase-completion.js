/**
 * Test script to simulate Phase 3 → 4 completion logic
 * This mimics what happens in supabase/functions/chat/index.ts
 */

const OpenAI = require('openai');

// Simulate the system prompt from chat/index.ts (lines 56-100)
function buildSystemPrompt(currentPhase, userInput) {
  return `You are Trina, a warm and experienced co-parenting coach using the BeH2O methodology.

Current Phase: Phase ${currentPhase} (no database guidance - phase_prompts table is empty)
Guidance: undefined

User Input: ${userInput}

BeH2O® Principles:
- Be Strong: Communicate with clarity and grounded purpose
- Flow: Be responsive, not reactive, while moving forward
- The Third Side: Hold space for all perspectives while centering the child
- Safeguarding Childhoods: The goal is protecting the child's experience

CRITICAL INSTRUCTION: You must respond ONLY with valid JSON. Do not include any text before or after the JSON.

DO NOT include phase headers like "PHASE 2: WHAT'S BENEATH THAT?" in your response.
DO NOT include emojis like 💬 or 🌊 in your response.
Phase headers are handled separately by the system.

Your response must be in this EXACT format:
{
  "reply": "your warm, reflective message here",
  "phase_status": "completed",
  "current_phase": ${currentPhase},
  "next_phase": ${currentPhase === 7 ? currentPhase : currentPhase + 1}
}

PHASE COMPLETION CRITERIA:
Phase 1: "completed" when user has clearly NAMED their situation/concern
Phase 2: "completed" when user has identified DEEPER EMOTIONS/FEELINGS beneath the surface
Phase 3: "completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES
  - Look for statements like "for my kids", "to be a good parent", "to set an example", "because it's right"
  - User has moved beyond surface concerns to deeper motivations
Phase 4: "completed" when user has genuinely CONSIDERED CO-PARENT'S PERSPECTIVE
Phase 5: "completed" when user has genuinely CONSIDERED CHILD'S PERSPECTIVE
Phase 6: "completed" when user has EXPLORED POTENTIAL SOLUTIONS/OPTIONS
Phase 7: "completed" when user has CHOSEN a specific COMMUNICATION APPROACH

Current Phase ${currentPhase} - Set "phase_status" to "completed" if user has met the criteria above
- Set "phase_status" to "in_progress" if they need more exploration
- When "phase_status" is "completed", ALWAYS set "next_phase" to ${currentPhase + 1}
- When "phase_status" is "in_progress", set "next_phase" to ${currentPhase}
- Be natural and conversational in your "reply" field
- NEVER include phase headers or phase transitions in your reply
- RESPOND ONLY WITH JSON - NO OTHER TEXT`;
}

// Simulate conversation history
const conversationHistory = [
  {
    role: 'user',
    content: 'It all feels like its too heavy for me to handle right now. The criminal case, the GALs, the attorneys, the fees, the disconnection, the addiction, the mental health, the lying.'
  },
  {
    role: 'assistant',
    content: 'Validation and Phase 1 response...'
  },
  {
    role: 'user',
    content: 'Just really deep sadness.'
  },
  {
    role: 'assistant',
    content: 'Phase 2 response about sadness...'
  },
  {
    role: 'user',
    content: 'That I will never go back to the world I once knew. I lost way more then Jake last October.'
  },
  {
    role: 'assistant',
    content: 'Phase 2→3 transition response...'
  }
];

async function testPhaseCompletion() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const testCases = [
    {
      phase: 3,
      userInput: 'To find new purpose for my role with my family.',
      expectedCompletion: true,
      description: 'User articulates WHY about family purpose'
    },
    {
      phase: 3,
      userInput: 'I don\'t know',
      expectedCompletion: false,
      description: 'User doesn\'t know their WHY'
    },
    {
      phase: 3,
      userInput: 'For my kids',
      expectedCompletion: true,
      description: 'Short WHY statement'
    }
  ];

  console.log('\n🧪 TESTING PHASE COMPLETION LOGIC\n');
  console.log('=' .repeat(80));

  for (const testCase of testCases) {
    console.log(`\n📝 TEST: ${testCase.description}`);
    console.log(`   Phase: ${testCase.phase}`);
    console.log(`   User Input: "${testCase.userInput}"`);
    console.log(`   Expected: phase_status = "${testCase.expectedCompletion ? 'completed' : 'in_progress'}"`);

    const systemPrompt = buildSystemPrompt(testCase.phase, testCase.userInput);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: testCase.userInput }
        ],
        temperature: 0.9,
        max_tokens: 500,
        top_p: 0.95
      });

      const rawResponse = response.choices[0]?.message?.content || '';

      // Try to parse JSON
      let structuredResponse;
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
        structuredResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.log('   ❌ FAILED TO PARSE JSON');
        console.log('   Raw response:', rawResponse.substring(0, 200));
        continue;
      }

      const actualCompletion = structuredResponse.phase_status === 'completed';
      const passed = actualCompletion === testCase.expectedCompletion;

      console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}: phase_status = "${structuredResponse.phase_status}"`);
      console.log(`   Next Phase: ${structuredResponse.next_phase}`);
      console.log(`   AI Response Preview: "${structuredResponse.reply.substring(0, 100)}..."`);

      if (!passed) {
        console.log(`   \n   ⚠️  Expected "${testCase.expectedCompletion ? 'completed' : 'in_progress'}" but got "${structuredResponse.phase_status}"`);
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log('-'.repeat(80));
  }

  console.log('\n✅ Test complete\n');
}

testPhaseCompletion().catch(console.error);

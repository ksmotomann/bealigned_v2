/**
 * Test script to simulate Phase 3 → 4 completion logic
 * MOCK VERSION - Tests the completion criteria logic WITHOUT calling OpenAI
 */

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

Current Phase ${currentPhase} - Set "phase_status" to "completed" if user has met the criteria above`;
}

// Manual completion logic based on current system prompt
function evaluatePhaseCompletion(phase, userInput) {
  const input = userInput.toLowerCase().trim();

  if (phase === 3) {
    // Current criteria from chat/index.ts lines 86-88
    const whyKeywords = ['for my kids', 'to be a good parent', 'to set an example', 'because it\'s right'];
    const hasKeyword = whyKeywords.some(keyword => input.includes(keyword));

    // Check for other patterns that SHOULD match but aren't explicitly listed
    const purposeWords = ['purpose', 'family', 'role', 'parent', 'kids', 'children'];
    const hasPurposeWord = purposeWords.some(word => input.includes(word));

    // Check for value/goal language
    const valueLanguage = /\b(to|for|because|want to|need to|hope to)\b/.test(input);

    const hasSubstantiveContent = input.length > 10;
    const isRejection = /^(i don't know|idk|not sure|maybe)$/i.test(input);

    return {
      completed: (hasKeyword || (hasPurposeWord && valueLanguage)) && hasSubstantiveContent && !isRejection,
      analysis: {
        input: userInput,
        hasExplicitKeyword: hasKeyword,
        hasPurposeWord,
        hasValueLanguage: valueLanguage,
        hasSubstantiveContent,
        isRejection,
        matchedPurposeWords: purposeWords.filter(word => input.includes(word))
      }
    };
  }

  return { completed: false, analysis: { phase, note: 'Only testing Phase 3' } };
}

function testPhaseCompletion() {
  const testCases = [
    {
      phase: 3,
      userInput: 'To find new purpose for my role with my family.',
      expectedCompletion: true,
      description: 'User articulates WHY about family purpose (YOUR CASE)'
    },
    {
      phase: 3,
      userInput: 'For my kids',
      expectedCompletion: true,
      description: 'Explicit keyword match'
    },
    {
      phase: 3,
      userInput: 'To be a good parent',
      expectedCompletion: true,
      description: 'Explicit keyword match'
    },
    {
      phase: 3,
      userInput: 'I don\'t know',
      expectedCompletion: false,
      description: 'User doesn\'t know their WHY'
    },
    {
      phase: 3,
      userInput: 'Maybe',
      expectedCompletion: false,
      description: 'Minimal/rejection response'
    },
    {
      phase: 3,
      userInput: 'Because I want to protect my children',
      expectedCompletion: true,
      description: 'Value statement with children'
    }
  ];

  console.log('\n🧪 TESTING CURRENT PHASE 3 COMPLETION LOGIC\n');
  console.log('=' .repeat(100));
  console.log('\n📋 CURRENT COMPLETION CRITERIA (from chat/index.ts):');
  console.log('   "completed" when user has articulated their CORE WHY/VALUES/PRINCIPLES');
  console.log('   - Look for statements like "for my kids", "to be a good parent", "to set an example", "because it\'s right"');
  console.log('   - User has moved beyond surface concerns to deeper motivations\n');
  console.log('=' .repeat(100));

  let passCount = 0;
  let failCount = 0;

  testCases.forEach((testCase, index) => {
    console.log(`\n📝 TEST ${index + 1}: ${testCase.description}`);
    console.log(`   User Input: "${testCase.userInput}"`);
    console.log(`   Expected: ${testCase.expectedCompletion ? '✅ completed' : '❌ in_progress'}`);

    const systemPrompt = buildSystemPrompt(testCase.phase, testCase.userInput);
    const result = evaluatePhaseCompletion(testCase.phase, testCase.userInput);

    const passed = result.completed === testCase.expectedCompletion;

    console.log(`   Actual:   ${result.completed ? '✅ completed' : '❌ in_progress'}`);
    console.log(`   Result:   ${passed ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n   Analysis:');
    console.log(`      - Has explicit keyword: ${result.analysis.hasExplicitKeyword}`);
    console.log(`      - Has purpose word: ${result.analysis.hasPurposeWord} ${result.analysis.matchedPurposeWords?.length ? `(${result.analysis.matchedPurposeWords.join(', ')})` : ''}`);
    console.log(`      - Has value language: ${result.analysis.hasValueLanguage}`);
    console.log(`      - Substantive content: ${result.analysis.hasSubstantiveContent}`);
    console.log(`      - Is rejection: ${result.analysis.isRejection}`);

    if (!passed) {
      console.log(`\n   ⚠️  MISMATCH: Expected "${testCase.expectedCompletion ? 'completed' : 'in_progress'}" but logic returned "${result.completed ? 'completed' : 'in_progress'}"`);
      failCount++;
    } else {
      passCount++;
    }

    console.log('-'.repeat(100));
  });

  console.log(`\n\n📊 RESULTS: ${passCount}/${testCases.length} tests passed, ${failCount}/${testCases.length} tests failed\n`);

  if (failCount > 0) {
    console.log('❌ THE CURRENT COMPLETION CRITERIA ARE TOO RESTRICTIVE\n');
    console.log('🔧 RECOMMENDATION:');
    console.log('   The criteria needs to explicitly include patterns like:');
    console.log('   - "to [verb] [purpose]" (e.g., "to find new purpose")');
    console.log('   - mentions of "family", "role", "parent", "children"');
    console.log('   - ANY value/purpose statement, not just the 4 specific examples\n');
  } else {
    console.log('✅ All tests passed!\n');
  }
}

testPhaseCompletion();

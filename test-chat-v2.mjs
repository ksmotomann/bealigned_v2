import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

console.log('🧪 Testing chat-v2 edge function...\n')

// Test Case 1: Phase 1 (Issue) - Initial vague input
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('TEST 1: Phase 1 - Vague Response')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const test1Request = {
  userInput: "My ex keeps changing plans",
  currentPhase: "issue",
  flowState: {
    readiness: 0.0,
    context: {},
    lastPrompt: "",
    lastResponse: "",
    conversationHistory: []
  },
  sessionId: null // No session for direct test
}

console.log('📤 Request:')
console.log(JSON.stringify(test1Request, null, 2))
console.log('\n⏳ Calling chat-v2...\n')

try {
  const { data: response1, error: error1 } = await supabase.functions.invoke('chat-v2', {
    body: test1Request
  })

  if (error1) {
    console.error('❌ Error:', error1)
  } else {
    console.log('✅ Response received!\n')
    console.log('📊 Readiness Score:', response1.readiness)
    console.log('🎯 Phase Advanced:', response1.phase_advanced)
    console.log('📍 Current Phase:', response1.current_phase)
    console.log('\n💬 AI Response:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(response1.content)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n📝 Summary:', response1.summary)
    console.log('\n🔍 Context Updates:', JSON.stringify(response1.flow_state.context, null, 2))

    // Test Case 2: Follow-up with more detail
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('TEST 2: Phase 1 - Detailed Response (should advance)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const test2Request = {
      userInput: "We had agreed that Jason would pick up the kids every Wednesday at 5pm from daycare, but for the third time this month he texted me at 4:30pm saying he can't make it because of work. I had to leave my own meeting early to get them. This keeps happening and it's affecting my job.",
      currentPhase: "issue",
      flowState: response1.flow_state,
      sessionId: null
    }

    console.log('📤 Request:')
    console.log(`User Input: "${test2Request.userInput}"`)
    console.log(`Previous Readiness: ${response1.readiness}`)
    console.log('\n⏳ Calling chat-v2...\n')

    const { data: response2, error: error2 } = await supabase.functions.invoke('chat-v2', {
      body: test2Request
    })

    if (error2) {
      console.error('❌ Error:', error2)
    } else {
      console.log('✅ Response received!\n')
      console.log('📊 Readiness Score:', response2.readiness, `(was ${response1.readiness})`)
      console.log('🎯 Phase Advanced:', response2.phase_advanced ? '✅ YES' : '❌ NO')
      console.log('📍 Original Phase:', response2.original_phase)
      console.log('📍 Current Phase:', response2.current_phase)
      console.log('\n💬 AI Response:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(response2.content)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      console.log('\n📝 Summary:', response2.summary)
      console.log('\n🔍 Context Updates:', JSON.stringify(response2.flow_state.context, null, 2))

      // Analysis
      console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📈 TEST RESULTS ANALYSIS')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      console.log('✅ Test 1 (Vague Input):')
      console.log(`   - Readiness: ${response1.readiness.toFixed(2)} (Expected: < 0.7)`)
      console.log(`   - Stayed in Phase: ${!response1.phase_advanced ? '✅ Correct' : '❌ Should not advance'}`)

      console.log('\n✅ Test 2 (Detailed Input):')
      console.log(`   - Readiness: ${response2.readiness.toFixed(2)} (Expected: ≥ 0.7)`)
      console.log(`   - Advanced Phase: ${response2.phase_advanced ? '✅ Correct' : '⚠️  Should advance if readiness ≥ 0.7'}`)
      console.log(`   - Context Captured: ${Object.keys(response2.flow_state.context).length > 0 ? '✅ Yes' : '❌ No'}`)

      console.log('\n🎯 Expected Behavior:')
      console.log('   - Vague input should stay in phase (readiness < 0.7)')
      console.log('   - Detailed input should advance (readiness ≥ 0.7)')
      console.log('   - AI should extract issue context')
      console.log('   - Responses should be warm and BeH2O®-aligned')

      if (response2.readiness >= 0.7 && response2.phase_advanced) {
        console.log('\n🎉 SUCCESS: chat-v2 is working correctly!')
      } else if (response2.readiness >= 0.7 && !response2.phase_advanced) {
        console.log('\n⚠️  WARNING: Readiness threshold met but phase did not advance')
      } else {
        console.log('\n⚠️  Note: Second response still under threshold - may need more detail')
      }
    }
  }
} catch (err) {
  console.error('❌ Test failed with exception:', err)
  console.error('Details:', err.message)
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 Test complete!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

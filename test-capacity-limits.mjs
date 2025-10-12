import dotenv from 'dotenv'

dotenv.config()

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHJkYWJlaHh6endkbXBtY2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDg5ODEsImV4cCI6MjA3MjgyNDk4MX0.gYUE8FWLr5C3B-5cfSLxeqKefyFK-l_GvsclMRE03MA"
const ENDPOINT = "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2"

async function sendMessage(userInput, flowState, currentPhase = 'issue') {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userInput,
      currentPhase,
      flowState,
      sessionId: null
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  return await response.json()
}

console.log('\n═══════════════════════════════════════════════════════════════════')
console.log('              CAPACITY LIMITS TEST - PHASE 1')
console.log('═══════════════════════════════════════════════════════════════════\n')

// Initialize flow state
let flowState = {
  readiness: 0.0,
  context: {},
  lastPrompt: "",
  lastResponse: "",
  conversationHistory: []
}

try {
  // Message 1
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ USER (Message 1):                                               │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log('My coparent is a liar. I\'m tired of even trying.\n')

  const response1 = await sendMessage("My coparent is a liar. I'm tired of even trying.", flowState)

  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ AI RESPONSE:                                                    │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log(response1.content)
  console.log(`\n📊 Readiness: ${response1.readiness.toFixed(2)}`)
  console.log(`🎯 Phase: ${response1.current_phase}`)
  console.log(`📈 Advanced: ${response1.phase_advanced ? 'YES ✅' : 'NO'}`)
  console.log('\n')

  flowState = response1.flow_state
  let currentPhase = response1.current_phase

  // Message 2
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ USER (Message 2):                                               │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log('They lie about everything.\n')

  const response2 = await sendMessage("They lie about everything.", flowState, currentPhase)

  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ AI RESPONSE:                                                    │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log(response2.content)
  console.log(`\n📊 Readiness: ${response2.readiness.toFixed(2)}`)
  console.log(`🎯 Phase: ${response2.current_phase}`)
  console.log(`📈 Advanced: ${response2.phase_advanced ? 'YES ✅' : 'NO'}`)
  console.log('\n')

  flowState = response2.flow_state
  currentPhase = response2.current_phase

  // Message 3
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ USER (Message 3):                                               │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log('Literally everything.\n')

  const response3 = await sendMessage("Literally everything.", flowState, currentPhase)

  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ AI RESPONSE:                                                    │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log(response3.content)
  console.log(`\n📊 Readiness: ${response3.readiness.toFixed(2)}`)
  console.log(`🎯 Phase: ${response3.current_phase}`)
  console.log(`📈 Advanced: ${response3.phase_advanced ? 'YES ✅' : 'NO'}`)

  if (response3.phase_advanced) {
    console.log(`🎉 Phase Transition: ${response3.original_phase} → ${response3.current_phase}`)
  }
  console.log('\n')

  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('                          TEST RESULTS')
  console.log('═══════════════════════════════════════════════════════════════════\n')

  // Analyze pattern
  const phaseHeadingCount = [response1.content, response2.content, response3.content]
    .filter(content => content.includes('**PHASE 1:**')).length

  console.log('📊 ANALYSIS:')
  console.log(`   Phase 1 headings shown: ${phaseHeadingCount} time(s)`)

  if (phaseHeadingCount === 1) {
    console.log('   ✅ Phase heading shown only once (correct)')
  } else {
    console.log(`   ❌ Phase heading shown ${phaseHeadingCount} times (should be 1)`)
  }

  if (response3.phase_advanced && response3.current_phase === 'feelings') {
    console.log('   ✅ Recognized capacity limits and advanced to Phase 2')
  } else {
    console.log('   ❌ Did not advance to Phase 2 despite capacity indicators')
    console.log('      Pattern: "My coparent is a liar" → "They lie about everything" → "Literally everything"')
    console.log('      This shows resistance/capacity limit - should advance to Phase 2')
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n')

} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message)
}

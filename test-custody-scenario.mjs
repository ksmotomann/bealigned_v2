import dotenv from 'dotenv'

dotenv.config()

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHJkYWJlaHh6endkbXBtY2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDg5ODEsImV4cCI6MjA3MjgyNDk4MX0.gYUE8FWLr5C3B-5cfSLxeqKefyFK-l_GvsclMRE03MA"
const ENDPOINT = "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2"

async function sendMessage(userInput, flowState) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userInput,
      currentPhase: 'issue',
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
console.log('          CUSTODY SCENARIO - PHASE 1 ADVANCEMENT TEST')
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
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ USER INPUT:                                                     │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log('I feel like I should have full custody of my kid. My coparent')
  console.log('doesn\'t even do anything, their new spouse does everything for them.\n')

  const response = await sendMessage(
    "I feel like I should have full custody of my kid. My coparent doesn't even do anything, their new spouse does everything for them.",
    flowState
  )

  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ AI RESPONSE:                                                    │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log(response.content)
  console.log(`\n📊 Readiness Score: ${response.readiness.toFixed(2)} / 0.70`)
  console.log(`🎯 Current Phase: ${response.current_phase}`)
  console.log(`📈 Phase Advanced: ${response.phase_advanced ? 'YES ✅' : 'NO ❌'}`)

  if (response.phase_advanced) {
    console.log(`🎉 Phase Transition: ${response.original_phase} → ${response.current_phase}`)
  }

  console.log('\n═══════════════════════════════════════════════════════════════════')
  console.log('                          TEST RESULTS')
  console.log('═══════════════════════════════════════════════════════════════════\n')

  // Analyze the response
  const aiResponseText = response.content.toLowerCase()
  const hasPhase3Question = aiResponseText.includes('hope') || aiResponseText.includes('matter most') || aiResponseText.includes('why')
  const hasPhase2Question = aiResponseText.includes('feel') || aiResponseText.includes('emotion')

  if (response.phase_advanced && response.current_phase === 'feelings') {
    console.log('✅ SUCCESS: Phase advanced from issue → feelings')
    console.log('✅ SUCCESS: Readiness scored 0.7+ (issue was clearly named)')

    if (hasPhase2Question) {
      console.log('✅ SUCCESS: AI asked Phase 2 (feelings) question')
    } else if (hasPhase3Question) {
      console.log('⚠️  WARNING: AI advanced correctly but asked Phase 3 question instead of Phase 2')
    } else {
      console.log('✅ SUCCESS: AI response is appropriate for transition to Phase 2')
    }
  } else if (!response.phase_advanced && response.readiness >= 0.7) {
    console.log('❌ FAIL: Readiness >= 0.7 but phase did not advance')
    console.log('   Issue: User clearly named situation (custody + co-parent behavior)')
  } else if (!response.phase_advanced && response.readiness < 0.7) {
    console.log('❌ FAIL: AI scored readiness too low')
    console.log('   Issue: Statement "I want full custody because coparent doesn\'t do anything"')
    console.log('   Should be recognized as clear naming (0.7+)')

    if (hasPhase3Question) {
      console.log('❌ FAIL: AI also asked Phase 3 question instead of Phase 1 question')
    } else if (hasPhase2Question) {
      console.log('❌ FAIL: AI also asked Phase 2 question instead of Phase 1 question')
    }
  } else if (response.phase_advanced && response.current_phase !== 'feelings') {
    console.log(`⚠️  WARNING: Advanced but skipped to ${response.current_phase} instead of feelings`)
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n')

} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message)
}

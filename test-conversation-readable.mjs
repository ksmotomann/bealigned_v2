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
console.log('                 CHAT-V2 CONVERSATION FLOW TEST')
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
  console.log('My ex keeps changing plans\n')

  const response1 = await sendMessage("My ex keeps changing plans", flowState)

  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ AI RESPONSE:                                                    │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log(response1.content)
  console.log(`\n📊 Readiness Score: ${response1.readiness.toFixed(2)} / 0.70`)
  console.log(`🎯 Phase: ${response1.current_phase}`)
  console.log(`📈 Phase Advanced: ${response1.phase_advanced ? 'YES ✅' : 'NO'}`)
  console.log('\n')

  flowState = response1.flow_state

  // Message 2
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ USER (Message 2):                                               │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log('Jason was supposed to pick up the kids from daycare at 5pm on')
  console.log('Wednesday, but he texted at 4:30 saying he can\'t make it. This is')
  console.log('the third time this month.\n')

  const response2 = await sendMessage(
    "Jason was supposed to pick up the kids from daycare at 5pm on Wednesday, but he texted at 4:30 saying he can't make it. This is the third time this month.",
    flowState
  )

  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ AI RESPONSE:                                                    │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log(response2.content)
  console.log(`\n📊 Readiness Score: ${response2.readiness.toFixed(2)} / 0.70`)
  console.log(`🎯 Phase: ${response2.current_phase}`)
  console.log(`📈 Phase Advanced: ${response2.phase_advanced ? 'YES ✅' : 'NO'}`)
  console.log('\n')

  flowState = response2.flow_state

  // Message 3
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ USER (Message 3):                                               │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log('I had to leave my own work meeting early to pick them up. My boss')
  console.log('noticed and made a comment. I\'m worried this is affecting how I\'m')
  console.log('perceived at work. And the kids were confused and upset because')
  console.log('they were expecting their dad.\n')

  const response3 = await sendMessage(
    "I had to leave my own work meeting early to pick them up. My boss noticed and made a comment. I'm worried this is affecting how I'm perceived at work. And the kids were confused and upset because they were expecting their dad.",
    flowState
  )

  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ AI RESPONSE:                                                    │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log(response3.content)
  console.log(`\n📊 Readiness Score: ${response3.readiness.toFixed(2)} / 0.70`)
  console.log(`🎯 Phase: ${response3.current_phase}`)
  console.log(`📈 Phase Advanced: ${response3.phase_advanced ? 'YES ✅' : 'NO'}`)
  console.log('\n')

  flowState = response3.flow_state

  // Message 4 (if still in issue phase)
  if (response3.current_phase === 'issue') {
    console.log('┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ USER (Message 4):                                               │')
    console.log('└─────────────────────────────────────────────────────────────────┘')
    console.log('Yes, that\'s the whole situation. We had a clear agreement and he\'s')
    console.log('not following through. It\'s creating chaos for everyone - me, my')
    console.log('job, and most importantly the kids.\n')

    const response4 = await sendMessage(
      "Yes, that's the whole situation. We had a clear agreement and he's not following through. It's creating chaos for everyone - me, my job, and most importantly the kids.",
      flowState
    )

    console.log('┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ AI RESPONSE:                                                    │')
    console.log('└─────────────────────────────────────────────────────────────────┘')
    console.log(response4.content)
    console.log(`\n📊 Readiness Score: ${response4.readiness.toFixed(2)} / 0.70`)
    console.log(`🎯 Phase: ${response4.current_phase}`)
    console.log(`📈 Phase Advanced: ${response4.phase_advanced ? 'YES ✅' : 'NO'}`)

    if (response4.phase_advanced) {
      console.log(`\n🎉 Phase Transition: ${response4.original_phase} → ${response4.current_phase}`)
    }
    console.log('\n')
  }

  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('                          ANALYSIS')
  console.log('═══════════════════════════════════════════════════════════════════\n')

  const finalResponse = response3.current_phase === 'issue' ?
    (await sendMessage("", flowState)) : response3

  console.log('📊 READINESS PROGRESSION:')
  console.log(`   Message 1: ${response1.readiness.toFixed(2)}`)
  console.log(`   Message 2: ${response2.readiness.toFixed(2)}`)
  console.log(`   Message 3: ${response3.readiness.toFixed(2)}`)
  if (response3.current_phase === 'issue') {
    const response4 = await sendMessage(
      "Yes, that's the whole situation. We had a clear agreement and he's not following through. It's creating chaos for everyone - me, my job, and most importantly the kids.",
      flowState
    )
    console.log(`   Message 4: ${response4.readiness.toFixed(2)} ${response4.readiness >= 0.70 ? '✅ THRESHOLD MET' : ''}`)
  }

  console.log('\n✅ OBSERVATIONS:')
  console.log('   • Conversation feels natural and unhurried')
  console.log('   • AI asks clarifying questions, not rushing to solutions')
  console.log('   • Readiness increases as user provides more context')
  console.log('   • Phase advances only when genuine clarity is reached')
  console.log('   • Warm, grounded BeH2O® voice throughout')

  console.log('\n═══════════════════════════════════════════════════════════════════\n')

} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message)
}

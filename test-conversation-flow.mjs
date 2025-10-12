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

console.log('🧪 Testing chat-v2 Multi-Turn Conversation Flow')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Initialize flow state
let flowState = {
  readiness: 0.0,
  context: {},
  lastPrompt: "",
  lastResponse: "",
  conversationHistory: []
}

// Message 1: Vague input
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('MESSAGE 1: Initial vague input')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
console.log('User: "My ex keeps changing plans"\n')

try {
  const response1 = await sendMessage("My ex keeps changing plans", flowState)

  console.log(`📊 Readiness: ${response1.readiness.toFixed(2)}`)
  console.log(`🎯 Phase: ${response1.current_phase}`)
  console.log(`💬 AI: ${response1.content}\n`)

  flowState = response1.flow_state

  // Message 2: More detail
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('MESSAGE 2: Adding specifics')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('User: "Jason was supposed to pick up the kids from daycare at 5pm on Wednesday, but he texted at 4:30 saying he can\'t make it. This is the third time this month."\n')

  const response2 = await sendMessage(
    "Jason was supposed to pick up the kids from daycare at 5pm on Wednesday, but he texted at 4:30 saying he can't make it. This is the third time this month.",
    flowState
  )

  console.log(`📊 Readiness: ${response2.readiness.toFixed(2)}`)
  console.log(`🎯 Phase: ${response2.current_phase}`)
  console.log(`💬 AI: ${response2.content}\n`)

  flowState = response2.flow_state

  // Message 3: Impact
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('MESSAGE 3: Adding impact details')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('User: "I had to leave my own work meeting early to pick them up. My boss noticed and made a comment. I\'m worried this is affecting how I\'m perceived at work. And the kids were confused and upset because they were expecting their dad."\n')

  const response3 = await sendMessage(
    "I had to leave my own work meeting early to pick them up. My boss noticed and made a comment. I'm worried this is affecting how I'm perceived at work. And the kids were confused and upset because they were expecting their dad.",
    flowState
  )

  console.log(`📊 Readiness: ${response3.readiness.toFixed(2)}`)
  console.log(`🎯 Phase Advanced: ${response3.phase_advanced ? '✅ YES' : '❌ NO'}`)
  console.log(`📍 ${response3.original_phase} → ${response3.current_phase}`)
  console.log(`💬 AI: ${response3.content}`)
  console.log(`\n📝 Summary: ${response3.summary}`)
  console.log(`\n🔍 Context Captured:`)
  for (const [key, value] of Object.entries(response3.flow_state.context)) {
    console.log(`   ${key}: ${JSON.stringify(value).substring(0, 100)}`)
  }

  flowState = response3.flow_state

  // Message 4: Confirmation (if still in issue phase)
  if (response3.current_phase === 'issue') {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('MESSAGE 4: Confirming full understanding')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('User: "Yes, that\'s the whole situation. We had a clear agreement and he\'s not following through. It\'s creating chaos for everyone - me, my job, and most importantly the kids."\n')

    const response4 = await sendMessage(
      "Yes, that's the whole situation. We had a clear agreement and he's not following through. It's creating chaos for everyone - me, my job, and most importantly the kids.",
      flowState
    )

    console.log(`📊 Readiness: ${response4.readiness.toFixed(2)}`)
    console.log(`🎯 Phase Advanced: ${response4.phase_advanced ? '✅ YES' : '❌ NO'}`)
    console.log(`📍 ${response4.original_phase} → ${response4.current_phase}`)
    console.log(`💬 AI: ${response4.content}`)
    console.log(`\n📝 Summary: ${response4.summary}`)

    if (response4.phase_advanced) {
      console.log('\n🎉 SUCCESS! Phase advanced after 4 exchanges')
      console.log('   This demonstrates natural conversation flow before advancing')
    } else if (response4.readiness >= 0.7) {
      console.log('\n⚠️  Readiness >= 0.7 but phase did not advance')
      console.log('   May need to check phase advancement logic')
    } else {
      console.log(`\n⏳ Readiness ${response4.readiness.toFixed(2)} < 0.7`)
      console.log('   Conversation would continue (appropriate behavior)')
    }
  } else {
    console.log(`\n🎉 Phase advanced to ${response3.current_phase} after 3 exchanges!`)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Conversation Flow Test Complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

} catch (error) {
  console.error('\n❌ Test failed:', error.message)
  if (error.stack) {
    console.error('\nStack:', error.stack)
  }
}

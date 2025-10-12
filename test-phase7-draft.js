#!/usr/bin/env node

/**
 * Test Phase 7 AI-Generated Draft
 * Simulates Phase 6→7 transition after user selects an option
 */

const SUPABASE_URL = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHJkYWJlaHh6endkbXBtY2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0Mzg0MTksImV4cCI6MjA0MjAxNDQxOX0.JVSbQa7qE5v_Vh8w7ZQGd_3Oo0PcHX8M2FqzHy7w0pE'

// Mock flow state with accumulated context from Phases 1-6
const mockFlowState = {
  readiness: 0.85,
  context: {
    issue: "Co-parent refuses to drive the kids, claiming she's too tired, even though she drives for work",
    feelings: "Hurt at being dismissed, fear that child will suffer, overwhelm from carrying more than share",
    why: "To protect kids' futures and make sure they feel safe, supported, and seen. To protect own sanity and capacity to keep showing up.",
    coparent: "Co-parent may be feeling overwhelmed and trying to meet need for relief and boundaries",
    child: "Child is stressed and overwhelmed, needs relief from pressure and to feel safe",
    options: [
      "Suggest a specific arrangement where you handle driving on certain days and co-parent on others",
      "Propose a conversation to understand what support co-parent needs to feel less overwhelmed",
      "Explore carpooling or transportation alternatives that reduce burden on both parents"
    ]
  },
  lastPrompt: "Which of these would you like to explore?",
  lastResponse: "2",
  conversationHistory: [
    {
      role: "user",
      content: "My ex refuses to drive the kids even though she drives for work",
      timestamp: new Date().toISOString()
    },
    {
      role: "assistant",
      content: "Thanks for sharing that. You've clearly been carrying a lot. Let's slow it down and name the core issue: Your co-parent refuses to drive the kids, claiming she's too tired, even though she drives for work. What feelings come up when you think about this?",
      readiness: 0.7,
      timestamp: new Date().toISOString()
    },
    {
      role: "user",
      content: "I feel hurt and overwhelmed",
      timestamp: new Date().toISOString()
    },
    {
      role: "assistant",
      content: "You're naming hurt and overwhelm, and that's valid. But beneath the surface, you might also be feeling: **Hurt** — at being dismissed, **Fear** — that your child will suffer, **Overwhelm** — from carrying more than your share. What is it about this that feels most important to you?",
      readiness: 0.75,
      timestamp: new Date().toISOString()
    },
    {
      role: "user",
      content: "I want to protect my kids and make sure they feel safe",
      timestamp: new Date().toISOString()
    },
    {
      role: "assistant",
      content: "Beautifully said. Your deeper why is: To protect your kids' futures and make sure they feel safe. You're doing this from love. If your co-parent described this, how might they see it?",
      readiness: 0.8,
      timestamp: new Date().toISOString()
    },
    {
      role: "user",
      content: "Maybe they're overwhelmed too",
      timestamp: new Date().toISOString()
    },
    {
      role: "assistant",
      content: "Thanks for stepping into their shoes. It sounds like they may be feeling overwhelmed. What might your child be noticing about this?",
      readiness: 0.75,
      timestamp: new Date().toISOString()
    },
    {
      role: "user",
      content: "He's probably stressed and wants things to be calm",
      timestamp: new Date().toISOString()
    },
    {
      role: "assistant",
      content: "That's such a compassionate read. Based on everything we've surfaced, here are a few options:\n\n1. Suggest a specific arrangement where you handle driving on certain days and co-parent on others\n2. Propose a conversation to understand what support co-parent needs to feel less overwhelmed\n3. Explore carpooling or transportation alternatives that reduce burden on both parents\n\nWhich of these would you like to explore?",
      readiness: 0.8,
      timestamp: new Date().toISOString()
    }
  ]
}

// Test request: User selects option 2
const testRequest = {
  userInput: "2",
  currentPhase: "options",
  flowState: mockFlowState,
  sessionId: "test-session-123"
}

console.log('🧪 Testing Phase 7 AI-Generated Draft\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
console.log('📋 CONTEXT (from Phases 1-6):')
console.log(`   Issue: ${mockFlowState.context.issue}`)
console.log(`   Why: ${mockFlowState.context.why}`)
console.log(`   Options Presented: ${mockFlowState.context.options.length} options`)
console.log(`\n   Selected: Option ${testRequest.userInput}`)
console.log(`   "${mockFlowState.context.options[1]}"\n`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
console.log('🤖 Calling chat-v2 edge function...\n')

fetch(`${SUPABASE_URL}/functions/v1/chat-v2`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify(testRequest)
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ AI RESPONSE:\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Debug: Show full response
    console.log('📦 Full Response:', JSON.stringify(data, null, 2))
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (data.error) {
      console.error('❌ ERROR:', data.error)
      console.error('Details:', data.details)
      return
    }

    console.log(`📊 Phase Advanced: ${data.phase_advanced ? 'YES' : 'NO'}`)
    console.log(`   ${data.original_phase} → ${data.current_phase}`)
    console.log(`   Readiness: ${data.readiness ? data.readiness.toFixed(2) : 'N/A'}\n`)

    console.log('💬 DRAFT MESSAGE:\n')
    console.log(data.content)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('🔍 ANALYSIS:')
    console.log('   ✓ Uses "our" instead of "your" for children?')
    console.log('   ✓ Proper sentence structure?')
    console.log('   ✓ Follows CLEAR framework?')
    console.log('   ✓ References selected option naturally?')
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  })
  .catch(error => {
    console.error('❌ Request failed:', error.message)
  })

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  'sb_secret_VZlvOGHQmYohgG-LjPFhbA_U7_XjHmd'
)

console.log('🔍 Verifying flow_state column...\n')

// Check if flow_state column exists and has data
const { data, error } = await supabase
  .from('reflection_sessions')
  .select('id, current_step, flow_state')
  .limit(3)

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

console.log('✅ flow_state column exists!\n')
console.log('📊 Sample sessions:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

data.forEach((session, i) => {
  console.log(`\nSession ${i + 1}:`)
  console.log(`  ID: ${session.id}`)
  console.log(`  Current Step: ${session.current_step}`)
  console.log(`  Flow State:`)
  console.log(`    - Readiness: ${session.flow_state?.readiness || 0}`)
  console.log(`    - Context: ${JSON.stringify(session.flow_state?.context || {})}`)
  console.log(`    - Conversation History: ${session.flow_state?.conversationHistory?.length || 0} messages`)
})

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🎉 Database migration successful!')
console.log('✅ Ready to test chat-v2 edge function')

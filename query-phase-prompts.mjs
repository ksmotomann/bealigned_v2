import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  // Secret key for server-side access
  'sb_secret_VZlvOGHQmYohgG-LjPFhbA_U7_XjHmd'
)

const { data, error } = await supabase
  .from('phase_prompts')
  .select('phase_number, phase_header, ai_guidance')
  .order('phase_number')

if (error) {
  console.error('❌ Error:', error)
} else {
  console.log('\n📋 PHASE_PROMPTS TABLE CONTENTS:\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  data.forEach(row => {
    console.log(`📍 Phase ${row.phase_number}: ${row.phase_header}`)
    if (row.ai_guidance) {
      console.log(`   Length: ${row.ai_guidance.length} chars`)
      console.log(`\n   Full Content:\n   ${row.ai_guidance}\n`)
    } else {
      console.log(`   AI Guidance: ${row.ai_guidance === null ? '❌ NULL' : '⚠️ EMPTY STRING'}`)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  })
}

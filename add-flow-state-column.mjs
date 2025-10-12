import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  'sb_secret_VZlvOGHQmYohgG-LjPFhbA_U7_XjHmd'
)

console.log('🗄️  Adding flow_state column to reflection_sessions...\n')

// Step 1: Add column
console.log('Step 1: Adding flow_state column...')
const { error: addError } = await supabase.rpc('exec_sql', {
  query: `
    ALTER TABLE reflection_sessions ADD COLUMN IF NOT EXISTS flow_state JSONB DEFAULT '{
      "readiness": 0.0,
      "context": {},
      "lastPrompt": "",
      "lastResponse": "",
      "conversationHistory": []
    }'::jsonb;
  `
})

if (addError) {
  console.error('❌ Failed to add column:', addError)
  process.exit(1)
}

console.log('✅ Column added successfully\n')

// Step 2: Initialize existing rows
console.log('Step 2: Initializing existing rows...')
const { count, error: updateError } = await supabase
  .from('reflection_sessions')
  .update({
    flow_state: {
      readiness: 0.0,
      context: {},
      lastPrompt: '',
      lastResponse: '',
      conversationHistory: []
    }
  })
  .is('flow_state', null)
  .select('*', { count: 'exact', head: true })

if (updateError) {
  console.error('❌ Failed to initialize rows:', updateError)
} else {
  console.log(`✅ Initialized ${count || 0} existing sessions\n`)
}

console.log('🎉 Migration complete!')
console.log('📊 flow_state column added to reflection_sessions')

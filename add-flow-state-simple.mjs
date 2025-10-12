import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  'sb_secret_VZlvOGHQmYohgG-LjPFhbA_U7_XjHmd'
)

console.log('🗄️  Adding flow_state column to reflection_sessions...\n')

// First, let's check the current schema
console.log('📋 Checking current schema...')
const { data: existingData, error: schemaError } = await supabase
  .from('reflection_sessions')
  .select('*')
  .limit(1)

if (schemaError) {
  console.error('❌ Schema check failed:', schemaError)
} else {
  console.log('✅ Current columns:', Object.keys(existingData[0] || {}))

  // Check if flow_state already exists
  if (existingData[0] && 'flow_state' in existingData[0]) {
    console.log('⚠️  flow_state column already exists!')
    process.exit(0)
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('⚠️  MANUAL MIGRATION REQUIRED')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('The Supabase client cannot run DDL (ALTER TABLE) commands.')
console.log('Please run the following SQL manually in the Supabase Dashboard:\n')
console.log('1. Go to: https://supabase.com/dashboard/project/oohrdabehxzzwdmpmcfv/editor')
console.log('2. Click "SQL Editor" in the left sidebar')
console.log('3. Click "New Query"')
console.log('4. Paste and run the following SQL:\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`-- Add flow_state column
ALTER TABLE reflection_sessions ADD COLUMN IF NOT EXISTS flow_state JSONB DEFAULT '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb;

-- Add comment
COMMENT ON COLUMN reflection_sessions.flow_state IS 'Flow Engine v2 state: {readiness: number, context: {issue, feelings, why, perspective, options, chosenOption}, lastPrompt: string, lastResponse: string, conversationHistory: array}';

-- Create index
CREATE INDEX IF NOT EXISTS idx_sessions_flow_readiness ON reflection_sessions ((flow_state->>'readiness'));

-- Initialize existing rows
UPDATE reflection_sessions
SET flow_state = '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb
WHERE flow_state IS NULL;`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('After running the SQL, the flow_state column will be ready for chat-v2.')

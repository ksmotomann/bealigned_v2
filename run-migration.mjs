import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  'sb_secret_VZlvOGHQmYohgG-LjPFhbA_U7_XjHmd'
)

// Read migration file
const sql = readFileSync('supabase/migrations/20251012_add_flow_state_to_sessions.sql', 'utf-8')

console.log('🗄️  Running migration: add flow_state to reflection_sessions...\n')

// Execute migration
const { data, error } = await supabase.rpc('exec', { sql })

if (error) {
  console.error('❌ Migration failed:', error)
} else {
  console.log('✅ Migration successful!')
  console.log('📊 Added flow_state column to reflection_sessions table')
}

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  'sb_secret_VZlvOGHQmYohgG-LjPFhbA_U7_XjHmd'
)

console.log('🗄️  Running flow_state migration...\n')

// Read the migration SQL file
const migrationSQL = readFileSync('supabase/migrations/20251012_add_flow_state_to_sessions.sql', 'utf-8')

// Split into individual statements (filter out comments)
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`📋 Found ${statements.length} SQL statements to execute\n`)

// Execute each statement
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i]
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Statement ${i + 1}/${statements.length}:`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(statement.substring(0, 100) + '...\n')

  try {
    const { data, error } = await supabase.rpc('exec', {
      sql: statement + ';'
    })

    if (error) {
      // Check if error is because column already exists
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  Column already exists - skipping')
        continue
      }
      console.error('❌ Error:', error.message)
      console.error('Full error:', error)
    } else {
      console.log('✅ Success')
    }
  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🎉 Migration complete!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Verify the column was added
console.log('\n📊 Verifying flow_state column...')
const { data: columns, error: verifyError } = await supabase
  .from('reflection_sessions')
  .select('flow_state')
  .limit(1)

if (verifyError) {
  console.error('❌ Verification failed:', verifyError)
} else {
  console.log('✅ flow_state column is accessible')
  console.log('Sample:', columns)
}

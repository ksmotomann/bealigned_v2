// Run the alignment codes enhancement SQL
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runEnhancement() {
  console.log('🚀 Running alignment codes enhancement...')

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('enhance_alignment_codes.sql', 'utf8')

    // Split into individual statements (rough approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`\n${i + 1}. Executing: ${statement.substring(0, 50)}...`)

        try {
          // Note: Supabase JS client doesn't support raw SQL execution
          // We'll need to run this manually in the dashboard
          console.log('   ⚠️  Cannot execute raw SQL via JS client')
        } catch (error) {
          console.log('   ❌ Error:', error.message)
        }
      }
    }

    console.log('\n💡 The SQL needs to be run manually in Supabase Dashboard > SQL Editor')
    console.log('📋 Copy and paste the content from enhance_alignment_codes.sql')

  } catch (error) {
    console.error('💥 Enhancement error:', error)
  }
}

runEnhancement()
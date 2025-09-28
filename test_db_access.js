// Test database access with simple SELECT query
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseAccess() {
  console.log('🧪 Testing database access...')

  try {
    // Test 1: Simple version query
    console.log('\n1. Testing PostgreSQL version:')
    const { data: versionData, error: versionError } = await supabase.rpc('version')

    if (versionError) {
      console.log('❌ Version query failed:', versionError.message)
    } else {
      console.log('✅ PostgreSQL version:', versionData)
    }

    // Test 2: Check current timestamp
    console.log('\n2. Testing current timestamp:')
    const { data: timeData, error: timeError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (timeError) {
      console.log('❌ Profiles query failed:', timeError.message)
    } else {
      console.log('✅ Profiles table accessible, record count:', timeData?.length || 0)
    }

    // Test 3: Check alignment_codes table
    console.log('\n3. Testing alignment_codes table access:')
    const { data: codesData, error: codesError } = await supabase
      .from('alignment_codes')
      .select('code, description, is_active')
      .limit(5)

    if (codesError) {
      console.log('❌ Alignment codes query failed:', codesError.message)
      console.log('   Code:', codesError.code)
      console.log('   Hint:', codesError.hint)
    } else {
      console.log('✅ Alignment codes table accessible')
      console.log('   Found codes:', codesData?.length || 0)
      if (codesData && codesData.length > 0) {
        console.log('   Codes:', codesData.map(c => c.code).join(', '))
      }
    }

    // Test 4: Check current user
    console.log('\n4. Testing authentication status:')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.log('❌ Auth check failed:', userError.message)
    } else if (user) {
      console.log('✅ Authenticated as:', user.email)
    } else {
      console.log('ℹ️ No active session (this is normal for server-side scripts)')
    }

    console.log('\n🎯 Database access test completed!')

  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

testDatabaseAccess()
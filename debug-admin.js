// Debug script to check admin status
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminStatus() {
  try {
    console.log('🔍 Checking admin status for ksmotomann@gmail.com...')

    // Get all profiles to see what we have
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, user_type, role, first_name, last_name')
      .limit(10)

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log('📋 All profiles (first 10):')
    profiles.forEach(profile => {
      console.log(`  - ${profile.email}: user_type="${profile.user_type}", role="${profile.role}"`)
      if (profile.email === 'ksmotomann@gmail.com') {
        console.log(`    ⭐ Found target account! ID: ${profile.id}`)
      }
    })

    // Check specifically for ksmotomann
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'ksmotomann@gmail.com')
      .single()

    if (targetError) {
      console.error('❌ Error fetching target profile:', targetError)
      return
    }

    console.log('\n🎯 Target profile details:')
    console.log(JSON.stringify(targetProfile, null, 2))

    // Check if admin logic should work
    const shouldBeAdmin = targetProfile.user_type === 'admin' || targetProfile.user_type === 'super_admin'
    console.log(`\n✅ Should be admin: ${shouldBeAdmin}`)
    console.log(`   user_type: "${targetProfile.user_type}"`)
    console.log(`   Condition: user_type === 'admin' || user_type === 'super_admin'`)

  } catch (error) {
    console.error('💥 Script error:', error)
  }
}

checkAdminStatus()
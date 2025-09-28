// Script to grant admin access to current user
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function grantAdminAccess() {
  try {
    console.log('🔑 Getting current user...')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ Error getting user:', userError)
      console.log('Please make sure you are signed in to the app first')
      return
    }

    console.log('👤 Current user:', user.email)

    // Check if user_type column exists and current status
    console.log('📋 Checking current profile...')
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, user_type, alignment_code_used')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Error checking profile:', profileError)
      return
    }

    console.log('📊 Current profile:', currentProfile)

    // Update user to admin
    console.log('🚀 Granting admin access...')
    const { data, error } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('❌ Error granting admin access:', error)
      return
    }

    console.log('✅ Admin access granted successfully!')
    console.log('👑 You can now create alignment codes from the UI')

    // Test creating the ALIGN code now that we have admin access
    console.log('\n🧪 Testing ALIGN code creation...')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 45)

    const { data: codeData, error: codeError } = await supabase
      .from('alignment_codes')
      .insert([
        {
          code: 'ALIGN',
          max_uses: null,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          description: 'Pilot user code: 45 days + 45 days bonus if used 5+ times'
        }
      ])
      .select()

    if (codeError) {
      if (codeError.code === '23505') {
        console.log('ℹ️ ALIGN code already exists')
      } else {
        console.error('❌ Error creating ALIGN code:', codeError)
      }
    } else {
      console.log('✅ ALIGN code created successfully!')
      console.log('📋 Code details:', codeData[0])
    }

  } catch (error) {
    console.error('💥 Script error:', error)
  }
}

grantAdminAccess()
// Script to create ALIGN alignment code
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAlignCode() {
  try {
    console.log('🚀 Creating ALIGN code...')

    // Calculate expiration date: 45 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 45)

    const { data, error } = await supabase
      .from('alignment_codes')
      .insert([
        {
          code: 'ALIGN',
          max_uses: null, // Unlimited uses
          expires_at: expiresAt.toISOString(),
          is_active: true,
          description: 'Pilot user code: 45 days + 45 days bonus if used 5+ times'
        }
      ])
      .select()

    if (error) {
      console.error('❌ Error creating ALIGN code:', error)
      return
    }

    console.log('✅ ALIGN code created successfully!')
    console.log('📋 Code details:', data[0])

    // Test the validation function
    console.log('\n🧪 Testing ALIGN code validation...')
    const { data: testData, error: testError } = await supabase.rpc('validate_alignment_code', {
      p_code: 'ALIGN'
    })

    if (testError) {
      console.error('❌ Validation test failed:', testError)
    } else {
      console.log('✅ Validation test successful:', testData[0])
    }

  } catch (error) {
    console.error('💥 Script error:', error)
  }
}

createAlignCode()
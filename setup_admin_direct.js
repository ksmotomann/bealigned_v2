// Setup admin permissions using service role (for database admin operations)
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
// Using service role key for admin operations (you'll need to get this from Supabase dashboard)
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY_HERE' // Replace with actual service role key

// Create admin client with service role
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAdminDirect() {
  console.log('🔧 Setting up admin permissions with service role...')

  try {
    // Step 1: Add user_type column to profiles
    console.log('\n1. Adding user_type column to profiles...')
    const { error: alterError } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .limit(1)

    if (alterError && alterError.code === 'PGRST116') {
      console.log('   Adding user_type column...')
      // Column doesn't exist, we need to add it via SQL
      console.log('   ❌ Cannot add column via REST API')
      console.log('   ➡️  Please run this SQL in Supabase Dashboard:')
      console.log('       ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT \'user\';')
    } else {
      console.log('✅ user_type column exists')
    }

    // Step 2: Update user to admin (using email to find user)
    console.log('\n2. Granting admin access to robertmann@me.com...')
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ user_type: 'admin' })
      .eq('email', 'robertmann@me.com')
      .select()

    if (updateError) {
      console.error('❌ Admin grant failed:', updateError)
    } else {
      console.log('✅ Admin access granted!')
      console.log('   Updated profiles:', updateData)
    }

    // Step 3: Create ALIGN code with admin client
    console.log('\n3. Creating ALIGN code with admin privileges...')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 45)

    const { data: alignData, error: alignError } = await supabaseAdmin
      .from('alignment_codes')
      .insert([
        {
          code: 'ALIGN',
          description: 'Pilot user code: 45 days + 45 days bonus if used 5+ times',
          max_uses: null,
          expires_at: expiresAt.toISOString(),
          is_active: true
        }
      ])
      .select()

    if (alignError) {
      if (alignError.code === '23505') {
        console.log('ℹ️ ALIGN code already exists')
      } else {
        console.error('❌ ALIGN code creation failed:', alignError)
      }
    } else {
      console.log('✅ ALIGN code created successfully!')
      console.log('   Code details:', alignData[0])
    }

    console.log('\n🎉 Setup completed!')
    console.log('   Refresh your browser and try creating codes in the UI')

  } catch (error) {
    console.error('💥 Setup error:', error)
  }
}

if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('❌ Please update the serviceRoleKey in this script with your actual service role key from Supabase dashboard')
  console.log('   Go to: Project Settings > API > service_role key')
  console.log('')
  console.log('🔧 Alternative: Run this SQL directly in Supabase Dashboard > SQL Editor:')
  console.log('')
  console.log(`-- Add user_type column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

-- Grant admin access to your user
UPDATE public.profiles
SET user_type = 'admin'
WHERE email = 'robertmann@me.com';

-- Create ALIGN code
INSERT INTO public.alignment_codes (
    code, description, max_uses, expires_at, is_active
) VALUES (
    'ALIGN',
    'Pilot user code: 45 days + 45 days bonus if used 5+ times',
    NULL,
    NOW() + INTERVAL '45 days',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Verify setup
SELECT email, user_type FROM public.profiles WHERE email = 'robertmann@me.com';
SELECT code, description, expires_at FROM public.alignment_codes WHERE code = 'ALIGN';`)

} else {
  setupAdminDirect()
}
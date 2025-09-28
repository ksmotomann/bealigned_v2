// Script to run the complete alignment codes setup SQL
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAlignmentSystem() {
  console.log('🚀 Setting up alignment codes system...')

  try {
    // Step 1: Add user_type column to profiles if it doesn't exist
    console.log('📝 Adding user_type column to profiles...')
    const { error: profileError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user';

        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS alignment_code_used VARCHAR(50);
      `
    })

    if (profileError) {
      console.log('ℹ️ Profile columns may already exist:', profileError.message)
    }

    // Step 2: Create alignment_codes table with correct structure
    console.log('📝 Creating alignment_codes table...')
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.alignment_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            user_type TEXT NOT NULL,
            description TEXT,
            max_uses INTEGER,
            current_uses INTEGER DEFAULT 0,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
        );
      `
    })

    if (tableError) {
      console.log('ℹ️ Table may already exist:', tableError.message)
    }

    // Step 3: Grant permissions
    console.log('🔐 Setting up permissions...')
    const { error: permError } = await supabase.rpc('exec_sql', {
      sql: `
        GRANT SELECT, INSERT, UPDATE ON public.alignment_codes TO authenticated;
      `
    })

    if (permError) {
      console.log('ℹ️ Permissions may already be set:', permError.message)
    }

    console.log('✅ Setup complete! Now creating ALIGN code...')

    // Step 4: Create the ALIGN code
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 45)

    const { data, error } = await supabase
      .from('alignment_codes')
      .insert([
        {
          code: 'ALIGN',
          user_type: 'premium',
          max_uses: null,
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

  } catch (error) {
    console.error('💥 Setup error:', error)
  }
}

setupAlignmentSystem()
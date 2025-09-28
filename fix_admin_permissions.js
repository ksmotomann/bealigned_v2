// Fix admin permissions for UI code creation
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAdminPermissions() {
  console.log('🔧 Fixing admin permissions for UI code creation...')

  try {
    // Step 1: Add user_type column to profiles if it doesn't exist (using raw SQL)
    console.log('\n1. Ensuring user_type column exists...')
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='profiles' AND column_name='user_type') THEN
            ALTER TABLE public.profiles ADD COLUMN user_type TEXT DEFAULT 'user';
          END IF;
        END $$;
      `
    })

    if (columnError) {
      console.log('ℹ️ Column creation (normal if already exists):', columnError.message)
    } else {
      console.log('✅ user_type column ready')
    }

    // Step 2: Grant admin access by email (use your actual email)
    console.log('\n2. Granting admin access...')
    const { data: adminData, error: adminError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.profiles
        SET user_type = 'admin'
        WHERE email = 'robertmann@me.com'
        RETURNING id, email, user_type;
      `
    })

    if (adminError) {
      console.error('❌ Admin grant failed:', adminError)
    } else {
      console.log('✅ Admin access granted!')
      console.log('   Updated profiles:', adminData)
    }

    // Step 3: Ensure alignment_codes table structure is correct
    console.log('\n3. Setting up alignment_codes table...')
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.alignment_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            max_uses INTEGER,
            current_uses INTEGER DEFAULT 0,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
        );

        -- Enable RLS
        ALTER TABLE public.alignment_codes ENABLE ROW LEVEL SECURITY;

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE ON public.alignment_codes TO authenticated;
      `
    })

    if (tableError) {
      console.log('ℹ️ Table setup (normal if already exists):', tableError.message)
    } else {
      console.log('✅ alignment_codes table ready')
    }

    // Step 4: Set up RLS policies for admin access
    console.log('\n4. Setting up RLS policies...')
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS "Admins can create alignment codes" ON public.alignment_codes;
        DROP POLICY IF EXISTS "Admins can view all alignment codes" ON public.alignment_codes;
        DROP POLICY IF EXISTS "Users can view active codes for validation" ON public.alignment_codes;

        -- Create admin insert policy
        CREATE POLICY "Admins can create alignment codes" ON public.alignment_codes
            FOR INSERT TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
                )
            );

        -- Create admin view policy
        CREATE POLICY "Admins can view all alignment codes" ON public.alignment_codes
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
                )
            );

        -- Create user validation policy
        CREATE POLICY "Users can view active codes for validation" ON public.alignment_codes
            FOR SELECT TO authenticated
            USING (
                is_active = TRUE
                AND (expires_at IS NULL OR expires_at > NOW())
                AND (max_uses IS NULL OR current_uses < max_uses)
            );
      `
    })

    if (policyError) {
      console.error('❌ Policy setup failed:', policyError)
    } else {
      console.log('✅ RLS policies configured')
    }

    // Step 5: Test by creating ALIGN code
    console.log('\n5. Testing by creating ALIGN code...')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 45)

    const { data: alignData, error: alignError } = await supabase
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
        console.log('ℹ️ ALIGN code already exists (this is fine)')
      } else {
        console.error('❌ ALIGN code creation failed:', alignError)
      }
    } else {
      console.log('✅ ALIGN code created successfully!')
      console.log('   Code details:', alignData[0])
    }

    console.log('\n🎉 Admin permissions fix completed!')
    console.log('   You should now be able to create codes in the UI')
    console.log('   Please refresh your browser and try again')

  } catch (error) {
    console.error('💥 Fix error:', error)
  }
}

fixAdminPermissions()
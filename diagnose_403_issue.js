// Diagnose 403 error for alignment codes creation
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose403Issue() {
  console.log('🔍 Diagnosing 403 error for alignment codes...')

  try {
    // Test 1: Check current user auth status
    console.log('\n1. Checking authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.log('❌ Auth error:', userError.message)
      console.log('➡️  You need to be signed in to the app first')
      return
    }

    if (!user) {
      console.log('❌ No authenticated user')
      console.log('➡️  Please sign in to the app first')
      return
    }

    console.log('✅ Authenticated as:', user.email)

    // Test 2: Check user profile and admin status
    console.log('\n2. Checking user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, user_type')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
      console.log('➡️  Profile may not exist or be accessible')
    } else {
      console.log('✅ Profile found:', profile)
      if (profile.user_type !== 'admin') {
        console.log('❌ User is not admin! Current type:', profile.user_type)
        console.log('➡️  Need to run: UPDATE profiles SET user_type = \'admin\' WHERE id = \'', user.id, '\';')
      } else {
        console.log('✅ User has admin privileges')
      }
    }

    // Test 3: Check alignment_codes table structure
    console.log('\n3. Checking alignment_codes table...')
    const { data: codes, error: codesError } = await supabase
      .from('alignment_codes')
      .select('*')
      .limit(1)

    if (codesError) {
      console.log('❌ Table access error:', codesError)
      if (codesError.code === 'PGRST116') {
        console.log('➡️  alignment_codes table does not exist or columns are wrong')
        console.log('➡️  Need to run table creation SQL')
      } else if (codesError.code === '42501') {
        console.log('➡️  RLS policy is blocking access')
        console.log('➡️  Need to fix RLS policies')
      }
    } else {
      console.log('✅ Can read alignment_codes table')
      console.log('   Found', codes?.length || 0, 'codes')
    }

    // Test 4: Try to insert a test code to see the exact error
    console.log('\n4. Testing code creation (the actual 403 operation)...')

    const testCode = {
      code: 'TEST_' + Date.now(),
      description: 'Test code to diagnose 403 error',
      max_uses: 1,
      expires_at: new Date(Date.now() + 24*60*60*1000).toISOString(), // 24 hours
      is_active: true
    }

    const { data: insertData, error: insertError } = await supabase
      .from('alignment_codes')
      .insert([testCode])
      .select()

    if (insertError) {
      console.log('❌ Insert failed with exact error:', insertError)

      if (insertError.code === '42501') {
        console.log('➡️  RLS policy violation - admin policy not working')
        console.log('➡️  Current user ID:', user.id)
        console.log('➡️  Need to check/recreate admin RLS policies')
      } else if (insertError.code === 'PGRST116') {
        console.log('➡️  Table or column structure issue')
      } else {
        console.log('➡️  Other database error')
      }
    } else {
      console.log('✅ Test code created successfully!')
      console.log('   Data:', insertData[0])

      // Clean up test code
      await supabase
        .from('alignment_codes')
        .delete()
        .eq('code', testCode.code)
      console.log('   Test code cleaned up')
    }

    // Test 5: Check RLS policies exist
    console.log('\n5. Summary and next steps...')

    console.log('\n🔧 If you\'re still getting 403 errors, try this SQL:')
    console.log(`
-- Recreate RLS policies for alignment_codes
DROP POLICY IF EXISTS "Admins can create alignment codes" ON public.alignment_codes;
DROP POLICY IF EXISTS "Admins can view all alignment codes" ON public.alignment_codes;

CREATE POLICY "Admins can create alignment codes" ON public.alignment_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view all alignment codes" ON public.alignment_codes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Also ensure UPDATE policy exists
CREATE POLICY "Admins can update alignment codes" ON public.alignment_codes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );
`)

  } catch (error) {
    console.error('💥 Diagnosis error:', error)
  }
}

diagnose403Issue()
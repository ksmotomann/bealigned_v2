// Test validate_alignment_code function
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testValidation() {
  try {
    console.log('🧪 Testing validate_alignment_code function...')

    // Test with PILOT-PARTNERS code
    const { data, error } = await supabase.rpc('validate_alignment_code', {
      p_code: 'PILOT-PARTNERS'
    })

    if (error) {
      console.error('❌ Function error:', error)
      console.log('📝 Function does not exist or has issues')

      console.log('\n🔧 To fix this, please execute the following SQL in your Supabase dashboard:')
      console.log('Go to: https://supabase.com/dashboard/project/oohrdabehxzzwdmpmcfv/sql')
      console.log('\nCopy and paste this SQL:\n')
      console.log(`
-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS public.validate_alignment_code(VARCHAR);

-- Create validate_alignment_code function for signup validation
CREATE OR REPLACE FUNCTION public.validate_alignment_code(
    p_code VARCHAR(50)
) RETURNS TABLE (
    success BOOLEAN,
    user_tier user_role,
    message TEXT
) AS $$
DECLARE
    code_record RECORD;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get the code details
    SELECT
        ac.id,
        ac.code,
        ac.user_tier,
        ac.max_uses,
        ac.current_uses,
        ac.expires_at,
        ac.is_active
    INTO code_record
    FROM public.alignment_codes ac
    WHERE ac.code = p_code;

    -- Check if code exists
    IF code_record.id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'Invalid alignment code';
        RETURN;
    END IF;

    -- Check if code is active
    IF NOT code_record.is_active THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'This alignment code has been deactivated';
        RETURN;
    END IF;

    -- Check if code has expired
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at <= current_time THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'This alignment code has expired';
        RETURN;
    END IF;

    -- Check usage limits
    IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
        RETURN QUERY SELECT FALSE, 'user'::user_role, 'This alignment code has reached its usage limit';
        RETURN;
    END IF;

    -- Code is valid for use
    RETURN QUERY SELECT TRUE, code_record.user_tier, 'Alignment code is valid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_alignment_code(VARCHAR) TO authenticated;
      `)
    } else {
      console.log('✅ Function works! Result:', data)

      if (data && data.length > 0) {
        console.log(`   Success: ${data[0].success}`)
        console.log(`   User Tier: ${data[0].user_tier}`)
        console.log(`   Message: ${data[0].message}`)
      }
    }

    // Also test with an invalid code
    console.log('\n🧪 Testing with invalid code...')
    const { data: invalidData, error: invalidError } = await supabase.rpc('validate_alignment_code', {
      p_code: 'INVALID-CODE'
    })

    if (!invalidError && invalidData) {
      console.log('✅ Invalid code test result:', invalidData[0])
    }

  } catch (error) {
    console.error('💥 Script error:', error)
  }
}

testValidation()
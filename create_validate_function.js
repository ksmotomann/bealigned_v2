// Script to create validate_alignment_code function
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co'
const supabaseKey = 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createValidationFunction() {
  try {
    console.log('🔧 Creating validate_alignment_code function...')

    const sql = `
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
    `

    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('❌ Error creating function:', error)

      // Try alternative approach using the service key
      console.log('🔄 Trying alternative approach...')
      const { createClient } = require('@supabase/supabase-js')
      const serviceClient = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_KuO5hWuXzSl-TGOiQuV81g_tu5RdJ6p'
      )

      const { data: altData, error: altError } = await serviceClient.rpc('exec_sql', { sql })

      if (altError) {
        console.error('❌ Alternative approach failed:', altError)
        console.log('📝 SQL to execute manually in Supabase dashboard:')
        console.log(sql)
      } else {
        console.log('✅ Function created successfully via alternative approach!')
      }

      return
    }

    console.log('✅ Function created successfully!')
    console.log('🧪 Testing the function...')

    // Test the function
    const { data: testData, error: testError } = await supabase.rpc('validate_alignment_code', {
      p_code: 'PILOT-PARTNERS'
    })

    if (testError) {
      console.error('❌ Test failed:', testError)
    } else {
      console.log('✅ Test successful:', testData)
    }

  } catch (error) {
    console.error('💥 Script error:', error)
    console.log('📝 Manual SQL to copy-paste into Supabase dashboard:')

    const manualSql = `
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
    `

    console.log(manualSql)
  }
}

createValidationFunction()
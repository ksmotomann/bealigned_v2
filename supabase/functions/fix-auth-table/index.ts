import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting auth.users table fix...')

    // First, try to drop the column using raw SQL
    const { data: dropResult, error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `ALTER TABLE auth.users DROP COLUMN IF EXISTS is_super_admin;`
    })

    if (dropError) {
      console.error('Direct drop failed:', dropError)
      
      // Try alternative approach - use a function with SECURITY DEFINER
      const { data: funcResult, error: funcError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION fix_auth_users_table()
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = auth, public
          AS $$
          BEGIN
            -- Try to drop the column
            EXECUTE 'ALTER TABLE auth.users DROP COLUMN IF EXISTS is_super_admin';
          EXCEPTION
            WHEN insufficient_privilege THEN
              RAISE NOTICE 'Insufficient privileges to modify auth.users';
            WHEN OTHERS THEN
              RAISE NOTICE 'Error: %', SQLERRM;
          END;
          $$;
          
          SELECT fix_auth_users_table();
        `
      })

      if (funcError) {
        console.error('Function approach failed:', funcError)
      }
    }

    // Check if column still exists
    const { data: checkData, error: checkError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql_query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'auth' 
          AND table_name = 'users' 
          AND column_name = 'is_super_admin';
        `
      })

    if (checkError) {
      throw checkError
    }

    const columnStillExists = checkData && checkData.length > 0

    if (!columnStillExists) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Successfully removed is_super_admin column from auth.users!'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else {
      // If we still can't remove it, try to at least null out the values
      const { error: nullError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `UPDATE auth.users SET is_super_admin = NULL WHERE is_super_admin IS NOT NULL;`
      })

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Could not remove column, but attempted to null values',
          columnStillExists: true,
          nullError: nullError?.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
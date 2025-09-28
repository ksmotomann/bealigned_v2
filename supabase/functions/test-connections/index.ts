// Simple test function to validate database and OpenAI connections
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // Test 1: Check environment variables
  results.tests.env_vars = {
    OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ? 'Present' : 'Missing',
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'Present' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Present' : 'Missing',
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'Present' : 'Missing'
  }

  // Test 2: Database connection
  try {
    const { data: phaseData, error: dbError } = await supabase
      .from('phase_prompts')
      .select('id, title, order')
      .eq('order', 1)
      .single()

    results.tests.database = {
      status: dbError ? 'Failed' : 'Success',
      error: dbError?.message,
      data_found: phaseData ? true : false,
      phase_title: phaseData?.title
    }
  } catch (error) {
    results.tests.database = {
      status: 'Error',
      error: error.message
    }
  }

  // Test 3: OpenAI API connection
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: 'Test message - respond with just "API working"' }
        ],
        max_tokens: 10
      })
    })

    if (openaiResponse.ok) {
      const openaiData = await openaiResponse.json()
      results.tests.openai = {
        status: 'Success',
        response: openaiData.choices[0]?.message?.content || 'No response content'
      }
    } else {
      const errorText = await openaiResponse.text()
      results.tests.openai = {
        status: 'Failed',
        http_status: openaiResponse.status,
        error: errorText
      }
    }
  } catch (error) {
    results.tests.openai = {
      status: 'Error',
      error: error.message
    }
  }

  return new Response(
    JSON.stringify(results, null, 2),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
})
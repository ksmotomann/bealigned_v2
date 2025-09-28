import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { action, successUrl, cancelUrl, amount, description, customer_email } = await req.json()

    if (action === 'create-payment-intent') {
      // Validate required parameters
      if (!amount || !description) {
        throw new Error('Amount and description are required for payment intent')
      }

      // Check if user already has a Stripe customer ID
      const { data: existingCustomer } = await supabaseClient
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      let customerId = existingCustomer?.stripe_customer_id

      // Create customer if they don't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        customerId = customer.id

        // Store customer ID in profiles
        await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount should already be in cents
        currency: 'usd',
        customer: customerId,
        description: description,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          supabase_user_id: user.id,
        },
      })

      return new Response(
        JSON.stringify({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (action === 'create-checkout-session') {
      // Get user's trial status
      const { data: trialStatus } = await supabaseClient.rpc('get_user_trial_status', {
        p_user_id: user.id
      })

      if (!trialStatus || trialStatus.length === 0) {
        throw new Error('No active trial found for user')
      }

      const trial = trialStatus[0]

      // Determine pricing based on trial status
      const isTrialUser = trial.is_trial_active
      const price = isTrialUser ? 4995 : 7995 // $49.95 vs $79.95 in cents
      const description = isTrialUser
        ? 'BeAligned Premium - Trial Conversion ($49.95/year)'
        : 'BeAligned Premium - Regular Pricing ($79.95/year)'

      // Check if user already has a Stripe customer ID
      const { data: existingCustomer } = await supabaseClient
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      let customerId = existingCustomer?.stripe_customer_id

      // Create customer if they don't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
            alignment_code: trial.code,
            trial_conversion: isTrialUser.toString(),
          },
        })
        customerId = customer.id

        // Store customer ID in profiles
        await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'BeAligned Premium',
                description: description,
              },
              unit_amount: price,
              recurring: {
                interval: 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.get('origin')}/`,
        metadata: {
          supabase_user_id: user.id,
          alignment_code: trial.code,
          original_price: isTrialUser ? '49.95' : '79.95',
          trial_conversion: isTrialUser.toString(),
        },
      })

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (action === 'get-trial-status') {
      const { data: trialStatus } = await supabaseClient.rpc('get_user_trial_status', {
        p_user_id: user.id
      })

      return new Response(
        JSON.stringify({
          trialStatus: trialStatus && trialStatus.length > 0 ? trialStatus[0] : null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (action === 'verify-payment') {
      const { session_id } = await req.json()

      if (!session_id) {
        throw new Error('Session ID is required for payment verification')
      }

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id)

      if (session.payment_status === 'paid' && session.metadata?.supabase_user_id === user.id) {
        // Payment successful and belongs to this user
        // You could also update subscription status in database here if needed

        return new Response(
          JSON.stringify({
            status: 'success',
            session: {
              id: session.id,
              payment_status: session.payment_status,
              customer_email: session.customer_details?.email
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else {
        throw new Error('Payment verification failed')
      }
    }

    throw new Error('Invalid action specified')
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
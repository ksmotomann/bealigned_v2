import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { nanoid } from 'https://esm.sh/nanoid@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.user_type)) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p && p !== 'invites')

    // GET /invites - Get all invites
    if (req.method === 'GET' && pathParts.length === 0) {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /invites/create - Create new invite
    if (req.method === 'POST' && pathParts[0] === 'create') {
      const { 
        email, 
        first_name, 
        last_name, 
        organization, 
        message,
        max_uses = 1,
        expires_in_days = 7
      } = await req.json()

      // Generate unique invite code
      const invite_code = nanoid(10)
      
      // Calculate expiration date
      const expires_at = new Date()
      expires_at.setDate(expires_at.getDate() + expires_in_days)

      // Create invite in database
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .insert({
          invite_code,
          email,
          first_name,
          last_name,
          organization,
          message,
          max_uses,
          expires_at: expires_at.toISOString(),
          created_by: user.id,
          status: 'pending'
        })
        .select()
        .single()

      if (inviteError) throw inviteError

      // Send invitation email if Resend is configured
      if (resendApiKey) {
        const inviteUrl = `${url.origin}/auth?invite=${invite_code}`
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">You're Invited to BeAligned!</h2>
            ${first_name ? `<p>Hi ${first_name},</p>` : ''}
            <p>${message || 'You have been invited to join BeAligned, a co-parenting support platform.'}</p>
            
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy this link: ${inviteUrl}
            </p>
            
            <p style="color: #666; font-size: 14px;">
              This invitation expires in ${expires_in_days} days and can be used ${max_uses} time(s).
            </p>
            
            <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              BeAligned™ Beta Lite
            </p>
          </div>
        `

        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'BeAligned <invites@bealigned.app>',
              to: email,
              subject: 'You\'re Invited to BeAligned!',
              html: emailHtml,
            })
          })

          if (emailResponse.ok) {
            // Update invite status to sent
            await supabase
              .from('invites')
              .update({ 
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', invite.id)
          }
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError)
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        invite,
        invite_url: `${url.origin}/auth?invite=${invite_code}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /invites/:id/resend - Resend invitation email
    if (req.method === 'PUT' && pathParts.length === 2 && pathParts[1] === 'resend') {
      const inviteId = pathParts[0]
      
      const { data: invite, error } = await supabase
        .from('invites')
        .select('*')
        .eq('id', inviteId)
        .single()

      if (error || !invite) {
        return new Response(JSON.stringify({ error: 'Invite not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Send email logic here (similar to create)
      // Update sent_at timestamp
      await supabase
        .from('invites')
        .update({ 
          sent_at: new Date().toISOString(),
          status: 'sent'
        })
        .eq('id', inviteId)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /invites/:id - Cancel/delete invite
    if (req.method === 'DELETE' && pathParts.length === 1) {
      const inviteId = pathParts[0]
      
      const { error } = await supabase
        .from('invites')
        .update({ status: 'cancelled' })
        .eq('id', inviteId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /invites/validate/:code - Validate invite code (public endpoint)
    if (req.method === 'GET' && pathParts[0] === 'validate' && pathParts[1]) {
      const invite_code = pathParts[1]
      
      const { data: invite, error } = await supabase
        .from('invites')
        .select('*')
        .eq('invite_code', invite_code)
        .eq('status', 'sent')
        .single()

      if (error || !invite) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired invitation code' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        await supabase
          .from('invites')
          .update({ status: 'expired' })
          .eq('id', invite.id)
        
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'This invitation has expired' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check usage limit
      if (invite.uses_count >= invite.max_uses) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'This invitation has reached its usage limit' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ 
        valid: true, 
        invite: {
          email: invite.email,
          first_name: invite.first_name,
          last_name: invite.last_name,
          organization: invite.organization
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Invites function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
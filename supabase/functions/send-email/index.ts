import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request - handle both formats
    const requestData = await req.json()
    
    // Handle FloatingAI component format
    let emailData: EmailRequest
    if (requestData.recipientEmail) {
      // Format from FloatingAI component
      const { recipientEmail, subject, content, conversationHistory } = requestData
      
      // Format the email HTML from conversation history
      let emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">BeAligned AI Assistant Conversation</h2>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
      `

      if (conversationHistory && Array.isArray(conversationHistory)) {
        emailHtml += '<div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px;">'
        conversationHistory.forEach((msg: any) => {
          const isUser = msg.response?.startsWith('**You asked:**')
          emailHtml += `
            <div style="margin-bottom: 15px;">
              <strong style="color: ${isUser ? '#059669' : '#4F46E5'}">
                ${isUser ? 'You' : 'AI Assistant'}:
              </strong>
              <p style="margin: 5px 0; color: #374151;">
                ${msg.response?.replace('**You asked:** ', '')}
              </p>
            </div>
          `
        })
        emailHtml += '</div>'
      } else if (content) {
        emailHtml += `
          <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px;">
            <p style="color: #374151;">${content}</p>
          </div>
        `
      }

      emailHtml += `
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
          <p style="color: #9CA3AF; font-size: 14px;">
            This email was sent from BeAligned™ Beta Lite
          </p>
        </div>
      `
      
      emailData = {
        to: recipientEmail,
        subject: subject || 'BeAligned AI Assistant Conversation',
        html: emailHtml
      }
    } else {
      // Standard format
      emailData = requestData as EmailRequest
    }
    
    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailData.from || 'BeAligned <noreply@bealigned.app>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        reply_to: emailData.replyTo || 'support@bealigned.app',
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const result = await resendResponse.json()
    
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
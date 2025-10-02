import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing transcript request...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { conversationId, recipientEmail, userId } = await req.json()
    
    console.log('Request data:', { conversationId, recipientEmail, userId })

    // Get conversation with messages
    console.log('Fetching conversation...')
    
    // First, just get the conversation by ID
    const { data: conversations, error: convError } = await supabaseClient
      .from('conversations')
      .select('*, messages(*)')
      .eq('id', conversationId)
    
    if (convError) {
      console.error('Error fetching conversation:', convError)
      throw new Error(`Failed to fetch conversation: ${convError.message}`)
    }
    
    if (!conversations || conversations.length === 0) {
      throw new Error('Conversation not found')
    }
    
    const conversation = conversations[0]
    
    // Verify the conversation belongs to the user
    if (conversation.user_id !== userId) {
      console.error('User ID mismatch:', { conversation_user_id: conversation.user_id, provided_user_id: userId })
      throw new Error('Unauthorized: Conversation does not belong to this user')
    }
    
    console.log('Conversation found:', conversation.title)

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single()

    const userName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`.trim()
      : 'User'

    // Sort messages
    const messages = conversation.messages?.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) || []

    // Generate HTML content
    const htmlContent = generateHtmlTranscript(messages, conversation.title || 'BeAligned Conversation', userName)

    // Use Resend API (you can also use SendGrid or any other service)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      // Fallback: Log the email request
      console.log('Email service not configured. Would send to:', recipientEmail)
      
      // You could also save to a queue table for later processing
      await supabaseClient
        .from('email_queue')
        .insert({
          to: recipientEmail,
          subject: `BeAligned Transcript: ${conversation.title}`,
          html: htmlContent,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      
      return new Response(
        JSON.stringify({ 
          message: 'Email queued for sending',
          queued: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send via Resend
    // Note: You need to verify your domain in Resend or use onboarding@resend.dev for testing
    console.log('Sending email via Resend to:', recipientEmail)
    
    // Use Resend's onboarding email until domain is verified
    // Once bealigned.app is verified in Resend, change back to 'BeAligned <noreply@bealigned.app>'
    const emailPayload = {
      from: 'BeAligned <noreply@bealigned.app>',
      to: [recipientEmail],
      subject: `Your BeAligned Transcript: ${conversation.title || 'Conversation'}`,
      html: htmlContent,
    }
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    })

    const data = await res.json()
    
    if (!res.ok) {
      console.error('Resend API error:', data)
      throw new Error(`Resend API error: ${JSON.stringify(data)}`)
    }
    
    console.log('Email sent successfully:', data.id)

    // Skip system_events logging for now (table doesn't exist)
    // TODO: Create system_events table for audit logging

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateHtmlTranscript(messages: any[], title: string, userName: string): string {
  const messagesHtml = messages.map(msg => {
    const timestamp = new Date(msg.created_at).toLocaleString()
    const role = msg.role === 'assistant' ? 'BeAligned' : userName
    const bgColor = msg.role === 'assistant' ? '#f0f9ff' : '#f9fafb'
    
    return `
      <div style="margin-bottom: 20px; padding: 15px; background-color: ${bgColor}; border-radius: 8px;">
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${timestamp}</div>
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">${role}:</div>
        <div style="color: #374151; line-height: 1.6;">${msg.content.replace(/\n/g, '<br>')}</div>
      </div>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BeAligned Transcript</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px;">BeAligned Transcript</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Your reflection session summary</p>
  </div>
  
  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
      <p style="margin: 5px 0;"><strong>Title:</strong> ${title}</p>
      <p style="margin: 5px 0;"><strong>User:</strong> ${userName}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 20px;">Conversation</h2>
    ${messagesHtml}
  </div>
  
  <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center; color: #6b7280; font-size: 14px;">
    <p>This transcript was generated from your BeAligned session.</p>
    <p>Visit <a href="https://bealigned.app" style="color: #667eea;">bealigned.app</a> to continue your journey.</p>
  </div>
</body>
</html>
  `
}
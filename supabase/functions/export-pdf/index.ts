import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  sessionId: string
  format?: 'pdf' | 'html'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { sessionId, format = 'pdf' } = await req.json() as ExportRequest

    // Fetch session data
    const { data: session, error: sessionError } = await supabaseClient
      .from('reflection_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('owner_id', user.id)
      .single()

    if (sessionError) {
      console.error('Session fetch error:', sessionError)
      throw new Error(`Session not found: ${sessionError.message}`)
    }

    if (!session) {
      throw new Error('Session not found')
    }

    // Fetch reflection messages separately
    const { data: chatMessages, error: messagesError } = await supabaseClient
      .from('reflection_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Messages fetch error:', messagesError)
      throw new Error(`Messages not found: ${messagesError.message}`)
    }

    // Add messages to session object
    session.chat_messages = chatMessages || []

    // Fetch user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    if (format === 'pdf') {
      const pdfBytes = await generatePDF(session, profile)
      
      // Generate filename matching sample format: BeAligned_Chat__2025-08-30_22-58-17_476203a0.pdf
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
      const sessionShort = sessionId.split('-')[0] // First part of UUID
      const filename = `BeAligned_Chat__${dateStr}_${timeStr}_${sessionShort}.pdf`
      
      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        status: 200,
      })
    } else {
      const html = generateHTML(session, profile)
      
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
        status: 200,
      })
    }
  } catch (error) {
    console.error('Export PDF error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        name: error.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function generatePDF(session: any, profile: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  let currentPage = pdfDoc.addPage([595, 842]) // A4 size
  const { width, height } = currentPage.getSize()
  
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  // BeAligned brand colors matching the chat UI
  const beAlignedBlue = rgb(0.365, 0.765, 0.918) // #5EC3EA - User message bubbles
  const userBlueBorder = rgb(0.310, 0.682, 0.820) // #4FAED1 - User bubble border
  const assistantWhite = rgb(1, 1, 1) // #FFFFFF - Assistant message bubbles
  const assistantBorder = rgb(0.898, 0.906, 0.922) // #E5E7EB - Assistant bubble border
  const assistantText = rgb(0.122, 0.161, 0.216) // #1F2937 - Assistant text
  const userText = rgb(1, 1, 1) // #FFFFFF - User text
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.96, 0.96, 0.96) // Background
  
  let yPosition = height - 50
  let pageNumber = 1

  // Helper function to add new page when needed
  const checkAndAddNewPage = (spaceNeeded: number) => {
    if (yPosition - spaceNeeded < 60) { // Leave space for footer
      // Add footer to current page (we'll fix page numbers at the end)
      currentPage.drawText('BeAligned™ - Confidential', {
        x: 50,
        y: 30,
        size: 10,
        font,
        color: gray,
      })
      
      // Create new page
      currentPage = pdfDoc.addPage([595, 842])
      yPosition = height - 50
      pageNumber++
      return true
    }
    return false
  }

  // Header section - matching sample format exactly
  currentPage.drawText('BeAligned™ Chat Transcript', {
    x: 50,
    y: yPosition,
    size: 24,
    font: titleFont,
    color: black,
  })
  
  yPosition -= 40

  // Session Details section
  currentPage.drawText('Session Details', {
    x: 50,
    y: yPosition,
    size: 16,
    font: titleFont,
    color: black,
  })
  
  yPosition -= 25
  
  const sessionTitle = sanitizeTextForPDF(session.title || 'BeAligned Chat Session')
  const userEmail = sanitizeTextForPDF(profile?.email || 'user@example.com')
  const startedDate = new Date(session.created_at)
  const lastActivity = session.updated_at ? new Date(session.updated_at) : startedDate
  const messageCount = session.chat_messages?.length || 0
  const conversationId = session.id
  const generatedDate = new Date()
  
  const sessionDetails = [
    `Title: ${sessionTitle}`,
    `User: (${userEmail})`,
    `Started: ${startedDate.toLocaleDateString('en-US')}, ${startedDate.toLocaleTimeString('en-US')}`,
    `Last Activity: ${lastActivity.toLocaleDateString('en-US')}, ${lastActivity.toLocaleTimeString('en-US')}`,
    `Messages: ${messageCount}`,
    `Conversation ID: ${conversationId}`,
    `Generated: ${generatedDate.toLocaleDateString('en-US')}, ${generatedDate.toLocaleTimeString('en-US')}`
  ]
  
  sessionDetails.forEach(detail => {
    currentPage.drawText(detail, {
      x: 50,
      y: yPosition,
      size: 10,
      font,
      color: black,
    })
    yPosition -= 15
  })
  
  yPosition -= 20

  // Conversation section
  currentPage.drawText('Conversation', {
    x: 50,
    y: yPosition,
    size: 16,
    font: titleFont,
    color: black,
  })
  
  yPosition -= 35

  // Chat messages - matching sample format with color coding
  const messages = session.chat_messages || []
  const sortedMessages = messages.sort((a: any, b: any) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  sortedMessages.forEach((message: any) => {
    const messageTime = new Date(message.created_at)
    const timeString = messageTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const isUser = message.role === 'user'

    // Enhanced text processing - preserve emojis and markdown formatting
    const processedContent = enhanceTextForPDF(message.content)
    const lines = wrapText(processedContent, isUser ? 60 : 65) // Shorter lines for user bubbles

    // Calculate bubble dimensions
    const bubbleMargin = isUser ? 80 : 50 // User messages more indented
    const bubbleWidth = width - bubbleMargin - 50
    const bubblePadding = 12
    const lineHeight = 14
    const bubbleHeight = (lines.length * lineHeight) + (bubblePadding * 2)
    const totalSpaceNeeded = bubbleHeight + 35 // Include timestamp and spacing

    checkAndAddNewPage(totalSpaceNeeded)

    // Position bubble (user messages align right, assistant left)
    const bubbleX = isUser ? bubbleMargin : 50

    // Draw chat bubble with rounded rectangle effect
    if (isUser) {
      // User bubble - BeAligned blue with border
      currentPage.drawRectangle({
        x: bubbleX,
        y: yPosition - bubbleHeight + 5,
        width: bubbleWidth,
        height: bubbleHeight,
        color: beAlignedBlue,
        borderColor: userBlueBorder,
        borderWidth: 1,
      })

      // Add subtle shadow effect
      currentPage.drawRectangle({
        x: bubbleX + 2,
        y: yPosition - bubbleHeight + 3,
        width: bubbleWidth,
        height: bubbleHeight,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.2,
      })
    } else {
      // Assistant bubble - white with light border
      currentPage.drawRectangle({
        x: bubbleX,
        y: yPosition - bubbleHeight + 5,
        width: bubbleWidth,
        height: bubbleHeight,
        color: assistantWhite,
        borderColor: assistantBorder,
        borderWidth: 1,
      })

      // Add subtle shadow effect
      currentPage.drawRectangle({
        x: bubbleX + 2,
        y: yPosition - bubbleHeight + 3,
        width: bubbleWidth,
        height: bubbleHeight,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.3,
      })
    }

    // Message content inside bubble
    let lineY = yPosition - bubblePadding - 2
    lines.forEach(line => {
      currentPage.drawText(line, {
        x: bubbleX + bubblePadding,
        y: lineY,
        size: 11,
        font,
        color: isUser ? userText : assistantText,
      })
      lineY -= lineHeight
    })

    // Timestamp below bubble (subtle)
    yPosition -= bubbleHeight + 8
    const timestampX = isUser ? bubbleX + bubbleWidth - 60 : bubbleX
    currentPage.drawText(timeString, {
      x: timestampX,
      y: yPosition,
      size: 8,
      font,
      color: gray,
    })

    yPosition -= 25 // Space between messages
  })
  
  // Add final footer and fix page numbers on all pages
  const totalPages = pageNumber
  const pages = pdfDoc.getPages()
  
  pages.forEach((page, index) => {
    // Add confidential footer
    page.drawText('BeAligned™ - Confidential', {
      x: 50,
      y: 30,
      size: 10,
      font,
      color: gray,
    })
    
    // Add correct page numbers
    page.drawText(`Page ${index + 1} of ${totalPages}`, {
      x: width - 100,
      y: 30,
      size: 10,
      font,
      color: gray,
    })
  })

  return await pdfDoc.save()
}

// Enhanced text processing that preserves emojis and formatting
function enhanceTextForPDF(text: string): string {
  return text
    // Keep common BeAligned emojis as-is (they display well in PDFs)
    .replace(/🌿/g, '🌿')  // Nature emojis work well
    .replace(/🌊/g, '🌊')
    .replace(/🌱/g, '🌱')
    .replace(/💝/g, '💝')
    .replace(/🕊️/g, '🕊️')
    .replace(/🌼/g, '🌼')

    // Convert admin/technical emojis to readable symbols
    .replace(/✅/g, '✓')   // Checkmarks
    .replace(/❌/g, '✗')   // X marks
    .replace(/🎯/g, '•')   // Target
    .replace(/📝/g, '•')   // Memo
    .replace(/💡/g, '•')   // Light bulb
    .replace(/🔍/g, '•')   // Magnifying glass
    .replace(/⚠️/g, '!')   // Warning
    .replace(/🎉/g, '•')   // Party
    .replace(/🚀/g, '•')   // Rocket

    // Preserve markdown-style formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold (remove asterisks but keep emphasis)
    .replace(/\*(.*?)\*/g, '$1')      // Italic (remove asterisks)

    // Clean up any remaining problematic Unicode
    .replace(/\u2026/g, '...')        // Ellipsis
    .replace(/[""]/g, '"')            // Smart quotes
    .replace(/['']/g, "'")            // Smart apostrophes
    .replace(/🤔/g, ':-?')  // Thinking
    .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes
    .replace(/[\u2018\u2019]/g, "'")  // Smart quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/\u2026/g, '...')        // Ellipsis
    .replace(/[^\x00-\x7F]/g, '?')    // Any remaining non-ASCII characters
}

// Helper function to wrap text properly
function wrapText(text: string, maxChars: number): string[] {
  // Use enhanced text processing (already done by caller)
  const processedText = text
  
  // Split by existing line breaks first
  const paragraphs = processedText.split('\n')
  const lines: string[] = []
  
  paragraphs.forEach(paragraph => {
    if (paragraph.trim() === '') {
      lines.push('') // Preserve empty lines
      return
    }
    
    const words = paragraph.split(' ')
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      
      if (testLine.length <= maxChars) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          // Word is longer than maxChars, force break it
          while (word.length > maxChars) {
            lines.push(word.substring(0, maxChars))
            word = word.substring(maxChars)
          }
          currentLine = word
        }
      }
    })
    
    if (currentLine) {
      lines.push(currentLine)
    }
  })
  
  return lines
}

function generateHTML(session: any, profile: any): string {
  const stepData = session.step_data || {}
  const draftedMessage = session.drafted_messages?.[0]
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BeAligned Reflection - ${session.id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #7C3AED;
      border-bottom: 2px solid #7C3AED;
      padding-bottom: 10px;
    }
    h2 {
      color: #4B5563;
      margin-top: 30px;
    }
    .meta {
      background: #F9FAFB;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .step {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .step-number {
      display: inline-block;
      background: #7C3AED;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      text-align: center;
      line-height: 30px;
      margin-right: 10px;
    }
    .clear-message {
      background: #EDE9FE;
      border-left: 4px solid #7C3AED;
      padding: 20px;
      margin-top: 30px;
    }
    .clear-message h3 {
      color: #7C3AED;
      margin-top: 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>BeAligned Reflection Report</h1>
  
  <div class="meta">
    <p><strong>Name:</strong> ${profile?.first_name} ${profile?.last_name}</p>
    <p><strong>Email:</strong> ${profile?.email}</p>
    <p><strong>Date:</strong> ${new Date(session.created_at).toLocaleDateString()}</p>
    <p><strong>Status:</strong> ${session.status}</p>
  </div>
  
  <h2>Your Reflection Journey</h2>
  
  <div class="step">
    <h3><span class="step-number">1</span> Situation Description</h3>
    <p>${stepData.step1?.userInput || 'Not completed'}</p>
  </div>
  
  <div class="step">
    <h3><span class="step-number">2</span> Feelings Identified</h3>
    <p>${stepData.step2?.userInput || 'Not completed'}</p>
  </div>
  
  <div class="step">
    <h3><span class="step-number">3</span> Needs Uncovered</h3>
    <p>${stepData.step3?.userInput || 'Not completed'}</p>
  </div>
  
  <div class="step">
    <h3><span class="step-number">4</span> Other's Perspective</h3>
    <p>${stepData.step4?.userInput || 'Not completed'}</p>
  </div>
  
  <div class="step">
    <h3><span class="step-number">5</span> Common Ground</h3>
    <p>${stepData.step5?.userInput || 'Not completed'}</p>
  </div>
  
  <div class="step">
    <h3><span class="step-number">6</span> Solution Options</h3>
    <p>${stepData.step6?.userInput || 'Not completed'}</p>
  </div>
  
  <div class="step">
    <h3><span class="step-number">7</span> CLEAR Message Components</h3>
    <p>${stepData.step7?.userInput || 'Not completed'}</p>
  </div>
  
  ${draftedMessage ? `
  <div class="clear-message">
    <h3>Your Final CLEAR Message</h3>
    <pre style="white-space: pre-wrap; font-family: inherit;">${draftedMessage.content}</pre>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Generated by BeAligned • ${new Date().toLocaleDateString()}</p>
    <p>This document is confidential and for personal use only.</p>
  </div>
</body>
</html>
  `
}
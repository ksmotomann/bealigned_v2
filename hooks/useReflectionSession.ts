import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { checkPhaseCompletion, generateAIResponse } from '../lib/aiServiceKnowledgeBased'
import { getRandomWelcomePrompt, getAIGeneratedWelcome } from '../lib/welcomePrompts'
import { generateSimplePhase7Response, SimplePhase7Context } from '../lib/simplifiedPhase7'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    isGreeting?: boolean
    isPhaseHeader?: boolean
    phase?: number
  }
}

export interface ReflectionSession {
  id: string | null
  currentStep: number
  responses: Record<string, any>
  isComplete: boolean
  summary?: string
  threadId?: string | null
}

interface UseReflectionSessionReturn {
  session: ReflectionSession
  messages: Message[]
  sendMessage: (content: string) => Promise<void>
  startSession: () => Promise<void>
  createNewSession: () => Promise<void>
  startNewSession: () => Promise<void>
  resetSession: () => void
  updateMessages: (updater: (prevMessages: Message[]) => Message[]) => void
  loading: boolean
  error: string | null
  isTyping: boolean
  isPhaseTransitioning: boolean
}

interface UseReflectionSessionOptions {
  onSessionUpdated?: (sessionId: string, updates: any) => void
}

export function useReflectionSession(
  sessionId?: string | null,
  options?: UseReflectionSessionOptions,
  phases?: any[]
): UseReflectionSessionReturn {
  const [session, setSession] = useState<ReflectionSession>({
    id: null,
    currentStep: 1,
    responses: {},
    isComplete: false,
    threadId: null
  })
  
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  // Check if user is admin on mount
  useEffect(() => {
    checkAdminStatus()
  }, [])

  // Load or create session when sessionId changes (including initial mount)
  useEffect(() => {
    if (sessionId) {
      loadSpecificSession(sessionId)
    } else {
      // If no specific session selected, load the default (most recent)
      loadOrCreateSession()
    }
  }, [sessionId])

  const loadOrCreateSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check for existing incomplete session
      const { data: existingSessions } = await supabase
        .from('reflection_sessions')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)

      if (existingSessions && existingSessions.length > 0) {
        // Load existing session
        const existingSession = existingSessions[0]
        setSession({
          id: existingSession.id,
          currentStep: existingSession.current_step || 1,
          responses: existingSession.step_data || {},
          isComplete: existingSession.status === 'completed',
          threadId: existingSession.thread_id || null
        })
        
        // Load messages for this session
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', existingSession.id)
          .order('created_at', { ascending: true })
        
        if (messages) {
          setMessages(messages.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at),
            metadata: m.metadata
          })))
        }
      } else {
        // Start new session automatically
        await startSession()
      }
    } catch (error) {
      console.error('Error loading session:', error)
    }
  }

  const loadSpecificSession = async (specificSessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load the specific session
      const { data: sessionData } = await supabase
        .from('reflection_sessions')
        .select('*')
        .eq('id', specificSessionId)
        .eq('owner_id', user.id)
        .single()

      if (sessionData) {
        setSession({
          id: sessionData.id,
          currentStep: sessionData.current_step || 1,
          responses: sessionData.step_data || {},
          isComplete: sessionData.status === 'completed',
          threadId: sessionData.thread_id || null
        })
        
        // Load messages for this specific session
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', specificSessionId)
          .order('created_at', { ascending: true })
        
        if (messages) {
          setMessages(messages.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at),
            metadata: m.metadata
          })))
        } else {
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error loading specific session:', error)
    }
  }

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setIsAdmin(data?.role === 'admin')
      } catch (error) {
        // If profiles table doesn't exist or user doesn't have access, assume not admin
        console.log('Admin check failed, assuming non-admin user')
        setIsAdmin(false)
      }
    }
  }

  const resetSession = useCallback(() => {
    setSession({
      id: null,
      currentStep: 1,
      responses: {},
      isComplete: false,
      threadId: null
    })
    setMessages([])
    setError(null)
  }, [])

  const startSession = async () => {
    // Prevent duplicate session creation
    if (isCreatingSession) {
      console.log('🚫 Session creation already in progress, skipping...')
      return
    }

    try {
      setIsCreatingSession(true)
      setLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in to start a session')
      
      // Create new session in database
      const { data, error: sessionError } = await supabase
        .from('reflection_sessions')
        .insert({
          owner_id: user.id,
          current_step: 1,
          step_data: {},
          status: 'in_progress'
        })
        .select()
        .single()
      
      if (sessionError) throw sessionError
      
      setSession({
        id: data.id,
        currentStep: 1,
        responses: {},
        isComplete: false,
        threadId: null
      })
      
      // Generate natural Phase 1 greeting using enhanced BeH2O-powered welcome system
      console.log('🎯 Using enhanced BeH2O welcome system...')

      // Try AI-generated welcome with BeH2O methodology first
      let greetingContent
      try {
        greetingContent = await getAIGeneratedWelcome()
        console.log('✅ AI welcome generation succeeded:', greetingContent?.substring(0, 100))
      } catch (welcomeError) {
        console.warn('⚠️ AI welcome generation failed, using fallback:', welcomeError)
        greetingContent = getRandomWelcomePrompt()
        console.log('✅ Using fallback welcome:', greetingContent?.substring(0, 100))
      }

      console.log('🔍 DEBUG: Enhanced welcome content =', greetingContent)
      const phase1 = phases?.[0] || { title: "PHASE 1: LET'S NAME IT" } // Database-driven fallback
      console.log('🔍 DEBUG: Phase 1 title =', phase1.title)

      // Check if this is actually AI-generated or a static fallback
      // Static welcome patterns from the welcome prompts file
      const staticWelcomePatterns = [
        "You made it here—that's something",
        "You showed up—that's already progress",
        "Some days feel like too much",
        "Being here isn't about having all the answers",
        "Sometimes the hardest part is slowing down",
        "This is your pause button",
        "You don't need to fix everything at once",
        "Have at me. Bring the mess",
        "Lay it on me",
        "Hit me with it",
        "This space isn't about judgment",
        "Carrying a heavy load today",
        "I'm not here to hand you answers",
        "Let's take a moment to explore what's on your mind" // Emergency fallback
      ]

      const isStaticFallback = greetingContent ? (staticWelcomePatterns.some(pattern =>
        greetingContent.includes(pattern)
      ) || greetingContent.length < 30) : true

      const responseType = isStaticFallback ? 'fallback' : 'ai_vector'

      console.log('🔍 Welcome message analysis:', {
        greetingContent: greetingContent ? greetingContent.substring(0, 50) + '...' : 'undefined',
        isStaticFallback,
        responseType,
        matchedPattern: greetingContent ? staticWelcomePatterns.find(pattern => greetingContent.includes(pattern)) : 'none'
      })

      const phase1Message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**${phase1.title}**\n\n${greetingContent || "It's great that you're here. What's the situation on your mind that you'd like to delve into today?"}`,
        timestamp: new Date(),
        metadata: {
          isPhaseHeader: true,
          phase: 1,
          functionUsed: 'chat',
          isInitialGreeting: true,
          responseType // 🟢 AI-generated or 🔴 fallback
        }
      }
      console.log('🔍 DEBUG: Final greeting message with response type:', responseType)
      console.log('🔍 DEBUG: Final greeting content =', phase1Message.content)

      setMessages([phase1Message])
      await saveMessage(data.id, phase1Message)
      
      // Notify parent component to add new session to local history immediately
      if (options?.onSessionUpdated) {
        options.onSessionUpdated(data.id, {
          id: data.id,
          title: 'New Reflection',
          status: 'in_progress',
          created_at: data.created_at,
          current_step: 1
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setIsCreatingSession(false)
    }
  }

  const getPhaseQuestion = (phase: number): string | null => {
    const phaseQuestions = {
      2: "What feelings come up when you think about this? Sometimes anger masks hurt, or control masks fear. What might be underneath that for you?",
      3: "What is it about this that feels important to you? What are you hoping for — for your child, for yourself, or for the relationship?",
      4: "If your co-parent described this, how might they see it? What do you imagine they're feeling or needing?",
      5: "What might your child be noticing? How might they be feeling? What might they need right now?",
      6: null, // Phase 6 is adaptive - AI handles both open-ended questions and structured options directly
      7: "Would you like help crafting a message that reflects this shared purpose — either for yourself, your child, or your co-parent?"
    }
    return phaseQuestions[phase] || null
  }

  const saveMessage = async (sessionId: string, message: Message) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          owner_id: user.id,
          role: message.role,
          content: message.content,
          metadata: message.metadata || {}
        })

      if (error) {
        console.error('❌ Failed to save message to database:', error)
        console.error('   Session ID:', sessionId)
        console.error('   Message role:', message.role)
        console.error('   Content length:', String(message.content).length)
        console.error('   User ID:', user.id)
      } else {
        console.log('✅ Message saved to database successfully')
      }
    } catch (err) {
      console.error('❌ Database error when saving message:', err)
    }
  }

  // Generate a dynamic session title based on user input
  const generateSessionTitle = (userInput: string, currentStep: number): string => {
    const cleanInput = userInput.trim()
    
    // Extract key phrases or topics from the user's input
    if (cleanInput.length < 10) return 'New Reflection'
    
    // For Phase 1, use the main issue/situation
    if (currentStep === 1) {
      const lowerInput = cleanInput.toLowerCase()
      
      // Look for emotional patterns first
      if (lowerInput.includes('feeling') || lowerInput.includes('feel')) {
        // Extract "feeling X" or "feel X" patterns
        const feelingMatch = lowerInput.match(/feel(?:ing)?\s+(\w+)/i)
        if (feelingMatch) {
          const emotion = feelingMatch[1]
          return `Feeling ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`
        }
      }
      
      // Look for common emotional words and create descriptive titles
      const emotionalWords = {
        grateful: 'Feeling Grateful',
        angry: 'Dealing With Anger', 
        frustrated: 'Feeling Frustrated',
        sad: 'Feeling Sad',
        hurt: 'Feeling Hurt',
        worried: 'Feeling Worried',
        anxious: 'Feeling Anxious',
        overwhelmed: 'Feeling Overwhelmed',
        disappointed: 'Feeling Disappointed',
        confused: 'Feeling Confused',
        stressed: 'Feeling Stressed',
        upset: 'Feeling Upset'
      }
      
      for (const [word, title] of Object.entries(emotionalWords)) {
        if (lowerInput.includes(word)) {
          return title
        }
      }
      
      // Look for relationship patterns
      if (lowerInput.includes('husband') || lowerInput.includes('wife') || lowerInput.includes('spouse')) {
        return 'Relationship Issue'
      }
      if (lowerInput.includes('child') || lowerInput.includes('kid') || lowerInput.includes('daughter') || lowerInput.includes('son')) {
        return 'Parenting Issue'
      }
      if (lowerInput.includes('work') || lowerInput.includes('job') || lowerInput.includes('boss')) {
        return 'Work Issue'
      }
      if (lowerInput.includes('money') || lowerInput.includes('financial')) {
        return 'Financial Issue'
      }
      
      // Fallback: take first meaningful phrase (up to 25 characters)
      const sentences = cleanInput.split(/[.!?]/)
      const firstSentence = sentences[0].trim()
      if (firstSentence.length <= 25) {
        return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1)
      } else {
        return firstSentence.substring(0, 22) + '...'
      }
    }
    
    // For other phases, keep the title shorter and more general
    if (cleanInput.length > 30) {
      return cleanInput.substring(0, 27) + '...'
    }
    
    return cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1)
  }

  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      await supabase
        .from('reflection_sessions')
        .update({ title })
        .eq('id', sessionId)
      
      console.log(`Session title updated to: "${title}"`)
      
      // Update local session history to avoid flashing
      if (options?.onSessionUpdated) {
        options.onSessionUpdated(sessionId, { title })
      }
    } catch (error) {
      console.error('Error updating session title:', error)
    }
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!session.id) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    await saveMessage(session.id!, userMessage)

    // Show typing indicator and process message
    setIsTyping(true)
    try {
      await processUserInput(content, updatedMessages)
    } finally {
      setIsTyping(false)
    }
  }, [session, messages])

  const processUserInput = async (input: string, currentMessages?: Message[]) => {
    console.log('🚀 PROCESSING USER INPUT [CODE VERSION: 2.0 - FIXED]:', {
      input: input.substring(0, 50),
      currentStep: session.currentStep,
      sessionId: session.id
    })
    
    // Update session responses
    const updatedResponses = { ...session.responses }
    const stepKey = `step${session.currentStep}`
    
    if (!updatedResponses[stepKey]) {
      updatedResponses[stepKey] = {}
    }
    
    updatedResponses[stepKey].userInput = input

    // Update session title based on user input (especially for Phase 1)
    if (session.currentStep === 1 && input.trim().length > 10) {
      const sessionTitle = generateSessionTitle(input, session.currentStep)
      await updateSessionTitle(session.id!, sessionTitle)
    }

    // Build conversation history EXCLUDING the current user input (which is sent separately)
    const messagesToUse = currentMessages || messages
    const conversationHistory = messagesToUse
      .filter(msg => !msg.metadata?.isPhaseHeader) // Don't include phase headers
      .filter(msg => !msg.metadata?.isGreeting) // Don't include greeting messages
      .filter(msg => msg.content !== input) // Don't include current user input (sent separately)
      .map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        metadata: msg.metadata // ✅ CRITICAL: Include metadata for phase advancement
      }))
    
    console.log('📊 CONVERSATION HISTORY DEBUG:', {
      oldMessagesLength: messages.length,
      currentMessagesLength: messagesToUse.length,
      conversationHistoryLength: conversationHistory.length,
      lastMessage: (() => {
        const lastMsg = conversationHistory[conversationHistory.length - 1]?.content
        return typeof lastMsg === 'object'
          ? (lastMsg.summary?.substring(0, 50) || JSON.stringify(lastMsg).substring(0, 50))
          : (lastMsg ? lastMsg.substring(0, 50) + '...' : 'empty')
      })(),
      filteredOutPhaseHeaders: messagesToUse.filter(msg => msg.metadata?.isPhaseHeader).length,
      filteredOutGreetings: messagesToUse.filter(msg => msg.metadata?.isGreeting).length,
      filteredOutCurrentInput: messagesToUse.filter(msg => msg.content === input).length,
      allOriginalMessages: messagesToUse.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content.substring(0, 40) + '...' : 'non-string',
        isPhaseHeader: msg.metadata?.isPhaseHeader,
        isGreeting: msg.metadata?.isGreeting,
        matchesInput: msg.content === input
      })),
      finalConversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'object'
          ? (msg.content.summary?.substring(0, 30) || JSON.stringify(msg.content).substring(0, 30))
          : (msg.content ? msg.content.substring(0, 30) + '...' : 'empty')
      }))
    })

    // Show typing indicator
    setIsTyping(true)

    try {
      console.log('🤖 GENERATING AI RESPONSE using Enhanced Vector Assistant...')
      console.log('📤 Request payload:', {
        userInput: input,
        currentPhase: session.currentStep,
        conversationHistory: conversationHistory
      })

      // Log last AI response metadata to verify it's being sent
      const lastAIMsg = conversationHistory.filter(m => m.role === 'assistant').slice(-1)[0]
      console.log('🔍 Last AI message metadata being sent:', lastAIMsg?.metadata)
      console.log('🔍 next_recommended_phase in last AI metadata:', lastAIMsg?.metadata?.next_recommended_phase)
      
      // COMMENTED OUT: Old Fast Assistant that was bypassing our enhanced prompts
      // Vector-based AI with knowledge retrieval (primary model)
      // Using default preferences since we're sending simplified requests
      const userPreferences = { showPhasePrompts: false, autoAdvanceSteps: true }

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          userInput: input,
          currentPhase: session.currentStep,
          conversationHistory: [], // TEMPORARY: Force empty to test phase advancement
          sessionContext: {},
          sessionId: session.id
        }
      })
      console.log('📥 Function response - data:', data, 'error:', error)
      console.log('🔍 DEBUG: data.response =', data?.response)
      console.log('🔍 DEBUG: data.content =', data?.content)
      console.log('🔍 DEBUG: data.currentPhase =', data?.currentPhase)
      console.log('🔍 DEBUG: data.phase =', data?.phase)
      console.log('🔍 DEBUG: typeof data =', typeof data)
      console.log('🔍 DEBUG: data keys =', data ? Object.keys(data) : 'no data')

      if (error) {
        console.error('❌ Assistant API Error:', error)
        console.error('❌ Error details:', error.details || error.message || error)
        console.error('❌ Error context:', error.context)
        
        // Try to get the actual error response from the function
        let detailedError = 'Unknown function error'
        
        if (error.context && error.context.body) {
          try {
            // Try to read the response body to get our detailed error
            const responseText = await error.context.text()
            console.error('❌ Response body:', responseText)
            
            const responseData = JSON.parse(responseText)
            if (responseData.error) {
              detailedError = `${responseData.error} (${responseData.name || 'Unknown'})`
              if (responseData.stack) {
                console.error('❌ Function stack trace:', responseData.stack)
              }
            }
          } catch (parseError) {
            console.error('❌ Could not parse error response:', parseError)
            detailedError = `HTTP ${error.context.status}: ${error.context.statusText}`
          }
        } else {
          detailedError = error.message || error.details || 'Function returned non-2xx status'
        }
        
        throw new Error(`Function Error: ${detailedError}`)
      }
      
      console.log('✅ Assistant Response:', data)
      
      // Update thread ID for future messages
      if (data.threadId && !session.threadId) {
        setSession(prev => ({ ...prev, threadId: data.threadId }))
        
        // Save threadId to database (gracefully handle if table doesn't exist)
        try {
          await supabase
            .from('reflection_sessions')
            .update({ thread_id: data.threadId })
            .eq('id', session.id)
        } catch (dbError) {
          console.warn('⚠️ reflection_sessions table not found (skipping database update):', dbError)
        }
      }
      
      // Handle structured JSON response from new chat function
      const aiContent = data.content || data.response
      const phaseAdvanced = data.phase_advanced || false
      const nextPhase = data.next_phase || data.current_phase || session.currentStep

      const aiResponse = {
        content: aiContent,
        phase: data.current_phase || data.currentPhase || session.currentStep,
        metadata: {
          ...data.metadata,
          functionUsed: 'chat',
          timestamp: new Date().toISOString(),
          phase_status: data.phase_status,
          phase_advanced: phaseAdvanced,
          original_phase: data.original_phase,
          next_phase: nextPhase
        }
      }

      console.log('✅ STRUCTURED AI RESPONSE:', {
        content: aiContent?.substring(0, 100) + '...',
        phase_advanced: phaseAdvanced,
        current_phase: data.current_phase,
        next_phase: nextPhase,
        phase_status: data.phase_status
      })

      // Hide typing indicator
      setIsTyping(false)

      console.log('🔍 PHASE ADVANCEMENT CHECK:', {
        phase_advanced: phaseAdvanced,
        current_phase: data.current_phase,
        next_phase: nextPhase,
        session_current_step: session.currentStep,
        phase_status: data.phase_status
      })

      // Add AI response FIRST (phase completion affirmation)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content, // Store JSON object (phase header already included by AI)
        timestamp: new Date(),
        metadata: {
          ...aiResponse.metadata,
          responseType: 'structured_json',
          functionUsed: 'chat',
          phaseAdvanced: phaseAdvanced,
          newPhase: phaseAdvanced ? nextPhase : undefined,
          phase_status: data.phase_status,
          next_recommended_phase: nextPhase
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      await saveMessage(session.id!, assistantMessage)

      // Check if phase is complete - pass full messages with metadata including current response
      const allMessages = [...messagesToUse, assistantMessage]
      const aiResponsePreview = typeof aiResponse.content === 'object'
        ? aiResponse.content.summary?.substring(0, 100) || JSON.stringify(aiResponse.content).substring(0, 100)
        : String(aiResponse.content || 'empty').substring(0, 100)

      console.log('🔍 CALLING checkPhaseCompletion:', {
        input: input.substring(0, 100),
        currentPhase: session.currentStep,
        aiResponse: aiResponsePreview,
        messageCount: allMessages.length
      })
      
      // DISABLED: AI now handles phase transitions internally
      // const isPhaseComplete = await checkPhaseCompletion(
      //   input,
      //   session.currentStep,
      //   aiResponse.content,
      //   allMessages.map(msg => ({
      //     role: msg.role as 'user' | 'assistant' | 'system',
      //     content: msg.content,
      //     metadata: msg.metadata
      //   }))
      // )

      // Log phase analysis (using variables calculated earlier)
      console.log('🎯 STRUCTURED PHASE ANALYSIS:', {
        aiResponsePhase: aiResponse.phase,
        sessionCurrentStep: session.currentStep,
        nextPhase,
        phaseAdvanced,
        phase_status: data.phase_status,
        aiResponseStructure: Object.keys(aiResponse || {}),
        metadataStructure: Object.keys(aiResponse.metadata || {}),
        fullMetadata: aiResponse.metadata
      })

      // Update session state for phase advancement (handled by structured chat function)
      if (phaseAdvanced && nextPhase < 8) {
        console.log('🔄 UPDATING SESSION STATE for phase advancement:', {
          from: session.currentStep,
          to: nextPhase,
          sessionId: session.id
        })
        console.log('🚀 PHASE ADVANCEMENT TRIGGERED:', {
          from: session.currentStep,
          to: nextPhase,
          sessionId: session.id
        })

        console.log('📈 Phase advanced from', session.currentStep, 'to', nextPhase)

        // Update session in database (gracefully handle if table doesn't exist)
        try {
          await supabase
            .from('reflection_sessions')
            .update({
              current_step: nextPhase,
              step_data: updatedResponses
            })
            .eq('id', session.id)
        } catch (dbError) {
          console.warn('⚠️ reflection_sessions table not found (skipping phase update):', dbError)
        }

        setSession(prev => ({
          ...prev,
          currentStep: nextPhase,
          responses: updatedResponses
        }))

        // Generate combined phase header + opening content (like Phase 1 pattern)
        // ONLY when phase actually advanced
        console.log('🔍 Phase advancement check:', {
          hasTitle: !!data.phase_data?.title,
          phaseAdvanced: data.phase_advanced,
          title: data.phase_data?.title
        })

        if (data.phase_data?.title && data.phase_advanced) {
          console.log('✅ Generating combined phase header + opening for Phase', nextPhase)

          // Show phase transition indicator
          setIsPhaseTransitioning(true)

          // Generate phase opening content first
          setTimeout(async () => {
            try {
              const openingResponse = await generateAIResponse(
                "Please provide the opening prompt for this phase.",
                nextPhase,
                messages.slice(-5), // Recent context
                { sessionId: session.id }
              )

              if (openingResponse.content) {
                // Create single combined message (header + content)
                const combinedPhaseMessage: Message = {
                  id: `phase-${nextPhase}-combined-${Date.now()}`,
                  role: 'assistant',
                  content: `**${data.phase_data.title}**\n\n${openingResponse.content}`,
                  timestamp: new Date(),
                  metadata: {
                    isPhaseHeader: true,
                    phase: nextPhase,
                    functionUsed: 'chat',
                    isCombinedPhaseMessage: true
                  }
                }

                console.log('📋 Adding combined phase message:', {
                  phase: nextPhase,
                  headerTitle: data.phase_data.title,
                  hasContent: !!openingResponse.content
                })

                setMessages(prev => [...prev, combinedPhaseMessage])
                await saveMessage(session.id!, combinedPhaseMessage)
              } else {
                console.warn('⚠️ No opening content generated for Phase', nextPhase)
              }
            } catch (error) {
              console.error('❌ Failed to generate combined phase message:', error)

              // Fallback: Add header-only message
              const fallbackHeaderMessage: Message = {
                id: `phase-header-${nextPhase}-${Date.now()}`,
                role: 'assistant',
                content: `**${data.phase_data.title}**`,
                timestamp: new Date(),
                metadata: {
                  isPhaseHeader: true,
                  phase: nextPhase,
                  functionUsed: 'chat'
                }
              }
              setMessages(prev => [...prev, fallbackHeaderMessage])
              await saveMessage(session.id!, fallbackHeaderMessage)
            } finally {
              // Hide phase transition indicator
              setIsPhaseTransitioning(false)
            }
          }, 100) // Small delay to ensure proper ordering
        }
      } else if (session.currentStep === 7 && nextPhase >= 7) {
        // Session complete - add comprehensive Phase 7 completion sequence
        
        // Extract context from session responses for personalized completion
        const context: SimplePhase7Context = {
          issue: updatedResponses.step1?.userInput,
          feelings: updatedResponses.step2?.userInput,
          why: updatedResponses.step3?.userInput,
          childNeeds: updatedResponses.step5?.userInput,
          chosenOption: updatedResponses.step6?.userInput || updatedResponses.step7?.userInput
        }
        
        // Generate simplified Phase 7 response matching GPT gold standard
        const phase7Response = generateSimplePhase7Response(context)
        
        // Add CLEAR message draft
        setTimeout(async () => {
          const clearMessage: Message = {
            id: `clear-message-${Date.now()}`,
            role: 'assistant',
            content: `## 📝 Your CLEAR Message Draft\n\n"${phase7Response.clearMessage}"\n\n*Feel free to adapt this language to match your voice and situation.*`,
            timestamp: new Date(),
            metadata: { isCompletion: true }
          }
          
          setMessages(prev => [...prev, clearMessage])
          await saveMessage(session.id!, clearMessage)
        }, 1000)
        
        // Add brief closing reflection
        setTimeout(async () => {
          const closingMessage: Message = {
            id: `closing-${Date.now()}`,
            role: 'assistant',
            content: phase7Response.closingReflection,
            timestamp: new Date(),
            metadata: { isCompletion: true, isFinal: true }
          }
          
          setMessages(prev => [...prev, closingMessage])
          await saveMessage(session.id!, closingMessage)
          
          // Mark session complete
          await supabase
            .from('reflection_sessions')
            .update({
              status: 'completed',
              step_data: updatedResponses
            })
            .eq('id', session.id)
          
          setSession(prev => ({
            ...prev,
            isComplete: true,
            responses: updatedResponses
          }))
        }, 3000) // Single 3-second delay for closing
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error)
      setIsTyping(false)
      
      // Add detailed error message for debugging
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'} - Please try again or contact support.`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }


  // Function to start a completely new session (clears everything first)
  const startNewSession = async () => {
    try {
      // First, mark any existing session as completed
      if (session.id) {
        await supabase
          .from('reflection_sessions')
          .update({ status: 'completed' })
          .eq('id', session.id)
      }
      
      // Reset the session state completely
      resetSession()
      
      // Start a fresh session
      await startSession()
    } catch (error) {
      console.error('Error starting new session:', error)
      setError('Failed to start new session')
    }
  }

  // Alias functions for compatibility  
  const createNewSession = startSession
  
  const updateMessages = useCallback((updater: (prevMessages: Message[]) => Message[]) => {
    setMessages(updater)
  }, [])

  return {
    session,
    messages,
    sendMessage,
    startSession,
    createNewSession,
    startNewSession,
    resetSession,
    updateMessages,
    loading,
    error,
    isTyping,
    isPhaseTransitioning,
  }
}

// Removed deprecated generateContextualPhaseQuestion function that used chat-direct

// Helper function to get phase prompts (fallback guidance)
async function getPhasePrompt(phase: number, conversationHistory?: Message[]): Promise<string> {
  // For Phase 1, let the AI generate natural varied greetings
  if (phase === 1) {
    // This will trigger the AI to use the enhanced greeting guidance from the vector function
    return "GENERATE_WARM_PHASE1_GREETING"
  }
  
  
  const prompts = {
    1: "*Hi there!* What's the situation that's been sticking with you lately?", // Fallback for Phase 1
    2: "What feelings come up when you think about this?",
    3: "What is it about this that feels important to you?",
    4: "If your co-parent described this, how might they see it?",
    5: "What might your child be noticing about this?",
    6: "Thank you. Based on everything you've shared, here are aligned options that reflect your values, your co-parent's possible motivations, and your child's needs:",
    7: "Which of these feels most aligned with everyone's needs?"
  }
  return prompts[phase] || prompts[1] || "What's on your mind?"
}
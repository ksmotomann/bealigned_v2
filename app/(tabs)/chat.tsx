import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, useWindowDimensions, ActivityIndicator, Modal, Alert, Animated } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useReflectionSession } from '../../hooks/useReflectionSession'
import { usePhasePromptsEnhanced } from '../../hooks/usePhasePromptsEnhanced'
import { FeelingSelector } from '../../components/FeelingSelector'
import { NeedSelector } from '../../components/NeedSelector'
import { TypingIndicator } from '../../components/TypingIndicator'
import { MarkdownText } from '../../components/MarkdownText'
import { RichText } from '../../components/RichText'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../../contexts/AdminContext'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import ds from '../../styles/design-system'

export default function Chat() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const { adminViewEnabled, isActualAdmin, setIsActualAdmin } = useAdmin()
  const [inputText, setInputText] = useState('')
  const [showSteps, setShowSteps] = useState(false)
  const [showFeelingSelector, setShowFeelingSelector] = useState(false)
  const [showNeedSelector, setShowNeedSelector] = useState(false)
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])
  const [sessionHistory, setSessionHistory] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showMobileHistory, setShowMobileHistory] = useState(false)
  const [showAdminFeedback, setShowAdminFeedback] = useState(false)
  const [adminFeedbackText, setAdminFeedbackText] = useState('')
  const [showAdminInput, setShowAdminInput] = useState(false)
  const [isSubmittingAdminFeedback, setIsSubmittingAdminFeedback] = useState(false)
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const progressScrollViewRef = useRef<ScrollView>(null)

  // Load enhanced phase prompts from database with fallback to hardcoded values
  const { phases, loading: phasesLoading, error: phasesError, enhancedPhases } = usePhasePromptsEnhanced()

  // Update session title in local state to avoid flashing
  const updateSessionHistory = useCallback((sessionId: string, updates: Partial<any>) => {
    setSessionHistory(prev => {
      const existingIndex = prev.findIndex(item => item.id === sessionId)
      
      if (existingIndex >= 0) {
        // Update existing session
        return prev.map(item => 
          item.id === sessionId 
            ? { ...item, ...updates }
            : item
        )
      } else {
        // Add new session to the beginning of the list
        return [updates, ...prev]
      }
    })
  }, [])
  
  // Use vector-based knowledge system
  const { session, messages, loading, error, sendMessage, createNewSession, startNewSession, updateMessages, isTyping: aiTyping, isPhaseTransitioning } = useReflectionSession(selectedSessionId, {
    onSessionUpdated: updateSessionHistory
  }, phases)

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text)
      Alert.alert('Copied')
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard')
    }
  }
  
  // Force loading to false after 5 seconds to prevent grey box
  const [forceHideLoading, setForceHideLoading] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceHideLoading(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])
  
  // Debug logging
  console.log('Chat messages:', messages)
  console.log('Using Function-Enhanced Assistant with 100% GPT alignment')
  console.log('Admin status:', { adminViewEnabled, isActualAdmin, showAdminInput })
  console.log('Loading state:', { loading, forceHideLoading, messagesLength: messages.length })

  // Check if user is admin
  useEffect(() => {
    checkAdminStatus()
    loadSessionHistory()
  }, [])

  // Auto-scroll progress menu when step changes
  useEffect(() => {
    if (session.currentStep && progressScrollViewRef.current) {
      // Calculate the position of the current step (each step is roughly 80px height)
      const stepHeight = 80
      const scrollToY = Math.max(0, (session.currentStep - 2) * stepHeight)
      
      setTimeout(() => {
        progressScrollViewRef.current?.scrollTo({ 
          y: scrollToY, 
          animated: true 
        })
      }, 300) // Delay to ensure the step has been rendered
    }
  }, [session.currentStep])

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()
      setIsActualAdmin(profile?.user_type === 'admin' || profile?.user_type === 'super_admin')
    }
  }

  const loadSessionHistory = async () => {
    setLoadingHistory(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const query = supabase
        .from('reflection_sessions')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(50)

      // Admin sees all sessions when admin view is enabled, users see only their own
      if (!(isActualAdmin && adminViewEnabled)) {
        query.eq('owner_id', user.id)
      }

      const { data, error } = await query
      if (!error && data) {
        setSessionHistory(data)
      }
    } catch (error) {
      console.error('Error loading session history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setSessionToDelete(sessionId)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    if (!sessionToDelete) return
    
    const performDelete = async () => {
      try {
        const { error } = await supabase
          .from('reflection_sessions')
          .delete()
          .eq('id', sessionToDelete)
        
        if (error) {
          console.error('Delete error:', error)
          Alert.alert('Error', `Failed to delete session: ${error.message}`)
          return
        }
        
        await loadSessionHistory()
        if (sessionToDelete === session.id) {
          startNewSession()
        }
        setDeleteModalVisible(false)
        setSessionToDelete(null)
      } catch (error) {
        console.error('Delete error:', error)
        Alert.alert('Error', 'Failed to delete session')
      }
    }
    
    performDelete()
  }

  const handleArchiveSession = async (sessionId: string) => {
    try {
      await supabase
        .from('reflection_sessions')
        .update({ status: 'archived' })
        .eq('id', sessionId)
      
      await loadSessionHistory()
      Alert.alert('Success', 'Session archived')
    } catch (error) {
      Alert.alert('Error', 'Failed to archive session')
    }
  }


  const handleSendMessage = async () => {
    if (!inputText.trim()) return
    
    const message = inputText
    setInputText('') // Clear immediately for better UX
    await sendMessage(message)
  }

  const handleFeelingsSubmit = () => {
    if (selectedFeelings.length > 0) {
      const feelingsText = `I am feeling: ${selectedFeelings.join(', ')}`
      sendMessage(feelingsText)
      setShowFeelingSelector(false)
    }
  }

  const handleNeedsSubmit = () => {
    if (selectedNeeds.length > 0) {
      const needsText = `My needs are: ${selectedNeeds.join(', ')}`
      sendMessage(needsText)
      setShowNeedSelector(false)
    }
  }

  // Export chat as PDF
  const handleExportPDF = async () => {
    console.log('🔵 PDF Export button clicked!')
    console.log('📊 Session info:', { 
      sessionId: session.id, 
      messagesLength: messages.length,
      sessionExists: !!session,
      firstMessage: messages[0]?.content?.substring(0, 50)
    })
    
    if (!session.id || messages.length === 0) {
      console.log('❌ No session or messages to export')
      Alert.alert('No Chat to Export', 'Start a chat session first to export it as PDF.')
      return
    }

    try {
      console.log('🚀 Calling export-pdf function...')
      
      // Get the auth token for the request
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) {
        Alert.alert('Authentication Error', 'Please log in to export chats.')
        return
      }

      // Make direct fetch request to get binary PDF data
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/export-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          format: 'pdf'
        })
      })

      console.log('📥 Export response received:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Export error:', errorText)
        Alert.alert('Export Failed', `HTTP ${response.status}: ${errorText}`)
        return
      }

      // Get PDF as blob
      const blob = await response.blob()
      console.log('💾 Processing PDF download... Blob size:', blob.size)
      
      if (blob.size === 0) {
        Alert.alert('Export Failed', 'Empty PDF received')
        return
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename matching the backend format
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
      const sessionShort = session.id?.split('-')[0] || 'session'
      const filename = `BeAligned_Chat__${dateStr}_${timeStr}_${sessionShort}.pdf`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      Alert.alert('Success', `Chat exported as ${filename}`)
    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error.message || 'Could not export chat as PDF. Please try again.'
      Alert.alert('Export Failed', errorMessage)
    }
  }

  const handleAdminFeedback = async () => {
    console.log('🔵 handleAdminFeedback called')
    console.log('🔍 adminFeedbackText:', adminFeedbackText)
    console.log('🔍 session:', session?.id)
    
    // Prevent double submissions
    if (isSubmittingAdminFeedback) {
      console.log('⚠️ Already submitting feedback, ignoring duplicate request')
      return
    }
    
    if (!adminFeedbackText.trim()) {
      console.log('❌ Admin feedback is empty, not submitting')
      Alert.alert('Error', 'Please enter feedback before submitting.')
      return
    }

    if (!session?.id) {
      console.log('❌ No active session found')
      Alert.alert('Error', 'No active session found. Please start a chat session first.')
      return
    }

    // Set loading state
    setIsSubmittingAdminFeedback(true)
    console.log('🔄 Setting loading state to true')

    try {
      console.log('🎯 Submitting admin feedback:', {
        sessionId: session.id,
        phase: session.currentStep,
        feedbackText: adminFeedbackText,
        textLength: adminFeedbackText.length
      })

      const result = await supabase.functions.invoke('process-admin-feedback', {
        body: {
          sessionId: session.id,
          feedbackType: 'content_improvement',
          feedbackContent: adminFeedbackText,
          sessionContext: {
            currentPhase: session.currentStep,
            totalMessages: messages.length,
            lastUserInput: messages.filter(m => m.role === 'user').slice(-1)[0]?.content,
            lastAIResponse: messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content
          },
          messageContext: {
            phase: session.currentStep,
            messageType: 'ai_response',
            userInput: messages.filter(m => m.role === 'user').slice(-1)[0]?.content,
            aiResponse: messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content
          },
          priorityLevel: 'high'
        }
      })

      console.log('🔍 Raw result:', result)
      
      if (result.error) {
        console.error('❌ Supabase function error:', result.error)
        Alert.alert('Error', `Failed to submit feedback: ${result.error.message || 'Unknown error'}`)
      } else {
        console.log('✅ Admin feedback processed successfully:', result.data)
        console.log('🔍 Response data structure:', JSON.stringify(result.data, null, 2))
        
        const data = result.data
        const actions = data.immediateActions || []
        const vectorResult = data.vectorUpdateResult
        
        let message = 'Feedback received and processed! ✨\n\n'
        
        // Show how it was categorized
        if (vectorResult?.updateType) {
          const categoryMap = {
            'emotional_harm_prevention': 'Critical Safety Issue 🚨',
            'conversational_improvement': 'Conversation Flow 💬',
            'user_improvement': 'Content Enhancement 📝',
            'negative_weighting': 'Content Correction ⚠️',
            'content_replacement': 'Content Addition ➕'
          }
          message += `Category: ${categoryMap[vectorResult.updateType] || vectorResult.updateType}\n\n`
        }
        
        // Show immediate actions taken
        if (actions.length > 0) {
          message += 'Actions Executed:\n'
          actions.slice(0, 3).forEach(action => {
            message += `• ${action}\n`
          })
          if (actions.length > 3) {
            message += `• ...and ${actions.length - 3} more actions\n`
          }
        } else {
          message += '• Feedback stored for learning patterns\n• Vector database updated\n'
        }
        
        // Step 3: If a corrected response was generated, replace the last AI message
        if (data.correctedResponse && data.isAboutLastResponse) {
          console.log('🔄 Replacing last AI message with corrected response')
          
          const lastAIMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]
          if (lastAIMessage) {
            // Remove the last AI message and add the corrected one
            const correctedMessages = messages.filter(m => m.id !== lastAIMessage.id)
            
            const correctedAIMessage = {
              id: Date.now().toString(),
              role: 'assistant' as const,
              content: data.correctedResponse,
              timestamp: new Date(),
              corrected: true
            }
            
            updateMessages(() => [...correctedMessages, correctedAIMessage])
            
            // Save corrected message to database
            await supabase.from('chat_messages').insert({
              session_id: session.id,
              role: 'assistant',
              content: data.correctedResponse,
              message_index: correctedMessages.length,
              metadata: { 
                corrected: true, 
                originalMessageId: lastAIMessage.id,
                feedbackId: data.feedbackId 
              }
            })
            
            // Show enhanced success message
            message += '\\n\\n🔄 Last AI response has been replaced with a corrected version!'
          }
        }

        // Show acknowledgment message
        const acknowledgeMessage = data.acknowledgmentMessage || message.trim()
        console.log('🔔 Showing acknowledgment alert:', acknowledgeMessage)
        
        Alert.alert(
          'Feedback Processed ✅', 
          acknowledgeMessage,
          [{ text: 'OK', onPress: () => console.log('Alert dismissed') }]
        )
        setAdminFeedbackText('')
      }
    } catch (error) {
      console.error('❌ Exception submitting admin feedback:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      Alert.alert('Error', `Failed to submit feedback: ${error.message || 'Network error'}`)
    } finally {
      // Always reset loading state
      setIsSubmittingAdminFeedback(false)
      console.log('🔄 Setting loading state to false')
    }
  }

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user'

    // Get the previous user message for AI responses
    const messageIndex = messages.findIndex(m => m.id === message.id)
    const previousUserMessage = !isUser && messageIndex > 0
      ? messages[messageIndex - 1]?.content
      : undefined

    // Phase headers are now database-driven via dedicated messages with isPhaseHeader: true
    // No need for automatic frontend phase transition detection

    return (
      <View key={message.id}>
        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessage : styles.assistantMessage,
          ]}
        >
          {isUser ? (
            <View style={styles.userMessageBubble}>
              <Text style={styles.userMessageText}>
                {message.content || 'No content'}
              </Text>
              {isActualAdmin && (
                <Pressable
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(message.content || '')}
                >
                  <Ionicons name="copy-outline" size={16} color="#2563EB" />
                </Pressable>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.assistantMessageBubble}>
                {/* Render JSON structure if content is an object */}
                {typeof message.content === 'object' && message.content !== null ? (
                  <View>
                    {/* Summary with rich text formatting */}
                    {message.content.summary && (
                      <RichText style={styles.assistantMessageText}>
                        {message.content.summary}
                      </RichText>
                    )}

                    {/* Prompts for user */}
                    {message.content.prompts_for_user && message.content.prompts_for_user.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        {message.content.prompts_for_user.map((prompt: string, i: number) => (
                          <RichText key={i} style={[styles.assistantMessageText, { fontStyle: 'italic', marginTop: i > 0 ? 8 : 0 }]}>
                            {prompt}
                          </RichText>
                        ))}
                      </View>
                    )}

                    {/* Grounding phrase (if resistance detected) */}
                    {message.content.grounding?.text && (
                      <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                        <Text style={[styles.assistantMessageText, { fontWeight: '600', color: '#059669' }]}>
                          🌱 {message.content.grounding.text}
                        </Text>
                      </View>
                    )}

                    {/* Phase 7: Draft message */}
                    {message.content.phase === 'MESSAGE' && message.content.draft_message && (
                      <View style={{ marginTop: 12, padding: 12, backgroundColor: '#EFF6FF', borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 8 }}>
                          📝 Draft Message:
                        </Text>
                        <Text style={styles.assistantMessageText}>
                          {message.content.draft_message}
                        </Text>
                      </View>
                    )}

                    {/* Notes for alignment (expandable in admin view) */}
                    {adminViewEnabled && message.content.notes_for_alignment && message.content.notes_for_alignment.length > 0 && (
                      <View style={{ marginTop: 12, padding: 8, backgroundColor: '#FEF3C7', borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#92400E', marginBottom: 4 }}>
                          Alignment Notes:
                        </Text>
                        {message.content.notes_for_alignment.map((note: string, i: number) => (
                          <Text key={i} style={{ fontSize: 11, color: '#78350F', marginTop: 2 }}>
                            • {note}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  /* Fallback: render as text */
                  <MarkdownText style={styles.assistantMessageText}>
                    {message.content || 'No content'}
                  </MarkdownText>
                )}
                {isActualAdmin && (
                  <>
                    <Pressable
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(typeof message.content === 'object' ? JSON.stringify(message.content, null, 2) : (message.content || ''))}
                    >
                      <Ionicons name="copy-outline" size={16} color={ds.colors.text.secondary} />
                    </Pressable>
                    {/* Response Type Indicator */}
                    <View style={[
                      styles.responseTypeIndicator,
                      (message.metadata?.responseType === 'ai_vector' || message.metadata?.responseType === 'ai_json') ? styles.aiIndicator : styles.fallbackIndicator
                    ]} />
                  </>
                )}
              </View>
            </View>
          )}
        </View>
        
      </View>
    )
  }

  const renderSessionHistoryPanel = () => {
    return (
      <View style={[styles.historyPanel, !isTablet && styles.mobileHistoryPanel]}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>🗂 Recent Sessions</Text>
          <View style={styles.historyActions}>
            {!isTablet && (
              <Pressable onPress={() => setShowMobileHistory(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={ds.colors.neutral[600]} />
              </Pressable>
            )}
            <Pressable onPress={loadSessionHistory} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color={ds.colors.primary.main} />
            </Pressable>
          </View>
        </View>
        
        {loadingHistory ? (
          <ActivityIndicator size="small" color={ds.colors.primary.main} />
        ) : (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {sessionHistory.map((sessionItem) => {
              const isActive = sessionItem.id === session.id
              const isArchived = sessionItem.status === 'archived'
              const createdDate = new Date(sessionItem.created_at)
              
              return (
                <Pressable
                  key={sessionItem.id}
                  style={[
                    styles.sessionItem,
                    isActive && styles.activeSessionItem,
                    isArchived && styles.archivedSessionItem
                  ]}
                  onPress={() => {
                    setSelectedSessionId(sessionItem.id)
                    if (!isTablet) setShowMobileHistory(false)
                  }}
                  onMouseEnter={() => setHoveredSessionId(sessionItem.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                >
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionInfo}>
                      {sessionItem.title ? (
                        <Text style={[styles.sessionTitle, isActive && styles.activeText]} numberOfLines={2}>
                          {isActive ? '▶ ' : ''}{sessionItem.title}
                        </Text>
                      ) : (
                        <Text style={[styles.sessionTitle, styles.untitledSession, isActive && styles.activeText]}>
                          {isActive ? '▶ ' : ''}{sessionItem.status === 'in_progress' ? '✨ New Reflection' : '📝 Untitled Session'}
                        </Text>
                      )}
                      <Text style={[styles.sessionDate, isActive && styles.activeText]}>
                        {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={[styles.sessionStatus, isActive && styles.activeText]}>
                        🌊 Step {sessionItem.current_step}/7 • {sessionItem.status === 'in_progress' ? 'Active' : sessionItem.status}
                      </Text>
                      {sessionItem.owner_name && (
                        <Text style={styles.sessionOwner}>{sessionItem.owner_name}</Text>
                      )}
                      {adminViewEnabled && isActualAdmin && (
                        <Text style={styles.sessionId}>ID: {sessionItem.id}</Text>
                      )}
                    </View>

                    {!isArchived && (
                      <View style={styles.sessionControls}>
                        <Pressable
                          onPress={() => handleArchiveSession(sessionItem.id)}
                          style={styles.archiveButton}
                        >
                          <Ionicons name="archive-outline" size={18} color={ds.colors.primary.main} />
                        </Pressable>
                        {isActualAdmin && adminViewEnabled && (
                          <Pressable
                            onPress={() => handleDeleteSession(sessionItem.id)}
                            style={styles.adminButton}
                          >
                            <Ionicons name="trash-outline" size={18} color={ds.colors.danger} />
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>
        )}
      </View>
    )
  }

  const renderStepsPanel = () => {
    const stepStatuses = phases.map(step => ({
      ...step,
      completed: step.number < session.currentStep,
      current: step.number === session.currentStep
    }))

    // Calculate overall progress percentage
    const progressPercentage = ((session.currentStep - 1) / 7) * 100

    return (
      <View style={styles.stepsPanel}>
        <View style={styles.stepsPanelHeader}>
          <Text style={styles.stepsPanelTitle}>🌊 Your Progress</Text>
          <Text style={styles.stepsPanelSubtitle}>7-Step BeAligned Process</Text>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}% Complete • Step {session.currentStep}/7
          </Text>
        </View>

        {/* Steps list */}
        <ScrollView 
          ref={progressScrollViewRef}
          style={styles.stepsScrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stepsScrollContent}
        >
          {stepStatuses.map((step) => (
            <View
              key={step.number}
              style={[
                styles.stepItem,
                step.current && styles.currentStep,
                step.completed && styles.completedStep,
              ]}
            >
              <View style={styles.stepIndicator}>
                <View style={[
                  styles.stepNumber, 
                  step.completed && styles.stepNumberCompleted,
                  step.current && styles.stepNumberCurrent
                ]}>
                  {step.completed ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={[
                      styles.stepNumberText,
                      step.current && styles.stepNumberTextCurrent
                    ]}>{step.number}</Text>
                  )}
                </View>
                {step.number < 7 && (
                  <View style={[
                    styles.stepConnector,
                    step.completed && styles.stepConnectorCompleted
                  ]} />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepTitle,
                  step.current && styles.stepTitleCurrent,
                  step.completed && styles.stepTitleCompleted
                ]}>{step.title.replace(/^[^\s]+\s/, '').replace(/PHASE \d+:\s*/i, '').toLowerCase().replace(/(^|\s)\w/g, l => l.toUpperCase())}</Text>
                {step.current && (
                  <Text style={styles.stepDescription}>{step.description}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />
      
      <View style={[styles.reflectionHeader, !isTablet && styles.mobileReflectionHeader]}>
        <View style={styles.reflectionHeaderContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.reflectionTitle, !isTablet && styles.mobileReflectionTitle]}>
              {session && messages.length > 1 ? '💭 Continue Reflection' : '✨ Start New Reflection'}
            </Text>
            {session && session.id && isActualAdmin && (
              <Text style={styles.sessionIdDisplay}>
                Session ID: {session.id.slice(-8)}
              </Text>
            )}
            
          </View>
          
          {/* Phase headers now exclusively database-driven via conversation messages */}
        </View>
        <View style={styles.headerButtons}>
          {session && messages.length > 0 && (
            <>
              <Pressable
                onPress={handleExportPDF}
                style={styles.exportButton}
              >
                <Ionicons name="download-outline" size={24} color={ds.colors.primary.main} />
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setInputText('')
                  await startNewSession()
                }}
                style={styles.newSessionButton}
              >
                <Ionicons name="add-circle-outline" size={24} color={ds.colors.primary.main} />
                <Text style={styles.newSessionText}>New</Text>
              </Pressable>
            </>
          )}
          
          
          {!isTablet && (
            <>
              <Pressable
                onPress={() => setShowMobileHistory(!showMobileHistory)}
                style={styles.stepsToggle}
              >
                <Ionicons name="menu" size={24} color={ds.colors.primary.main} />
                <Text style={styles.toggleText}>History</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowSteps(!showSteps)}
                style={styles.stepsToggle}
              >
                <Ionicons name="list" size={24} color={ds.colors.primary.main} />
                <Text style={styles.toggleText}>Steps</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Session History on the left - only show on tablet or when mobile menu is open */}
        {(isTablet || showMobileHistory) && renderSessionHistoryPanel()}
        
        {/* Mobile backdrop when history is open */}
        {!isTablet && showMobileHistory && (
          <Pressable
            style={styles.mobileBackdrop}
            onPress={() => setShowMobileHistory(false)}
          />
        )}
        
        {/* Chat interface in the middle */}
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {loading && !forceHideLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ds.colors.primary.main} />
              </View>
            ) : (
              <>
                {messages.map((message, index) => renderMessage(message, index))}
                {(aiTyping || isPhaseTransitioning) && <TypingIndicator visible={aiTyping || isPhaseTransitioning} />}
                
              </>
            )}
          </ScrollView>

          {isActualAdmin && (
            <View style={styles.adminToggleContainer}>
              <Pressable
                style={styles.adminToggleButton}
                onPress={() => {
                  console.log('🔄 Admin toggle pressed, current state:', showAdminInput)
                  setShowAdminInput(!showAdminInput)
                }}
              >
                <Ionicons 
                  name={showAdminInput ? "chevron-down" : "chevron-up"} 
                  size={16} 
                  color={ds.colors.primary.main} 
                />
                <Text style={styles.adminToggleText}>
                  {showAdminInput ? 'Hide' : 'Show'} Admin Feedback
                </Text>
              </Pressable>
            </View>
          )}
          
          {isActualAdmin && showAdminInput && (
            <View style={styles.adminInputContainer}>
              <TextInput
                style={styles.adminInput}
                value={adminFeedbackText}
                onChangeText={setAdminFeedbackText}
                placeholder={`Admin feedback (real-time learning)...`}
                multiline
                maxLength={1000}
                onSubmitEditing={handleAdminFeedback}
                blurOnSubmit={true}
              />
              
              
              <Pressable
                style={[
                  styles.adminSendButton, 
                  (!adminFeedbackText.trim() || isSubmittingAdminFeedback) && styles.sendButtonDisabled
                ]}
                onPress={() => {
                  console.log('🔵 Admin send button pressed')
                  handleAdminFeedback()
                }}
                disabled={!adminFeedbackText.trim() || isSubmittingAdminFeedback}
              >
                {isSubmittingAdminFeedback ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </Pressable>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              multiline
              maxLength={1000}
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={true}
            />
            {session.currentStep === 3 && (
              <Pressable
                style={styles.iconButton}
                onPress={() => setShowFeelingSelector(true)}
              >
                <Ionicons name="heart-outline" size={20} color={ds.colors.primary.main} />
              </Pressable>
            )}
            {session.currentStep === 4 && (
              <Pressable
                style={styles.iconButton}
                onPress={() => setShowNeedSelector(true)}
              >
                <Ionicons name="list-outline" size={20} color={ds.colors.primary.main} />
              </Pressable>
            )}
            <Pressable
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
        
        {/* Steps Progress Panel on the right */}
        {isTablet && renderStepsPanel()}
        
        {/* Mobile overlay for steps */}
        {!isTablet && showSteps && (
          <View style={styles.mobileStepsOverlay}>
            <Pressable
              style={styles.overlayClose}
              onPress={() => setShowSteps(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </Pressable>
            {renderStepsPanel()}
          </View>
        )}
      </View>

      <Modal
        visible={showFeelingSelector}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How are you feeling?</Text>
              <Pressable
                onPress={() => setShowFeelingSelector(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <FeelingSelector
              selectedFeelings={selectedFeelings}
              onSelectionChange={setSelectedFeelings}
            />
            <Pressable
              style={[styles.modalButton, selectedFeelings.length === 0 && styles.modalButtonDisabled]}
              onPress={handleFeelingsSubmit}
              disabled={selectedFeelings.length === 0}
            >
              <Text style={styles.modalButtonText}>Submit Feelings</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNeedSelector}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What are your needs?</Text>
              <Pressable
                onPress={() => setShowNeedSelector(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <NeedSelector
              selectedNeeds={selectedNeeds}
              onSelectionChange={setSelectedNeeds}
            />
            <Pressable
              style={[styles.modalButton, selectedNeeds.length === 0 && styles.modalButtonDisabled]}
              onPress={handleNeedsSubmit}
              disabled={selectedNeeds.length === 0}
            >
              <Text style={styles.modalButtonText}>Submit Needs</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning-outline" size={48} color={ds.colors.danger} />
              <Text style={styles.deleteModalTitle}>Delete Session</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete this session? This action cannot be undone.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false)
                  setSessionToDelete(null)
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  mobileReflectionHeader: {
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
  },
  reflectionHeaderContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  reflectionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  sessionIdDisplay: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.mono,
    marginTop: 4,
    opacity: 0.7,
  },
  mobileReflectionTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    lineHeight: ds.typography.fontSize.lg.lineHeight,
  },
  // Phase indicator styles removed - phase headers now database-driven via conversation messages
  stepsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    padding: ds.spacing[2],
  },
  toggleText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.success + '10', // Light green background
  },
  exportButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.success,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.primary.lightest,
  },
  newSessionText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.lg,
    backgroundColor: 'rgba(92, 195, 234, 0.1)',
  },
  adminButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  adminSettingsModal: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  adminSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  adminCloseButton: {
    padding: 8,
    marginRight: 8,
  },
  adminSettingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  insertedPromptContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  insertedPromptLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  historyPanel: {
    width: 300,
    backgroundColor: ds.colors.background.primary,
    borderRightWidth: 1,
    borderRightColor: ds.colors.neutral[200],
    padding: ds.spacing[4],
  },
  mobileHistoryPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  mobileBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  historyTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  refreshButton: {
    padding: ds.spacing[2],
  },
  closeButton: {
    padding: ds.spacing[2],
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
    backgroundColor: ds.colors.danger + '10',
  },
  clearAllText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.danger,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  historyList: {
    flex: 1,
  },
  sessionItem: {
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[3],
    backgroundColor: ds.colors.background.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeSessionItem: {
    backgroundColor: ds.colors.primary.lightest,
    borderColor: ds.colors.primary.main,
    borderWidth: 2,
    shadowColor: ds.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  archivedSessionItem: {
    opacity: 0.6,
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingLeft: ds.spacing[2],
  },
  archiveButton: {
    padding: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sessionDate: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[1],
  },
  sessionStatus: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  sessionOwner: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  sessionId: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.quaternary,
    fontFamily: ds.typography.fontFamily.mono || ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  activeText: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
  },
  adminControls: {
    flexDirection: 'row',
    gap: ds.spacing[2],
    marginTop: ds.spacing[2],
  },
  adminButton: {
    padding: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
    backgroundColor: ds.colors.background.primary,
  },
  stepsPanel: {
    width: 280,
    backgroundColor: ds.colors.background.primary,
    borderLeftWidth: 1,
    borderLeftColor: ds.colors.neutral[200],
    padding: ds.spacing[5],
  },
  stepsPanelHeader: {
    marginBottom: ds.spacing[3], // Reduced from ds.spacing[4] to save space
  },
  stepsPanelTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1] * 0.5, // Reduced to save space  
    fontFamily: ds.typography.fontFamily.heading,
    textAlign: 'center',
  },
  stepsPanelSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBarContainer: {
    marginBottom: ds.spacing[6],
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: ds.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: ds.spacing[2],
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ds.colors.primary.main,
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
    fontWeight: '600',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[1] * 0.5, // Reduced from ds.spacing[1] to fit all 7 steps
  },
  currentStep: {
    // Current step styling handled in children
  },
  completedStep: {
    // Completed step styling handled in children
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: ds.spacing[3],
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ds.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepNumberCompleted: {
    backgroundColor: ds.colors.success,
    borderColor: ds.colors.success,
  },
  stepNumberCurrent: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
    // Add subtle pulsing animation for current step
    shadowColor: ds.colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stepNumberText: {
    color: ds.colors.neutral[600],
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.bold,
    fontFamily: ds.typography.fontFamily.base,
  },
  stepNumberTextCurrent: {
    color: ds.colors.text.inverse,
  },
  stepConnector: {
    width: 2,
    height: 30,
    backgroundColor: ds.colors.neutral[200],
    marginTop: ds.spacing[1],
  },
  stepConnectorCompleted: {
    backgroundColor: ds.colors.success,
  },
  stepContent: {
    flex: 1,
    paddingTop: ds.spacing[1],
  },
  stepTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[1],
    fontWeight: '500',
  },
  stepTitleCurrent: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  stepTitleCompleted: {
    color: ds.colors.success,
  },
  stepDescription: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.xs.lineHeight,
    fontStyle: 'italic',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingTop: 30,
  },
  messageContainer: {
    maxWidth: '85%',
    marginBottom: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  userMessageBubble: {
    backgroundColor: '#5EC3EA', // BeAligned blue for user messages
    padding: 16,
    borderRadius: 20,
    marginLeft: 40, // Indent user messages more
    borderWidth: 1,
    borderColor: '#4FAED1',
    shadowColor: '#5EC3EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  userMessageText: {
    fontSize: 16,
    color: '#FFFFFF', // White text on blue background
    lineHeight: 22,
    fontWeight: '500',
  },
  assistantMessageBubble: {
    backgroundColor: '#FFFFFF', // Clean white for AI responses
    padding: 16,
    borderRadius: 20,
    marginRight: 40, // Indent AI messages more
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  assistantMessageText: {
    fontSize: 16,
    color: '#1F2937', // Dark gray for excellent readability
    lineHeight: 24,
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    lineHeight: 22,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.primary.main, // BeAligned blue
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ds.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  mobileStepsOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#fff',
    boxShadow: '-2px 0px 8px rgba(0, 0, 0, 0.1)',
    elevation: 5,
    padding: 20,
  },
  overlayClose: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ds.colors.primary.main, // BeAligned blue
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalClose: {
    padding: 4,
  },
  modalButton: {
    backgroundColor: ds.colors.primary.main, // BeAligned blue
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModal: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[6],
    width: '90%',
    maxWidth: 400,
    ...ds.shadows.lg,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  deleteModalTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.heading,
  },
  deleteModalMessage: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
    lineHeight: ds.typography.fontSize.base.lineHeight,
    fontFamily: ds.typography.fontFamily.base,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: ds.spacing[3],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: ds.colors.neutral[200],
  },
  cancelButtonText: {
    color: ds.colors.text.primary,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: ds.colors.danger,
    flexDirection: 'row',
    gap: ds.spacing[2],
  },
  deleteButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  // A/B Mode Selector Styles
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
    marginLeft: 'auto',
    marginRight: ds.spacing[4],
  },
  modeSelectorLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  modeSelectorToggle: {
    flexDirection: 'row',
    backgroundColor: ds.colors.neutral[100],
    borderRadius: ds.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  modeOption: {
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeOptionLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  modeOptionMiddle: {
    borderRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: ds.colors.neutral[200],
    borderRightWidth: 1,
    borderRightColor: ds.colors.neutral[200],
  },
  modeOptionMiddleRight: {
    borderRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: ds.colors.neutral[200],
    borderRightWidth: 1,
    borderRightColor: ds.colors.neutral[200],
  },
  modeOptionMiddleRight2: {
    borderRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: ds.colors.neutral[200],
    borderRightWidth: 1,
    borderRightColor: ds.colors.neutral[200],
  },
  modeOptionRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: ds.colors.neutral[200],
  },
  modeOptionActive: {
    backgroundColor: ds.colors.primary.main,
  },
  modeOptionText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  modeOptionTextActive: {
    color: ds.colors.text.inverse,
  },
  modeOptionSubtext: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: 2,
  },
  modeOptionSubtextActive: {
    color: ds.colors.text.inverse,
    opacity: 0.8,
  },
  // Admin Feedback Styles
  adminToggleContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  adminToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  adminToggleText: {
    fontSize: 14,
    color: ds.colors.primary.main,
    fontWeight: '500',
  },
  adminInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF8F0', // Light orange tint to distinguish from regular input
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  adminInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F59E0B', // Orange border to distinguish admin input
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#FFFBF5',
  },
  adminSendButton: {
    backgroundColor: '#F59E0B', // Orange admin send button
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  stepsScrollContainer: {
    flex: 1,
    maxHeight: '100%',
  },
  stepsScrollContent: {
    paddingBottom: ds.spacing[4],
  },
  copyButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  responseTypeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 2,
  },
  aiIndicator: {
    backgroundColor: '#10B981', // 🟢 Green for AI/Vector
  },
  fallbackIndicator: {
    backgroundColor: '#EF4444', // 🔴 Red for Fallback
  },
  phaseTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[4],
  },
  phaseTransitionLine: {
    flex: 1,
    height: 1,
    backgroundColor: ds.colors.primary.main + '40', // 40% opacity
  },
  phaseTransitionText: {
    marginHorizontal: ds.spacing[3],
    fontSize: ds.typography.fontSize.sm.size,
    fontFamily: ds.typography.fontFamily.medium,
    fontWeight: '600',
    color: ds.colors.primary.main,
    textAlign: 'center',
  },
})
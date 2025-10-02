import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import ds from '../../styles/design-system'

interface Message {
  id: string
  sender_id: string | null
  content: string
  created_at: string
  message_type: string
  sender?: {
    first_name: string
    last_name: string
  }
}

interface ThreadInfo {
  subject: string | null
  thread_type: string
}

export default function ThreadPage() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const threadId = params.threadId as string
  const scrollViewRef = useRef<ScrollView>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [threadInfo, setThreadInfo] = useState<ThreadInfo | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadThread()
    markThreadAsRead()
    subscribeToMessages()
  }, [threadId])

  async function loadThread() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Load thread info
      const { data: thread } = await supabase
        .from('message_threads')
        .select('subject, thread_type')
        .eq('id', threadId)
        .single()

      setThreadInfo(thread)

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          message_type
        `)
        .eq('thread_id', threadId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
      }

      if (messagesData) {
        // Load sender profiles for all messages
        const senderIds = [...new Set(messagesData.map(m => m.sender_id).filter(Boolean))]
        const { data: senders } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', senderIds)

        const sendersMap = new Map(senders?.map(s => [s.id, s]) || [])

        setMessages(messagesData.map(msg => ({
          ...msg,
          sender: msg.sender_id ? sendersMap.get(msg.sender_id) : undefined,
        })))
      }

      setLoading(false)

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 100)
    } catch (error) {
      console.error('Error loading thread:', error)
      setLoading(false)
    }
  }

  async function markThreadAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('message_thread_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error marking thread as read:', error)
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          // Load sender info for new message
          const { data: sender } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg = {
            ...payload.new,
            sender,
          } as Message

          setMessages((prev) => [...prev, newMsg])
          markThreadAsRead()

          // Scroll to bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text',
        })

      if (error) throw error

      setNewMessage('')

      // Create notifications for other participants
      await createNotificationsForParticipants()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  async function createNotificationsForParticipants() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current user's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      const senderName = profile ? `${profile.first_name} ${profile.last_name}` : 'Someone'

      // Get all participants except current user
      const { data: participants } = await supabase
        .from('message_thread_participants')
        .select('user_id')
        .eq('thread_id', threadId)
        .neq('user_id', user.id)

      if (!participants) return

      // Create notifications for each participant
      const notifications = participants.map(p => ({
        user_id: p.user_id,
        notification_type: 'message',
        title: threadInfo?.subject || 'New Message',
        message: `${senderName} sent you a message`,
        reference_type: 'message_thread',
        reference_id: threadId,
        action_url: `/inbox/${threadId}`,
      }))

      await supabase.from('notifications').insert(notifications)
    } catch (error) {
      console.error('Error creating notifications:', error)
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDateHeader(timestamp: string) {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  function shouldShowDateHeader(currentMsg: Message, prevMsg: Message | null) {
    if (!prevMsg) return true
    const currentDate = new Date(currentMsg.created_at).toDateString()
    const prevDate = new Date(prevMsg.created_at).toDateString()
    return currentDate !== prevDate
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <InAppNavigationHeader />

      <View style={styles.content}>
        {/* Thread Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.push('/inbox')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={ds.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {threadInfo?.subject || 'Message Thread'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {threadInfo?.thread_type === 'support_request' ? 'Support Request' : 'Conversation'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.messagesContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId
              const isSystemMessage = message.message_type === 'system'
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showDateHeader = shouldShowDateHeader(message, prevMessage)

              return (
                <View key={message.id}>
                  {showDateHeader && (
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateHeaderText}>
                        {formatDateHeader(message.created_at)}
                      </Text>
                    </View>
                  )}

                  {isSystemMessage ? (
                    <View style={styles.systemMessage}>
                      <Text style={styles.systemMessageText}>{message.content}</Text>
                    </View>
                  ) : (
                    <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
                      {!isOwnMessage && message.sender && (
                        <Text style={styles.senderName}>
                          {message.sender.first_name} {message.sender.last_name}
                        </Text>
                      )}
                      <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                        {message.content}
                      </Text>
                      <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
                        {formatTimestamp(message.created_at)}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={ds.colors.text.tertiary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  content: {
    flex: 1,
    maxWidth: ds.containers.lg,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    backgroundColor: ds.colors.background.primary,
  },
  backButton: {
    padding: ds.spacing[2],
    marginRight: ds.spacing[2],
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: ds.spacing[4],
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: ds.spacing[4],
  },
  dateHeaderText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    backgroundColor: ds.colors.neutral[100],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: ds.spacing[3],
    borderRadius: 16,
    marginBottom: ds.spacing[2],
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: ds.colors.primary.main,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: ds.colors.neutral[100],
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[1],
    fontWeight: ds.typography.fontWeight.semibold,
  },
  messageText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[1],
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: ds.spacing[2],
  },
  systemMessageText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: ds.colors.neutral[50],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: ds.spacing[4],
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
    backgroundColor: ds.colors.background.primary,
    alignItems: 'flex-end',
    gap: ds.spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: ds.colors.primary.main,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: ds.colors.neutral[300],
    opacity: 0.5,
  },
})

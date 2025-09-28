import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import ds from '../../styles/design-system'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface SessionData {
  id: string
  title: string
  status: string
  current_step: number
  created_at: string
  completed_at: string | null
}

export default function SessionDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [session, setSession] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionData()
  }, [id])

  async function loadSessionData() {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('reflection_sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (sessionError) throw sessionError
      setSession(sessionData)

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return ds.colors.success
      case 'in_progress':
        return ds.colors.warning
      case 'archived':
        return ds.colors.neutral[500]
      default:
        return ds.colors.neutral[500]
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ds.colors.primary.main} />
        </View>
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={ds.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{session.title || 'Untitled Reflection'}</Text>
      </View>

      <View style={styles.metaInfo}>
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
            <Text style={styles.statusText}>{session.status.replace('_', ' ')}</Text>
          </View>
          <Text style={styles.metaText}>{formatDate(session.created_at)}</Text>
        </View>
        {session.status === 'in_progress' && (
          <Text style={styles.progressText}>Step {session.current_step} of 7</Text>
        )}
      </View>

      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {session.status === 'in_progress' && (
        <View style={styles.footer}>
          <Pressable
            style={styles.continueButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={styles.continueButtonText}>Continue Reflection</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[6],
  },
  errorText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  backButton: {
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[3],
    backgroundColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.md,
  },
  backButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  backIcon: {
    padding: ds.spacing[2],
    marginRight: ds.spacing[2],
  },
  headerTitle: {
    flex: 1,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  metaInfo: {
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
  },
  statusBadge: {
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  statusText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
    textTransform: 'capitalize',
  },
  metaText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  progressText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    marginTop: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[4],
  },
  messageWrapper: {
    marginBottom: ds.spacing[3],
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
  },
  userMessage: {
    backgroundColor: ds.colors.primary.main,
  },
  assistantMessage: {
    backgroundColor: ds.colors.background.primary,
  },
  messageText: {
    fontSize: ds.typography.fontSize.base.size,
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
    fontFamily: ds.typography.fontFamily.base,
  },
  userMessageText: {
    color: ds.colors.text.inverse,
  },
  assistantMessageText: {
    color: ds.colors.text.primary,
  },
  footer: {
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
  },
  continueButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  continueButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
})
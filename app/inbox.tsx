import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import InAppNavigationHeader from '../components/InAppNavigationHeader'
import ds from '../styles/design-system'

type TabType = 'messages' | 'notifications'

interface MessageThread {
  id: string
  subject: string | null
  thread_type: string
  updated_at: string
  unread: boolean
  latest_message?: string
  sender_name?: string
}

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export default function InboxPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('messages')
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastOpacity] = useState(new Animated.Value(0))

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Reload data when screen comes into focus (e.g., navigating back from thread)
  useFocusEffect(
    React.useCallback(() => {
      loadData()
    }, [activeTab])
  )

  async function loadData() {
    if (activeTab === 'messages') {
      await loadMessageThreads()
    } else {
      await loadNotifications()
    }
    setLoading(false)
  }

  async function loadMessageThreads() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get threads the user participates in (excluding archived by this user)
      const { data: participants, error: participantsError } = await supabase
        .from('message_thread_participants')
        .select(`
          thread_id,
          last_read_at,
          archived_at,
          message_threads!inner(
            id,
            subject,
            thread_type,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .is('archived_at', null)

      if (participantsError) {
        console.error('Error loading participants:', participantsError)
        return
      }

      if (!participants) return

      // Sort by updated_at (filtering no longer needed with !inner)
      const validParticipants = participants.sort((a, b) => {
        const aTime = new Date((a.message_threads as any).updated_at).getTime()
        const bTime = new Date((b.message_threads as any).updated_at).getTime()
        return bTime - aTime
      })

      // Get latest message for each thread
      const threadsWithMessages = await Promise.all(
        validParticipants.map(async (p) => {
          const thread = (p.message_threads as any)

          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get sender profile if message exists
          let senderName = null
          if (latestMessage?.sender_id) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', latestMessage.sender_id)
              .single()

            senderName = sender ? `${sender.first_name} ${sender.last_name}` : null
          }

          const lastRead = p.last_read_at ? new Date(p.last_read_at) : new Date(0)
          const threadUpdated = new Date(thread.updated_at)

          return {
            id: thread.id,
            subject: thread.subject,
            thread_type: thread.thread_type,
            updated_at: thread.updated_at,
            unread: threadUpdated > lastRead,
            latest_message: latestMessage?.content,
            sender_name: senderName,
          }
        })
      )

      setMessageThreads(threadsWithMessages)
    } catch (error) {
      console.error('Error loading message threads:', error)
    }
  }

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      loadNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  async function clearAllNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      loadNotifications()
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }

  async function archiveThread(threadId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('message_thread_participants')
        .update({ archived_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('user_id', user.id)

      loadMessageThreads()
      showToast()
    } catch (error) {
      console.error('Error archiving thread:', error)
    }
  }

  function showToast() {
    setToastVisible(true)

    // Fade in
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Wait 2 seconds then fade out
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setToastVisible(false)
        })
      }, 2000)
    })
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inbox</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
            onPress={() => setActiveTab('messages')}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={activeTab === 'messages' ? ds.colors.primary.main : ds.colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
              Messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
            onPress={() => setActiveTab('notifications')}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={activeTab === 'notifications' ? ds.colors.primary.main : ds.colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
              Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === 'messages' ? (
            messageThreads.length > 0 ? (
              messageThreads.map((thread) => (
                <View key={thread.id} style={styles.messageRow}>
                  <TouchableOpacity
                    style={styles.archiveButton}
                    onPress={() => archiveThread(thread.id)}
                  >
                    <Ionicons name="archive-outline" size={20} color={ds.colors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.item, thread.unread && styles.itemUnread]}
                    onPress={() => router.push(`/inbox/${thread.id}`)}
                  >
                    <View style={styles.itemIcon}>
                      <Ionicons name="chatbubble" size={24} color={ds.colors.primary.main} />
                    </View>
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemTitle, thread.unread && styles.itemTitleUnread]}>
                          {thread.subject || 'No Subject'}
                        </Text>
                        <Text style={styles.itemTime}>{formatTime(thread.updated_at)}</Text>
                      </View>
                      {thread.latest_message && (
                        <Text style={styles.itemMessage} numberOfLines={2}>
                          {thread.sender_name ? `${thread.sender_name}: ` : ''}{thread.latest_message}
                        </Text>
                      )}
                    </View>
                    {thread.unread && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={ds.colors.neutral[300]} />
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            )
          ) : (
            notifications.length > 0 ? (
              <>
                {/* Clear All Button */}
                <View style={styles.clearAllContainer}>
                  <TouchableOpacity
                    style={styles.clearAllButton}
                    onPress={clearAllNotifications}
                  >
                    <Ionicons name="trash-outline" size={16} color={ds.colors.text.secondary} />
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                {notifications.map((notification) => (
                <View
                  key={notification.id}
                  style={[styles.item, !notification.is_read && styles.itemUnread]}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons name="notifications" size={24} color={ds.colors.primary.main} />
                  </View>
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, !notification.is_read && styles.itemTitleUnread]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.itemTime}>{formatTime(notification.created_at)}</Text>
                    </View>
                    <Text style={styles.itemMessage}>{notification.message}</Text>
                    <View style={styles.notificationActions}>
                      {!notification.is_read && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => markNotificationAsRead(notification.id)}
                        >
                          <Text style={styles.actionButtonText}>Mark as Read</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteNotification(notification.id)}
                      >
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {!notification.is_read && <View style={styles.unreadDot} />}
                </View>
              ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-outline" size={48} color={ds.colors.neutral[300]} />
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            )
          )}
        </ScrollView>
      </View>

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.toastText}>Message Archived</Text>
        </Animated.View>
      )}
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
    padding: ds.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  headerTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[4],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: ds.colors.primary.main,
  },
  tabText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
  },
  tabTextActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  archiveButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    padding: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
  },
  itemUnread: {
    backgroundColor: ds.colors.primary.lightest,
  },
  itemIcon: {
    marginRight: ds.spacing[3],
    paddingTop: ds.spacing[1],
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[1],
  },
  itemTitle: {
    flex: 1,
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.medium,
  },
  itemTitleUnread: {
    fontWeight: ds.typography.fontWeight.semibold,
  },
  itemTime: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    marginLeft: ds.spacing[2],
  },
  itemMessage: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.primary.main,
    marginLeft: ds.spacing[2],
    marginTop: ds.spacing[2],
  },
  notificationActions: {
    flexDirection: 'row',
    gap: ds.spacing[2],
    marginTop: ds.spacing[2],
  },
  actionButton: {
    paddingVertical: ds.spacing[1],
    paddingHorizontal: ds.spacing[2],
  },
  actionButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing[12],
  },
  emptyText: {
    marginTop: ds.spacing[4],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
  },
  clearAllContainer: {
    padding: ds.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    alignItems: 'flex-end',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.neutral[100],
  },
  clearAllText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -100 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
  },
})

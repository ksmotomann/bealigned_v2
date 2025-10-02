import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import UserMenu from './UserMenu'
import ds from '../styles/design-system'

interface InAppNavigationHeaderProps {
  onLogoPress?: () => void
}

export default function InAppNavigationHeader({ onLogoPress }: InAppNavigationHeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    getCurrentUser()
    loadUnreadCount()
    subscribeToNotifications()
  }, [])

  async function getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error getting user:', error)
    }
  }

  async function loadUnreadCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Count unread notifications
      const { count: notificationCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      // Count threads with unread messages
      const { data: threads, error: threadsError } = await supabase
        .from('message_thread_participants')
        .select(`
          thread_id,
          last_read_at,
          message_threads!inner(updated_at)
        `)
        .eq('user_id', user.id)

      if (threadsError) {
        console.error('Error loading threads:', threadsError)
      }

      let unreadThreadCount = 0
      if (threads) {
        unreadThreadCount = threads.filter(participant => {
          const lastRead = participant.last_read_at ? new Date(participant.last_read_at) : new Date(0)
          const threadUpdated = new Date((participant.message_threads as any).updated_at)
          return threadUpdated > lastRead
        }).length
      }

      setUnreadCount((notificationCount || 0) + unreadThreadCount)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  function subscribeToNotifications() {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => loadUnreadCount()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => loadUnreadCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Pressable style={styles.logo} onPress={() => onLogoPress ? onLogoPress() : router.push('/(tabs)/dashboard')}>
          <Image
            source={require('../assets/bealigned_logo.avif')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Pressable>
        
        <View style={styles.rightSection}>
          {/* Notification Bell */}
          <Pressable
            style={styles.bellIcon}
            onPress={() => router.push('/inbox')}
          >
            <Ionicons name="notifications-outline" size={24} color={ds.colors.text.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <UserMenu user={user} />
        </View>

        {/* Mobile navigation - UserMenu handles mobile differently */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
    position: 'relative',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[12],
    paddingVertical: ds.spacing[4],
    maxWidth: ds.containers.xl,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 40,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[4],
  },
  bellIcon: {
    position: 'relative',
    padding: ds.spacing[2],
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
})
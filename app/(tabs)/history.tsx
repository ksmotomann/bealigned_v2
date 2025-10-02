import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import ds from '../../styles/design-system'
import { createShadow } from '../../utils/platformStyles'
import { Ionicons } from '@expo/vector-icons'

interface ReflectionSession {
  id: string
  title: string
  status: 'in_progress' | 'completed' | 'archived'
  current_step: number
  created_at: string
  completed_at: string | null
}

export default function History() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ReflectionSession[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user is admin
        const isAdminUser = user.email === 'robert@bealigned.co'
        setIsAdmin(isAdminUser)
        
        const { data, error } = await supabase
          .from('reflection_sessions')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setSessions(data || [])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function archiveSession(sessionId: string, sessionTitle: string) {
    Alert.alert(
      'Archive Session',
      `Archive "${sessionTitle || 'Untitled Reflection'}"? You can view archived sessions anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reflection_sessions')
                .update({ status: 'archived' })
                .eq('id', sessionId)

              if (error) throw error

              // Update local state
              setSessions(prev =>
                prev.map(s => s.id === sessionId ? { ...s, status: 'archived' as const } : s)
              )
            } catch (error) {
              console.error('Error archiving session:', error)
              Alert.alert('Error', 'Failed to archive session')
            }
          }
        }
      ]
    )
  }

  async function deleteSession(sessionId: string, sessionTitle: string) {
    if (!isAdmin) return

    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${sessionTitle || 'Untitled Reflection'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reflection_sessions')
                .delete()
                .eq('id', sessionId)

              if (error) throw error

              // Remove from local state
              setSessions(prev => prev.filter(s => s.id !== sessionId))
            } catch (error) {
              console.error('Error deleting session:', error)
              Alert.alert('Error', 'Failed to delete session')
            }
          }
        }
      ]
    )
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function renderSession({ item }: { item: ReflectionSession }) {
    const statusColor = {
      completed: '#10B981',
      in_progress: '#F59E0B',
      archived: '#6B7280',
    }[item.status]

    return (
      <View style={styles.sessionCard}>
        <Pressable
          style={styles.sessionContent}
          onPress={() => router.push(`/session/${item.id}`)}
        >
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>
              {item.title || 'Untitled Reflection'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {item.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          
          <Text style={styles.sessionDate}>
            {formatDate(item.created_at)}
          </Text>
          
          {item.status === 'in_progress' && (
            <Text style={styles.sessionProgress}>
              Step {item.current_step} of 7
            </Text>
          )}
        </Pressable>

        <View style={styles.actionButtons}>
          {item.status !== 'archived' && (
            <Pressable
              style={styles.archiveButton}
              onPress={() => archiveSession(item.id, item.title)}
            >
              <Ionicons name="archive-outline" size={20} color="#6B7280" />
            </Pressable>
          )}
          {isAdmin && (
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteSession(item.id, item.title)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Reflection History</Text>
        <Text style={styles.subtitle}>Review your journey of growth and reflection</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No reflections yet</Text>
          <Text style={styles.emptyText}>
            Start your first reflection to begin tracking your journey
          </Text>
          <Pressable
            style={styles.startButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={styles.startButtonText}>Start Reflecting</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  loadingText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  header: {
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  title: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  listContent: {
    padding: ds.spacing[4],
  },
  sessionCard: {
    backgroundColor: ds.colors.background.primary,
    flexDirection: 'row',
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[3],
    alignItems: 'center',
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.05,
      radius: 4,
      elevation: 2,
    }),
  },
  sessionContent: {
    flex: 1,
    padding: ds.spacing[4],
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    flex: 1,
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
  sessionDate: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[1],
  },
  sessionProgress: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: ds.spacing[3],
    gap: ds.spacing[2],
  },
  archiveButton: {
    padding: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
  },
  deleteButton: {
    padding: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[10],
  },
  emptyTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  emptyText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
  },
  startButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
  },
  startButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  deleteButton: {
    padding: ds.spacing[3],
    paddingRight: ds.spacing[4],
  },
})
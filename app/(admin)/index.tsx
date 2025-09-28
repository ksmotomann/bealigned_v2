import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Stats {
  totalUsers: number
  activeToday: number
  totalSessions: number
  completedSessions: number
}

export default function AdminDashboard() {
  console.log('AdminDashboard component rendering')
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeToday: 0,
    totalSessions: 0,
    completedSessions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get users active today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', today.toISOString())

      // Get total sessions
      const { count: sessionCount } = await supabase
        .from('reflection_sessions')
        .select('*', { count: 'exact', head: true })

      // Get completed sessions
      const { count: completedCount } = await supabase
        .from('reflection_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      setStats({
        totalUsers: userCount || 0,
        activeToday: activeCount || 0,
        totalSessions: sessionCount || 0,
        completedSessions: completedCount || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  console.log('Admin Dashboard - sections defined')
  const adminSections = [
    {
      title: 'Training Management',
      icon: 'school-outline',
      route: '/(admin)/training',
      description: 'Manage AI training data and patterns',
      color: '#8B5CF6',
    },
    {
      title: 'User Management',
      icon: 'people-outline',
      route: '/(admin)/users',
      description: 'View and manage user accounts',
      color: '#3B82F6',
    },
    {
      title: 'Sessions',
      icon: 'chatbubbles-outline',
      route: '/(admin)/sessions',
      description: 'Monitor reflection sessions',
      color: '#10B981',
    },
    {
      title: 'Analytics',
      icon: 'analytics-outline',
      route: '/(admin)/analytics',
      description: 'View usage statistics and trends',
      color: '#F59E0B',
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#7C3AED" />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="pulse" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{stats.activeToday}</Text>
            <Text style={styles.statLabel}>Active Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.completedSessions}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.sectionsContainer}>
          {adminSections.map((section, index) => (
            <Pressable
              key={index}
              style={styles.sectionCard}
              onPress={() => router.push(section.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${section.color}20` }]}>
                <Ionicons name={section.icon as any} size={28} color={section.color} />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>New user registration</Text>
            <Text style={styles.activityTime}>2 min ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>Session completed</Text>
            <Text style={styles.activityTime}>15 min ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>New reflection started</Text>
            <Text style={styles.activityTime}>1 hour ago</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionsContainer: {
    padding: 16,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  recentActivity: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
})
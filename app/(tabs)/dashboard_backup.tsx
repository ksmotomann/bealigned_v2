import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { Ionicons } from '@expo/vector-icons'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import WelcomeHeader from '../../components/WelcomeHeader'
import TrialStatus from '../../components/TrialStatus'
import ds from '../../styles/design-system'

interface ReflectionPattern {
  id: string
  label: string
  value: number
  color: string
  description: string
}

interface RecentReflection {
  id: string
  created_at: string
  title: string
  status: 'in_progress' | 'completed' | 'archived'
  current_step: number
}

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [firstName, setFirstName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [recentReflections, setRecentReflections] = useState<RecentReflection[]>([])
  const [inProgressSession, setInProgressSession] = useState<RecentReflection | null>(null)
  const [streakCount, setStreakCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [reflectionPatterns] = useState([
    { id: '1', label: 'Overwhelmed', value: 80, color: ds.colors.primary.main, description: 'Most Common Feeling' },
    { id: '2', label: 'Frustrated', value: 60, color: ds.colors.primary.light, description: '' },
    { id: '3', label: 'Concerned', value: 40, color: ds.colors.primary.light, description: '' },
    { id: '4', label: 'Child stability', value: 95, color: ds.colors.primary.main, description: 'Most Important Needs' },
    { id: '5', label: 'Child communication', value: 70, color: ds.colors.primary.light, description: '' },
    { id: '6', label: 'Respect', value: 60, color: ds.colors.primary.light, description: '' },
  ])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session?.user?.user_metadata?.first_name) {
        setFirstName(session.user.user_metadata.first_name)
      }

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        setIsAdmin(profileData?.role === 'admin')

        const { data: sessionsData } = await supabase
          .from('reflection_sessions')
          .select('id, title, status, current_step, created_at')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(3)

        if (sessionsData) {
          setRecentReflections(sessionsData)

          const inProgress = sessionsData.find(s => s.status === 'in_progress')
          setInProgressSession(inProgress || null)
        }

        const { data: completedData } = await supabase
          .from('reflection_sessions')
          .select('completed_at')
          .eq('owner_id', session.user.id)
          .eq('status', 'completed')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })

        if (completedData && completedData.length > 0) {
          let streak = 0
          let currentDate = new Date()
          currentDate.setHours(0, 0, 0, 0)

          for (const session of completedData) {
            const sessionDate = new Date(session.completed_at!)
            sessionDate.setHours(0, 0, 0, 0)

            const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === streak) {
              streak++
              currentDate = sessionDate
            } else {
              break
            }
          }

          setStreakCount(streak)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getStatusDisplay(status: string) {
    const statusMap = {
      'completed': { label: 'Completed', color: ds.colors.success },
      'in_progress': { label: 'In Progress', color: ds.colors.warning },
      'archived': { label: 'Archived', color: ds.colors.neutral[500] },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: ds.colors.neutral[500] }
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader activeTab="dashboard" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <WelcomeHeader firstName={firstName} />

        {/* Trial Status */}
        {session?.user?.id && (
          <TrialStatus userId={session.user.id} />
        )}

        <View style={styles.content}>
          {/* Main Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <Text style={styles.primaryButtonText}>Start New Reflection</Text>
            </Pressable>

            {inProgressSession && (
              <Pressable
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => router.push(`/session/${inProgressSession.id}`)}
              >
                <Text style={styles.secondaryButtonText}>Continue Reflection</Text>
              </Pressable>
            )}
          </View>

          {/* Quick Questions Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star-outline" size={20} color={ds.colors.primary.main} />
              <Text style={styles.cardTitle}>Your Reflection Shapes Background™</Text>
            </View>
            <Text style={styles.cardDescription}>
              Each reflection matters: Use sharing what you're noticing, work on it. Using BeAligned™ 
              strengthens your natural way your experience and helps you address the situation this process.
            </Text>
            <Text style={styles.sectionSubtitle}>How helpful was this process for you?</Text>
            
            {/* Rating Stars */}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} style={styles.starButton}>
                  <Ionicons name="star" size={24} color={ds.colors.warning} />
                </Pressable>
              ))}
              <Text style={styles.ratingText}>Extremely helpful</Text>
            </View>

            {/* Quick Questions */}
            <View style={styles.questionsContainer}>
              <Text style={styles.questionLabel}>What's on minds?</Text>
              <Text style={styles.questionSubtext}>Are you looking at your next step?</Text>
              <View style={styles.answerOptions}>
                <Pressable style={styles.answerButton}>
                  <Text style={styles.answerText}>Yes</Text>
                </Pressable>
                <Pressable style={styles.answerButton}>
                  <Text style={styles.answerText}>Somewhat</Text>
                </Pressable>
                <Pressable style={styles.answerButton}>
                  <Text style={styles.answerText}>No</Text>
                </Pressable>
              </View>
              
              <Text style={styles.questionLabel}>How would that that describe how you feel about?</Text>
              <Text style={styles.questionSubtext}>Any insights from or increase?</Text>
              
              <Pressable style={[styles.actionButton, styles.primaryButton, styles.fullWidthButton]}>
                <Text style={styles.primaryButtonText}>Continue Next Previous Reflection</Text>
              </Pressable>
            </View>
          </View>

          {/* Reflection Patterns */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics-outline" size={20} color={ds.colors.primary.main} />
              <Text style={styles.cardTitle}>Your Reflection Patterns</Text>
            </View>
            <Text style={styles.cardDescription}>
              Based on your recent reflections, here are the feelings and needs that you most often draw on.
            </Text>
            
            <View style={styles.patternsContainer}>
              <View style={styles.patternColumn}>
                <Text style={styles.patternColumnTitle}>Most Common Feelings</Text>
                {reflectionPatterns.slice(0, 3).map((pattern) => (
                  <View key={pattern.id} style={styles.patternItem}>
                    <Text style={styles.patternLabel}>{pattern.label}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${pattern.value}%`, backgroundColor: pattern.color }]} />
                    </View>
                    <Text style={styles.patternValue}>{pattern.value}%</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.patternColumn}>
                <Text style={styles.patternColumnTitle}>Most Important Needs</Text>
                {reflectionPatterns.slice(3).map((pattern) => (
                  <View key={pattern.id} style={styles.patternItem}>
                    <Text style={styles.patternLabel}>{pattern.label}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${pattern.value}%`, backgroundColor: pattern.color }]} />
                    </View>
                    <Text style={styles.patternValue}>{pattern.value}%</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <Text style={styles.insightText}>
              Insight: Your reflections consistently show your child's stability above all else. When you feel overwhelmed,
              focusing on how most important moves have you family.
            </Text>
          </View>

          {/* Reflection Streak */}
          {streakCount > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakNumber}>{streakCount}</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>Reflection Streak</Text>
                  <Text style={styles.streakSubtitle}>You're on a {streakCount} day streak!</Text>
                </View>
              </View>
              <Text style={styles.streakDescription}>Keep reflecting to maintain your streak</Text>
            </View>
          )}

          {/* Recent Reflections */}
          {recentReflections.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Reflections</Text>
              <View style={styles.recentReflectionsList}>
                {recentReflections.map((reflection) => {
                  const statusInfo = getStatusDisplay(reflection.status)
                  return (
                    <Pressable
                      key={reflection.id}
                      style={styles.reflectionItem}
                      onPress={() => router.push(`/session/${reflection.id}`)}
                    >
                      <View style={styles.reflectionDate}>
                        <Text style={styles.reflectionDateText}>{formatDate(reflection.created_at)}</Text>
                      </View>
                      <View style={styles.reflectionContent}>
                        <Text style={styles.reflectionTitle}>{reflection.title || 'Untitled Reflection'}</Text>
                        <View style={styles.reflectionStatus}>
                          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                          <Text style={styles.statusText}>{statusInfo.label}</Text>
                        </View>
                      </View>
                      <View style={styles.reflectionAction}>
                        <Ionicons name="chevron-forward" size={20} color={ds.colors.text.tertiary} />
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {/* Additional Resources */}
          <View style={styles.resourcesContainer}>
            {/* Weekly Grounding */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Weekly Grounding</Text>
              <Text style={styles.quote}>
                "In between every stimulus and response there is a space. In that space is the power to choose..."
              </Text>
              <Text style={styles.quoteAuthor}>- Victor Frankl</Text>
              <Text style={styles.beText}>Be</Text>
              <Text style={styles.beSubtext}>Be conscious. Be your BeAligned.</Text>
            </View>

            {/* BeH2OR Certified Coaching */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="school-outline" size={20} color={ds.colors.primary.main} />
                <Text style={styles.cardTitle}>BeH2OR Certified Coaching</Text>
              </View>
              <Text style={styles.cardDescription}>
                Ready to take your co-parenting to the next level? Book your complementary 15-minute Prep Mini Session.
                Your Best BeH2OR coach-ready relationship for BeAligned™ approach.
              </Text>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Book Your Prep Session</Text>
              </Pressable>
            </View>

            {/* BeAligned Community */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people-outline" size={20} color={ds.colors.primary.main} />
                <Text style={styles.cardTitle}>BeAligned Community</Text>
              </View>
              <Text style={styles.cardDescription}>
                Access the BeAligned Web, select from professionals, and receive encouragement and ideas from parents
                with circumstances who share your commitment to putting X first.
              </Text>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Visit Community</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  content: {
    paddingHorizontal: ds.spacing[6],
    paddingTop: ds.spacing[6],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginBottom: ds.spacing[6],
  },
  actionButton: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  primaryButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButtonText: {
    color: ds.colors.text.primary,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  fullWidthButton: {
    flex: 'none',
    alignSelf: 'stretch',
  },
  card: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[6],
    ...ds.shadows.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    marginBottom: ds.spacing[3],
  },
  cardTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  cardDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.sm.lineHeight + 4,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  sectionSubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    marginBottom: ds.spacing[4],
  },
  starButton: {
    padding: ds.spacing[1],
  },
  ratingText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginLeft: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  questionsContainer: {
    marginTop: ds.spacing[4],
  },
  questionLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  questionSubtext: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
  },
  answerOptions: {
    flexDirection: 'row',
    gap: ds.spacing[2],
    marginBottom: ds.spacing[4],
  },
  answerButton: {
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.background.primary,
  },
  answerText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  patternsContainer: {
    flexDirection: 'row',
    gap: ds.spacing[6],
  },
  patternColumn: {
    flex: 1,
  },
  patternColumnTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
  },
  patternItem: {
    marginBottom: ds.spacing[3],
  },
  patternLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: ds.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: ds.spacing[1],
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  patternValue: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    textAlign: 'right',
    fontFamily: ds.typography.fontFamily.base,
  },
  insightText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: ds.spacing[4],
    padding: ds.spacing[3],
    backgroundColor: ds.colors.neutral[50],
    borderRadius: ds.borderRadius.md,
    fontFamily: ds.typography.fontFamily.base,
  },
  streakBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    fontFamily: ds.typography.fontFamily.heading,
  },
  streakSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  streakDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  recentReflectionsList: {
    marginTop: ds.spacing[4],
  },
  reflectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
  },
  reflectionDate: {
    width: 80,
  },
  reflectionDateText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  reflectionContent: {
    flex: 1,
    marginLeft: ds.spacing[3],
  },
  reflectionTitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.medium,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  reflectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  reflectionAction: {
    padding: ds.spacing[1],
  },
  resourcesContainer: {
    marginBottom: ds.spacing[6],
  },
  quote: {
    fontSize: ds.typography.fontSize.base.size,
    fontStyle: 'italic',
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  quoteAuthor: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  beText: {
    fontSize: ds.typography.fontSize['4xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  beSubtext: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
    backgroundColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.md,
    marginTop: ds.spacing[3],
  },
  linkButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
})
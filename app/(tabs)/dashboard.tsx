import React, { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Share, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { Ionicons } from '@expo/vector-icons'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import TrialStatus from '../../components/TrialStatus'
import ds from '../../styles/design-system'

interface RecentReflection {
  id: string
  created_at: string
  title: string
  status: 'in_progress' | 'completed' | 'archived'
  current_step: number
}

interface NavigationTab {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

export default function Dashboard() {
  const router = useRouter()
  const scrollViewRef = useRef<ScrollView>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [firstName, setFirstName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [recentReflections, setRecentReflections] = useState<RecentReflection[]>([])
  const [inProgressSession, setInProgressSession] = useState<RecentReflection | null>(null)
  const [streakCount, setStreakCount] = useState(5)
  const [loading, setLoading] = useState(true)
  const [yourWhy, setYourWhy] = useState('Your Child\'s Stability = Your North Star')
  const [completedReflections, setCompletedReflections] = useState(12)
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1)
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null)

  const navigationTabs: NavigationTab[] = [
    { id: 'reflection', label: 'Start Reflection', icon: 'play-circle-outline' },
    { id: 'why', label: 'Your Why', icon: 'heart-outline' },
    { id: 'streak', label: 'Streak', icon: 'flame-outline' },
    { id: 'proof', label: 'Proof', icon: 'document-outline' },
    { id: 'grounding', label: 'Grounding', icon: 'leaf-outline' },
    { id: 'resources', label: 'Resources', icon: 'library-outline' },
  ]

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

        // Get user registration date to calculate week number
        const { data: userData } = await supabase
          .from('users')
          .select('created_at')
          .eq('id', session.user.id)
          .single()

        if (userData?.created_at) {
          setUserCreatedAt(userData.created_at)
          const weekNumber = calculateWeekNumber(userData.created_at)
          setCurrentWeekNumber(weekNumber)
        }

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

        // Calculate streak count
        const { data: completedData } = await supabase
          .from('reflection_sessions')
          .select('completed_at')
          .eq('owner_id', session.user.id)
          .eq('status', 'completed')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })

        if (completedData && completedData.length > 0) {
          // Set the actual completed reflections count
          setCompletedReflections(completedData.length)

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
        } else {
          // No completed reflections yet
          setCompletedReflections(0)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateWeekNumber = (createdAt: string): number => {
    const registrationDate = new Date(createdAt)
    const currentDate = new Date()
    const diffTime = Math.abs(currentDate.getTime() - registrationDate.getTime())
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))

    // Cycle through weeks 1-12, starting from week 1
    return ((diffWeeks % 12) + 1)
  }

  const getGroundingImageSource = () => {
    // Static mapping of week numbers to image sources
    const groundingImages = {
      1: require('../../assets/grounding/WK1.png'),
      2: require('../../assets/grounding/WK2.png'),
      3: require('../../assets/grounding/WK3.png'),
      4: require('../../assets/grounding/WK4.png'),
      5: require('../../assets/grounding/WK5.png'),
      6: require('../../assets/grounding/WK6.png'),
      7: require('../../assets/grounding/WK7.png'),
      8: require('../../assets/grounding/WK8.png'),
      9: require('../../assets/grounding/WK9.png'),
      10: require('../../assets/grounding/WK10.png'),
      11: require('../../assets/grounding/WK11.png'),
      12: require('../../assets/grounding/WK12.png'),
    }

    return groundingImages[currentWeekNumber as keyof typeof groundingImages] || groundingImages[1]
  }

  const scrollToSection = (sectionId: string) => {
    // In a production app, this would implement smooth scrolling to sections
    console.log(`Scrolling to ${sectionId}`)
  }

  const shareGroundingImage = async () => {
    try {
      // For now, share a message about the grounding image
      // In production, you'd want to share the actual image file
      const message = `Week ${currentWeekNumber} Grounding from BeAligned™\n\nBe grounded. Be clear. BeAligned.™\n\n#BeAligned #Mindfulness #CoParenting`

      await Share.share({
        message: message,
        title: `Week ${currentWeekNumber} Grounding - BeAligned™`
      })
    } catch (error) {
      console.error('Error sharing grounding image:', error)
    }
  }

  const downloadReflectionSummary = () => {
    // Implementation for downloading reflection summary
    console.log('Downloading reflection summary...')
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader />

      {/* Navigation Tabs */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
          {navigationTabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={styles.tabItem}
              onPress={() => scrollToSection(tab.id)}
            >
              <Ionicons name={tab.icon} size={16} color={ds.colors.primary.main} />
              <Text style={styles.tabLabel}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Trial Status */}
        {session?.user?.id && (
          <TrialStatus userId={session.user.id} />
        )}

        <View style={styles.content}>
          {/* Welcome Section Card */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>👏 Welcome back, {firstName || 'Trina'}</Text>
            <Text style={styles.welcomeSubtitle}>This is your space to pause, reflect, and realign.</Text>
          </View>
          {/* Main Reflection Action Area */}
          <View style={styles.reflectionActionCard}>
            <View style={styles.playButtonContainer}>
              <Pressable
                style={styles.playButton}
                onPress={() => router.push('/(tabs)/chat')}
              >
                <Ionicons name="play" size={32} color={ds.colors.background.primary} />
              </Pressable>
            </View>
            <Text style={styles.actionTitle}>
              {completedReflections === 0 ? 'Ready for your first reflection?' : 'Ready for your next reflection?'}
            </Text>
            <Text style={styles.actionSubtitle}>Transform today's challenges into tomorrow's wisdom</Text>

            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => router.push('/(tabs)/chat')}
              >
                <Ionicons name="play" size={16} color={ds.colors.text.inverse} style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Start New Reflection</Text>
              </Pressable>

              {inProgressSession && (
                <Pressable
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => router.push(`/session/${inProgressSession.id}`)}
                >
                  <Ionicons name="refresh" size={16} color={ds.colors.primary.main} style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>Continue Reflection</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Your Why Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={20} color={ds.colors.primary.main} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Your Why</Text>
                <Text style={styles.sectionSubtitle}>{yourWhy}</Text>
              </View>
              <Pressable style={styles.sectionAction}>
                <Text style={styles.actionLinkText}>View / Update</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.primary.main} />
              </Pressable>
            </View>

            <View style={styles.quoteContainer}>
              <Text style={styles.quote}>
                "Every reflection I do brings me closer to being the parent my child deserves. When I'm centered, they feel secure."
              </Text>
            </View>
          </View>

          {/* Reflection Streak Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="flame" size={20} color={ds.colors.primary.main} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Reflection Streak</Text>
                <Text style={styles.sectionSubtitle}>Keep the momentum going</Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakDaysText}>{streakCount} days</Text>
              </View>
            </View>

            <View style={styles.streakProgress}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <View style={styles.streakProgressContainer}>
                <View style={styles.streakProgressBar}>
                  <View style={[styles.streakProgressFill, { width: `${Math.min((streakCount / 7) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.streakDaysLabel}>{streakCount} days</Text>
              </View>
              <Text style={styles.streakGoal}>2 more days to reach your weekly goal!</Text>
            </View>
          </View>

          {/* Proof of Reflection Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={20} color={ds.colors.primary.main} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Proof of Reflection</Text>
                <Text style={styles.sectionSubtitle}>Download your progress</Text>
              </View>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>{completedReflections} completed</Text>
              </View>
            </View>

            <Text style={styles.proofDescription}>
              Generate a summary of your reflection journey for legal or personal records.
            </Text>

            <Pressable style={styles.downloadButton} onPress={downloadReflectionSummary}>
              <Ionicons name="download" size={16} color={ds.colors.primary.main} />
              <Text style={styles.downloadButtonText}>Download Reflection Summary</Text>
            </Pressable>
          </View>

          {/* Weekly Grounding Section - Designed for Social Media Sharing */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="leaf" size={20} color={ds.colors.primary.main} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Weekly Grounding</Text>
                <Text style={styles.sectionSubtitle}>Week {currentWeekNumber} inspiration</Text>
              </View>
            </View>

            {/* Social Media Shareable Image Card */}
            <View style={styles.groundingShareCard}>
              <View style={styles.groundingImageContainer}>
                <Image
                  source={getGroundingImageSource()}
                  style={styles.groundingImage}
                  resizeMode="contain"
                />
              </View>

              <Pressable style={styles.shareButton} onPress={shareGroundingImage}>
                <Ionicons name="share" size={16} color={ds.colors.primary.main} />
                <Text style={styles.shareButtonText}>Share This Image</Text>
              </Pressable>
            </View>
          </View>

          {/* Resource Library Section */}
          <View style={styles.resourceLibrarySection}>
            <Text style={styles.resourceLibraryTitle}>Resource Library</Text>
            <Text style={styles.resourceLibrarySubtitle}>Tools and support for your co-parenting journey</Text>

            <View style={styles.resourceGrid}>
              <Pressable style={styles.resourceCard}>
                <View style={styles.resourceIconContainer}>
                  <Ionicons name="heart" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.resourceTitle}>Feelings & Needs Bank</Text>
                <Text style={styles.resourceDescription}>Explore emotional vocabulary</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.text.tertiary} />
              </Pressable>

              <Pressable style={styles.resourceCard}>
                <View style={styles.resourceIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.resourceTitle}>Guardrails</Text>
                <Text style={styles.resourceDescription}>Healthy boundaries guide</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.text.tertiary} />
              </Pressable>

              <Pressable style={styles.resourceCard}>
                <View style={styles.resourceIconContainer}>
                  <Ionicons name="chatbubbles" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.resourceTitle}>Coaching</Text>
                <Text style={styles.resourceDescription}>Connect with certified coaches</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.text.tertiary} />
              </Pressable>

              <Pressable style={styles.resourceCard}>
                <View style={styles.resourceIconContainer}>
                  <Ionicons name="people" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.resourceTitle}>Community</Text>
                <Text style={styles.resourceDescription}>Join supportive discussions</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.text.tertiary} />
              </Pressable>

              <Pressable style={styles.resourceCard}>
                <View style={styles.resourceIconContainer}>
                  <Ionicons name="musical-notes" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.resourceTitle}>Soundbites</Text>
                <Text style={styles.resourceDescription}>Quick audio reflections</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.text.tertiary} />
              </Pressable>

              <Pressable style={styles.resourceCard}>
                <View style={styles.resourceIconContainer}>
                  <Ionicons name="library" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.resourceTitle}>Resources</Text>
                <Text style={styles.resourceDescription}>Articles and tools</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.text.tertiary} />
              </Pressable>
            </View>
          </View>

          {/* Legal Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Ionicons name="warning" size={16} color={ds.colors.warning} />
            <Text style={styles.disclaimerText}>⚠️ BeAligned does not offer legal advice or therapy</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.spacing[6],
    paddingBottom: ds.spacing[8],
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  tabScrollView: {
    paddingHorizontal: ds.spacing[4],
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[3],
    marginRight: ds.spacing[4],
  },
  tabLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Welcome Section
  welcomeSection: {
    backgroundColor: '#f0f7ff', // Light blue background
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    marginTop: ds.spacing[8],
    marginBottom: ds.spacing[6],
    ...ds.shadows.base,
  },
  welcomeTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  welcomeSubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Main Reflection Action
  reflectionActionCard: {
    backgroundColor: '#f0f7ff', // Light blue background
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[8],
    marginBottom: ds.spacing[6],
    alignItems: 'center',
    ...ds.shadows.base,
  },
  playButtonContainer: {
    marginBottom: ds.spacing[4],
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadows.lg,
  },
  actionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  actionSubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ds.colors.primary.main,
  },
  primaryButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  buttonIcon: {
    marginRight: ds.spacing[2],
  },

  // Section Cards
  sectionCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[6],
    ...ds.shadows.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing[3],
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  sectionSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
  },
  actionLinkText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Your Why Section
  quoteContainer: {
    backgroundColor: ds.colors.neutral[50],
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
  },
  quote: {
    fontSize: ds.typography.fontSize.base.size,
    fontStyle: 'italic',
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Streak Section
  streakBadge: {
    backgroundColor: ds.colors.primary.light + '20',
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  streakDaysText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
  },
  streakProgress: {
    marginTop: ds.spacing[2],
  },
  streakLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  streakProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
  },
  streakProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: ds.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    backgroundColor: ds.colors.primary.main,
    borderRadius: 4,
  },
  streakDaysLabel: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
  },
  streakGoal: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },

  // Proof Section
  completedBadge: {
    backgroundColor: ds.colors.success + '20',
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  completedText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.success,
    fontFamily: ds.typography.fontFamily.base,
  },
  proofDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
  },
  downloadButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Grounding Section - Social Media Optimized
  groundingShareCard: {
    backgroundColor: '#faf9f9',
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[4],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  groundingImageContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
  },
  groundingImage: {
    width: '100%',
    height: 200,
    borderRadius: ds.borderRadius.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
  },
  shareButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Resource Library
  resourceLibrarySection: {
    marginBottom: ds.spacing[8],
  },
  resourceLibraryTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  resourceLibrarySubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
  },
  resourceCard: {
    width: '47%',
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    alignItems: 'flex-start',
    ...ds.shadows.sm,
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[3],
  },
  resourceTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.heading,
  },
  resourceDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[2],
    flex: 1,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Disclaimer
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.warning + '10',
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[6],
  },
  disclaimerText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
})
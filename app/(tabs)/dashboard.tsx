import React, { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Share, Image, Modal, Alert, TextInput, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { Ionicons } from '@expo/vector-icons'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import TrialStatus from '../../components/TrialStatus'
import FeedbackSurvey from '../../components/FeedbackSurvey'
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
  const params = useLocalSearchParams()
  const scrollViewRef = useRef<ScrollView>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [firstName, setFirstName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [recentReflections, setRecentReflections] = useState<RecentReflection[]>([])
  const [inProgressSession, setInProgressSession] = useState<RecentReflection | null>(null)
  const [streakCount, setStreakCount] = useState(5)
  const [loading, setLoading] = useState(true)
  const [yourWhy, setYourWhy] = useState('Your Child\'s Stability = Your North Star')
  const [yourWhyQuote, setYourWhyQuote] = useState('')
  const [streakMessage, setStreakMessage] = useState('')
  const [weeklyGoal] = useState(5) // Default goal: 5 reflections per week (Monday-Sunday)
  const [weeklyReflections, setWeeklyReflections] = useState(0)
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false)
  const [socialMediaSettings, setSocialMediaSettings] = useState<any>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [showPlatformConfig, setShowPlatformConfig] = useState(false)
  const [completedReflections, setCompletedReflections] = useState(12)
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1)
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null)
  const [showFeedbackSurvey, setShowFeedbackSurvey] = useState(false)
  const [completedReflectionId, setCompletedReflectionId] = useState<string | null>(null)

  const navigationTabs: NavigationTab[] = [
    { id: 'reflection', label: 'Start Reflection', icon: 'play-circle-outline' },
    { id: 'why', label: 'Your Why', icon: 'heart-outline' },
    { id: 'streak', label: 'Streak', icon: 'flame-outline' },
    { id: 'proof', label: 'Proof', icon: 'document-outline' },
    { id: 'grounding', label: 'Grounding', icon: 'leaf-outline' },
    { id: 'resources', label: 'Resources', icon: 'library-outline' },
  ]

  const getStreakMessage = (streak: number, completedData: any[], weeklyGoal: number): string => {
    // Get start of current week (Monday)
    const now = new Date()
    const currentDay = now.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay // Handle Sunday as day 0
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() + mondayOffset)
    startOfWeek.setHours(0, 0, 0, 0)

    // Count reflections this week
    const thisWeekReflections = completedData.filter(session => {
      const sessionDate = new Date(session.completed_at!)
      return sessionDate >= startOfWeek
    }).length

    const remaining = Math.max(0, weeklyGoal - thisWeekReflections)
    const daysUntilSunday = (7 - currentDay) % 7 || 7

    // Dynamic messaging based on context
    if (streak === 0) {
      return 'Ready to start your reflection journey? Your first streak begins today!'
    } else if (thisWeekReflections >= weeklyGoal) {
      return `🎉 Weekly goal achieved! You've completed ${thisWeekReflections} reflections this week.`
    } else if (streak === 1) {
      return `Great start! You've begun your streak. ${remaining} more reflections to reach your weekly goal.`
    } else if (remaining === 1) {
      return `Almost there! Just 1 more reflection to reach your weekly goal.`
    } else if (daysUntilSunday <= 2 && remaining > 0) {
      return `Weekend push! ${remaining} more reflections needed by Sunday.`
    } else if (remaining > 0) {
      return `${remaining} more reflections to reach your weekly goal of ${weeklyGoal}.`
    } else {
      return `Keep the momentum going! Your ${streak}-day streak is building strong habits.`
    }
  }

  useEffect(() => {
    loadDashboardData()
    loadSocialMediaSettings()
  }, [])

  // Check for completed reflection feedback survey trigger
  useEffect(() => {
    if (params.showFeedback === 'true' && params.reflectionId) {
      setShowFeedbackSurvey(true)
      setCompletedReflectionId(params.reflectionId as string)
      // Clear the URL parameters to prevent re-showing on refresh
      router.replace('/(tabs)/dashboard')
    }
  }, [params])

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
          .select('role, your_why')
          .eq('id', session.user.id)
          .single()

        setIsAdmin(profileData?.role === 'admin')

        // Set user's Your Why or use default
        if (profileData?.your_why) {
          setYourWhy(profileData.your_why)
        }

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

        // Calculate streak count and completed reflections
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

          // Calculate consecutive day streak
          let streak = 0
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          // Get unique dates (in case multiple reflections on same day)
          const uniqueDates = [...new Set(completedData.map(session => {
            const date = new Date(session.completed_at!)
            date.setHours(0, 0, 0, 0)
            return date.getTime()
          }))].sort((a, b) => b - a) // Sort most recent first

          // Start checking from today or most recent reflection day
          let checkDate = new Date(Math.max(today.getTime(), uniqueDates[0]))
          checkDate.setHours(0, 0, 0, 0)

          for (let i = 0; i < uniqueDates.length; i++) {
            const reflectionDate = new Date(uniqueDates[i])
            const daysDiff = Math.floor((checkDate.getTime() - reflectionDate.getTime()) / (1000 * 60 * 60 * 24))

            if (daysDiff === 0) {
              // Found reflection on this day
              streak++
              checkDate.setDate(checkDate.getDate() - 1) // Move to previous day
            } else if (daysDiff === 1 && streak === 0) {
              // If no reflection today but one yesterday, start streak
              streak++
              checkDate = new Date(reflectionDate)
              checkDate.setDate(checkDate.getDate() - 1)
            } else {
              // Gap in streak, stop counting
              break
            }
          }

          setStreakCount(streak)

          // Calculate weekly progress for smart messaging
          const weeklyMessage = getStreakMessage(streak, completedData, weeklyGoal)
          setStreakMessage(weeklyMessage)

          // Calculate weekly reflections for progress bar
          const now = new Date()
          const currentDay = now.getDay()
          const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() + mondayOffset)
          startOfWeek.setHours(0, 0, 0, 0)

          const thisWeekCount = completedData.filter(session => {
            const sessionDate = new Date(session.completed_at!)
            return sessionDate >= startOfWeek
          }).length
          setWeeklyReflections(thisWeekCount)

          // Set personalized "Your Why" content based on completed reflections
          // TODO: In the future, this will be generated from cumulative chat responses
          setYourWhy('Your Child\'s Stability = Your North Star')
          setYourWhyQuote('Every reflection I do brings me closer to being the parent my child deserves. When I\'m centered, they feel secure.')
        } else {
          // No completed reflections yet - show first-time user content
          setCompletedReflections(0)
          setStreakCount(0)
          setWeeklyReflections(0)
          setStreakMessage('Start your first reflection to begin building your streak!')
          setYourWhy('Complete your first reflection to discover your personalized Why')
          setYourWhyQuote('Your personalized insights will appear here after your first reflection, based on your responses and goals.')
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSocialMediaSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('social_media_settings')
          .eq('id', session.user.id)
          .single()

        if (profileData?.social_media_settings) {
          setSocialMediaSettings(profileData.social_media_settings)
        }
      }
    } catch (error) {
      console.error('Error loading social media settings:', error)
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
    if (sectionId === 'reflection') {
      // Navigate to chat for reflection
      router.push('/(tabs)/chat')
      return
    }

    // For other sections, scroll to them within the dashboard
    scrollViewRef.current?.scrollTo({
      y: getSectionOffset(sectionId),
      animated: true
    })
  }

  const getSectionOffset = (sectionId: string): number => {
    // Fine-tuned offsets to position section headings at the top of viewport
    const offsets = {
      why: 350,        // Your Why section (increased to get past reflection card)
      streak: 630,     // Streak section (increased to get past the quote)
      proof: 850,      // Proof section (good as is)
      grounding: 1120, // Grounding section (decreased slightly to show heading)
      resources: 1480  // Resources section (slight adjustment up)
    }
    return offsets[sectionId as keyof typeof offsets] || 0
  }

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true
    })
  }

  const shareGroundingImage = async () => {
    setShowSocialMediaModal(true)
  }

  const handleSocialMediaShare = (platform: string) => {
    if (!socialMediaSettings || !socialMediaSettings[platform]) {
      // Platform not configured, show config modal
      setSelectedPlatform(platform)
      setShowPlatformConfig(true)
      setShowSocialMediaModal(false)
    } else {
      // Platform configured, post directly
      postToSocialMedia(platform)
    }
  }

  const postToSocialMedia = async (platform: string) => {
    try {
      const message = `Week ${currentWeekNumber} Grounding from BeAligned™\n\nBe grounded. Be clear. BeAligned.™\n\n#BeAligned #Mindfulness #CoParenting`

      // For now, we'll use web URLs to open social media platforms
      // In a production app, you'd integrate with each platform's API
      const platformUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://bealigned.app')}&quote=${encodeURIComponent(message)}`,
        instagram: 'instagram://camera', // Opens Instagram camera
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://bealigned.app')}&summary=${encodeURIComponent(message)}`
      }

      const url = platformUrls[platform as keyof typeof platformUrls]
      if (url) {
        await Linking.openURL(url)
        setShowSocialMediaModal(false)
      }
    } catch (error) {
      console.error('Error posting to social media:', error)
      Alert.alert('Error', 'Failed to open social media platform')
    }
  }

  const saveSocialMediaSettings = async (platform: string, settings: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const updatedSettings = {
          ...socialMediaSettings,
          [platform]: { ...settings, configured: true }
        }

        const { error } = await supabase
          .from('profiles')
          .update({ social_media_settings: updatedSettings })
          .eq('id', session.user.id)

        if (error) throw error

        setSocialMediaSettings(updatedSettings)
        setShowPlatformConfig(false)
        setSelectedPlatform(null)

        // Now post to the platform
        postToSocialMedia(platform)
      }
    } catch (error) {
      console.error('Error saving social media settings:', error)
      Alert.alert('Error', 'Failed to save social media settings')
    }
  }

  const downloadReflectionSummary = () => {
    // Implementation for downloading reflection summary
    console.log('Downloading reflection summary...')
  }

  const handleFeedbackSurveySubmit = () => {
    setShowFeedbackSurvey(false)
    setCompletedReflectionId(null)
    // Survey submission is handled within the FeedbackSurvey component
  }

  const handleFeedbackSurveySkip = () => {
    setShowFeedbackSurvey(false)
    setCompletedReflectionId(null)
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={scrollToTop} />

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

        {/* Feedback Survey */}
        {showFeedbackSurvey && (
          <View style={styles.content}>
            <FeedbackSurvey
              onSubmit={handleFeedbackSurveySubmit}
              onSkip={handleFeedbackSurveySkip}
              reflectionId={completedReflectionId}
            />
          </View>
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
              {completedReflections === 0 && inProgressSession
                ? 'Ready to resume your first reflection?'
                : completedReflections === 0
                ? 'Ready for your first reflection?'
                : 'Ready for your next reflection?'}
            </Text>
            <Text style={styles.actionSubtitle}>Transform today's challenges into tomorrow's wisdom</Text>

            <View style={styles.actionButtons}>
              {/* For first-time users with in-progress session, only show Continue button */}
              {completedReflections === 0 && inProgressSession ? (
                <Pressable
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => router.push(`/session/${inProgressSession.id}`)}
                >
                  <Ionicons name="refresh" size={16} color={ds.colors.text.inverse} style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Continue Reflection</Text>
                </Pressable>
              ) : (
                <>
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
                </>
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
            </View>

            {yourWhyQuote && (
              <View style={styles.quoteContainer}>
                <Text style={styles.quote}>
                  "{yourWhyQuote}"
                </Text>
              </View>
            )}
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
              <Text style={styles.streakLabel}>Weekly Progress</Text>
              <View style={styles.streakProgressContainer}>
                <View style={styles.streakProgressBar}>
                  <View style={[styles.streakProgressFill, { width: `${Math.min((weeklyReflections / weeklyGoal) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.streakDaysLabel}>{weeklyReflections}/{weeklyGoal}</Text>
              </View>
              <Text style={styles.streakGoal}>{streakMessage}</Text>
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

            {/* Enhanced Social Media Shareable Image Card */}
            <View style={styles.groundingShareCard}>
              <View style={styles.groundingImageContainer}>
                <Image
                  source={getGroundingImageSource()}
                  style={styles.groundingImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.shareButtonContainer}>
                <Pressable style={styles.shareButton} onPress={shareGroundingImage}>
                  <Ionicons name="share-social" size={18} color={ds.colors.text.inverse} />
                  <Text style={styles.shareButtonText}>Share to Social Media</Text>
                </Pressable>

                <Pressable style={styles.nativeShareButton} onPress={async () => {
                  try {
                    const message = `Week ${currentWeekNumber} Grounding from BeAligned™\n\nBe grounded. Be clear. BeAligned.™\n\n#BeAligned #Mindfulness #CoParenting`
                    await Share.share({
                      message: message,
                      title: `Week ${currentWeekNumber} Grounding - BeAligned™`
                    })
                  } catch (error) {
                    console.error('Error sharing:', error)
                  }
                }}>
                  <Ionicons name="share" size={16} color={ds.colors.primary.main} />
                  <Text style={styles.nativeShareButtonText}>Share</Text>
                </Pressable>
              </View>
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
            <Text style={styles.disclaimerText}>BeAligned does not offer legal advice or therapy</Text>
          </View>
        </View>
      </ScrollView>

      {/* Social Media Platform Selection Modal */}
      <Modal
        visible={showSocialMediaModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSocialMediaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share to Social Media</Text>
              <Pressable onPress={() => setShowSocialMediaModal(false)}>
                <Ionicons name="close" size={24} color={ds.colors.text.secondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Choose a platform to share your Week {currentWeekNumber} grounding</Text>

            <View style={styles.platformGrid}>
              <Pressable style={styles.platformButton} onPress={() => handleSocialMediaShare('twitter')}>
                <Ionicons name="logo-twitter" size={32} color="#1DA1F2" />
                <Text style={styles.platformName}>Twitter</Text>
                {socialMediaSettings?.twitter?.configured && (
                  <View style={styles.configuredBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={ds.colors.success} />
                  </View>
                )}
              </Pressable>

              <Pressable style={styles.platformButton} onPress={() => handleSocialMediaShare('facebook')}>
                <Ionicons name="logo-facebook" size={32} color="#4267B2" />
                <Text style={styles.platformName}>Facebook</Text>
                {socialMediaSettings?.facebook?.configured && (
                  <View style={styles.configuredBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={ds.colors.success} />
                  </View>
                )}
              </Pressable>

              <Pressable style={styles.platformButton} onPress={() => handleSocialMediaShare('instagram')}>
                <Ionicons name="logo-instagram" size={32} color="#E4405F" />
                <Text style={styles.platformName}>Instagram</Text>
                {socialMediaSettings?.instagram?.configured && (
                  <View style={styles.configuredBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={ds.colors.success} />
                  </View>
                )}
              </Pressable>

              <Pressable style={styles.platformButton} onPress={() => handleSocialMediaShare('linkedin')}>
                <Ionicons name="logo-linkedin" size={32} color="#0077B5" />
                <Text style={styles.platformName}>LinkedIn</Text>
                {socialMediaSettings?.linkedin?.configured && (
                  <View style={styles.configuredBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={ds.colors.success} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Platform Configuration Modal */}
      <Modal
        visible={showPlatformConfig}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlatformConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure {selectedPlatform?.charAt(0).toUpperCase()}{selectedPlatform?.slice(1)}</Text>
              <Pressable onPress={() => setShowPlatformConfig(false)}>
                <Ionicons name="close" size={24} color={ds.colors.text.secondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              First time sharing to {selectedPlatform}? We'll save your preferences for future sharing.
            </Text>

            <View style={styles.configForm}>
              <Text style={styles.configLabel}>Display Name (optional)</Text>
              <TextInput
                style={styles.configInput}
                placeholder="Your name as it appears on posts"
                placeholderTextColor={ds.colors.text.tertiary}
              />

              <View style={styles.configButtons}>
                <Pressable
                  style={styles.configButton}
                  onPress={() => saveSocialMediaSettings(selectedPlatform!, { displayName: '' })}
                >
                  <Text style={styles.configButtonText}>Save & Share</Text>
                </Pressable>

                <Pressable
                  style={styles.configCancelButton}
                  onPress={() => setShowPlatformConfig(false)}
                >
                  <Text style={styles.configCancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    minWidth: 140,
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
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.sm.size,
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

  // Enhanced Grounding Section - Social Media Optimized
  groundingShareCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[8],
    marginBottom: ds.spacing[6],
    borderWidth: 2,
    borderColor: ds.colors.primary.main + '20',
    ...ds.shadows.xl,
    elevation: 8,
  },
  groundingImageContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing[6],
    backgroundColor: ds.colors.neutral[50],
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    ...ds.shadows.md,
  },
  groundingImage: {
    width: '100%',
    height: 280,
    borderRadius: ds.borderRadius.lg,
  },
  shareButtonContainer: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    justifyContent: 'space-between',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.xl,
    flex: 1,
    ...ds.shadows.md,
  },
  shareButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  nativeShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.xl,
    minWidth: 80,
  },
  nativeShareButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
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

  // Social Media Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ds.colors.background.primary,
    borderTopLeftRadius: ds.borderRadius.xl,
    borderTopRightRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  modalTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  modalSubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
    justifyContent: 'space-between',
  },
  platformButton: {
    width: '47%',
    backgroundColor: ds.colors.neutral[50],
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    alignItems: 'center',
    position: 'relative',
    ...ds.shadows.sm,
  },
  platformName: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  configuredBadge: {
    position: 'absolute',
    top: ds.spacing[2],
    right: ds.spacing[2],
  },
  configForm: {
    gap: ds.spacing[4],
  },
  configLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  configInput: {
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    backgroundColor: ds.colors.background.primary,
  },
  configButtons: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginTop: ds.spacing[4],
  },
  configButton: {
    flex: 1,
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.lg,
    alignItems: 'center',
  },
  configButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  configCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.lg,
    alignItems: 'center',
  },
  configCancelButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
})
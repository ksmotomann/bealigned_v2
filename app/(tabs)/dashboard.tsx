import React, { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Share, Image, Modal, Alert, TextInput, TouchableOpacity, Linking } from 'react-native'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { Ionicons } from '@expo/vector-icons'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import TrialStatus from '../../components/TrialStatus'
import FeedbackSurvey from '../../components/FeedbackSurvey'
import WaveCircle from '../../components/WaveCircle'
import PulsatingHighlight from '../../components/PulsatingHighlight'
import ds from '../../styles/design-system'

interface RecentReflection {
  id: string
  created_at: string
  title: string
  status: 'in_progress' | 'completed' | 'archived'
  current_step: number
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
  const [completedReflections, setCompletedReflections] = useState(12)
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1)
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null)
  const [showFeedbackSurvey, setShowFeedbackSurvey] = useState(false)
  const [completedReflectionId, setCompletedReflectionId] = useState<string | null>(null)
  const [daysSinceLastReflection, setDaysSinceLastReflection] = useState(0)
  const [daysSinceRegistration, setDaysSinceRegistration] = useState(0)
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false)
  const [showSocialMediaSetup, setShowSocialMediaSetup] = useState(false)
  const [socialMediaSettings, setSocialMediaSettings] = useState<any>({})
  const [setupPlatform, setSetupPlatform] = useState('')

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
          .select('role, your_why, social_media_settings')
          .eq('id', session.user.id)
          .single()

        setIsAdmin(profileData?.role === 'admin')

        // Set user's Your Why or use default
        if (profileData?.your_why) {
          setYourWhy(profileData.your_why)
        }

        // Load social media settings
        if (profileData?.social_media_settings) {
          setSocialMediaSettings(profileData.social_media_settings)
        }

        // Get user registration date
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

        // Calculate days since last reflection and registration
        if (completedData && completedData.length > 0) {
          const lastReflectionDate = new Date(completedData[0].completed_at!)
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - lastReflectionDate.getTime())
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          setDaysSinceLastReflection(diffDays)
        }

        if (userData?.created_at) {
          const registrationDate = new Date(userData.created_at)
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - registrationDate.getTime())
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          setDaysSinceRegistration(diffDays)
        }

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



  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true
    })
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

  const getGroundingImageUri = async (): Promise<string | null> => {
    try {
      // Create mapping of week numbers to actual image file names
      const imageFiles = {
        1: 'WK1.png', 2: 'WK2.png', 3: 'WK3.png', 4: 'WK4.png',
        5: 'WK5.png', 6: 'WK6.png', 7: 'WK7.png', 8: 'WK8.png',
        9: 'WK9.png', 10: 'WK10.png', 11: 'WK11.png', 12: 'WK12.png'
      }

      const filename = imageFiles[currentWeekNumber as keyof typeof imageFiles] || 'WK1.png'

      // For web, we'll use a different approach
      if (Platform.OS === 'web') {
        return null // Will fall back to text-only sharing
      }

      // For mobile, copy the bundled asset to a shareable location
      const assetUri = `${FileSystem.bundleDirectory}assets/grounding/${filename}`
      const localUri = `${FileSystem.documentDirectory}BeAligned_Week${currentWeekNumber}_Grounding.png`

      // Check if the asset exists and copy it
      const assetInfo = await FileSystem.getInfoAsync(assetUri)
      if (assetInfo.exists) {
        await FileSystem.copyAsync({
          from: assetUri,
          to: localUri
        })
        return localUri
      }

      return null
    } catch (error) {
      console.error('Error getting image URI:', error)
      return null
    }
  }

  const shareImageWithMessage = async (message: string) => {
    try {
      // First try to get the image URI
      const imageUri = await getGroundingImageUri()

      if (imageUri && Platform.OS !== 'web') {
        // Share with image on mobile platforms
        const isAvailable = await Sharing.isAvailableAsync()
        if (isAvailable) {
          await Sharing.shareAsync(imageUri, {
            mimeType: 'image/png',
            dialogTitle: `Week ${currentWeekNumber} Grounding from BeAligned™`
          })
          return true
        }
      }

      // Fallback to text-only sharing (works on all platforms)
      await Share.share({
        message: `${message}\n\n🖼️ View Week ${currentWeekNumber} Grounding Card at: https://bealigned.com/grounding/week-${currentWeekNumber}`,
        title: `Week ${currentWeekNumber} Grounding from BeAligned™`,
      })

      return true
    } catch (error) {
      console.error('Error sharing:', error)
      return false
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

  const handleSocialMediaShare = () => {
    setShowSocialMediaModal(true)
  }

  const shareToSocialMedia = async (platform: string) => {
    const message = `Week ${currentWeekNumber} Grounding from BeAligned™\n\nBe grounded. Be clear. BeAligned.™\n\n#BeAligned #Mindfulness #CoParenting`

    try {
      let shareUrl = ''
      switch (platform) {
        case 'facebook':
          console.log('🔄 Facebook sharing triggered - DEBUG MODE')
          console.log('📊 Current week number:', currentWeekNumber)
          console.log('💬 Message:', message)

          // Facebook sharing with weekly grounding card image URL
          try {
            // Smart URL detection for Facebook sharing
            // This automatically works on any deployment without configuration
            const getBaseUrl = () => {
              if (Platform.OS === 'web') {
                // Development: use localhost
                if (window.location.hostname === 'localhost') {
                  return `http://localhost:8081`
                }

                // Production: smart detection
                const hostname = window.location.hostname
                const protocol = window.location.protocol

                // Check for common deployment patterns
                if (hostname.includes('vercel.app') ||
                    hostname.includes('netlify.app') ||
                    hostname.includes('herokuapp.com') ||
                    hostname.includes('bealigned.com')) {
                  return `${protocol}//${hostname}`
                }

                // Environment variable override (optional)
                if (process.env.EXPO_PUBLIC_BASE_URL) {
                  return process.env.EXPO_PUBLIC_BASE_URL
                }

                // Fallback to current domain
                return `${protocol}//${hostname}`
              }

              // Mobile/native: always use production URL
              return process.env.EXPO_PUBLIC_BASE_URL || 'https://bealigned.com'
            }

            const baseUrl = getBaseUrl()
            const imageUrl = `${baseUrl}/images/be_grounding_wk${currentWeekNumber}.png`
            const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${encodeURIComponent(message)}`

            console.log('🔧 Runtime Detection Debug:')
            console.log('  - Platform.OS:', Platform.OS)
            if (Platform.OS === 'web') {
              console.log('  - window.location.hostname:', window.location.hostname)
              console.log('  - window.location.protocol:', window.location.protocol)
            }
            console.log('  - Environment EXPO_PUBLIC_BASE_URL:', process.env.EXPO_PUBLIC_BASE_URL)
            console.log('  - Detected Base URL:', baseUrl)
            console.log('🖼️ Final Image URL:', imageUrl)
            console.log('📤 Facebook share URL:', facebookShareUrl)

            // Show user confirmation of what's being shared
            Alert.alert(
              'Facebook Sharing Debug',
              `Week ${currentWeekNumber} Grounding Card:\nbe_grounding_wk${currentWeekNumber}.png\n\nImage URL:\n${imageUrl}\n\nFacebook URL:\n${facebookShareUrl}`,
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => {
                    console.log('❌ Facebook sharing cancelled')
                    setShowSocialMediaModal(false)
                  }
                },
                {
                  text: 'Share',
                  onPress: async () => {
                    console.log('✅ Facebook sharing confirmed - opening URL...')
                    try {
                      if (Platform.OS === 'web') {
                        console.log('🌐 Opening in browser window...')
                        window.open(facebookShareUrl, '_blank')
                      } else {
                        console.log('📱 Opening with Linking...')
                        await Linking.openURL(facebookShareUrl)
                      }
                      console.log('✅ Facebook sharing completed successfully')
                    } catch (error) {
                      console.error('❌ Error opening Facebook URL:', error)
                    }
                    setShowSocialMediaModal(false)
                  }
                }
              ]
            )
            return
          } catch (error) {
            console.error('❌ Facebook sharing error:', error)
            // Fallback to basic Facebook sharing
            shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(message)}&u=${encodeURIComponent('https://bealigned.com')}`
            console.log('🔄 Using fallback URL:', shareUrl)
            await Linking.openURL(shareUrl)
            setShowSocialMediaModal(false)
            return
          }
        case 'twitter':
          // Check if user has credentials for Twitter
          if (!socialMediaSettings[platform]) {
            setSetupPlatform(platform)
            setShowSocialMediaSetup(true)
            setShowSocialMediaModal(false)
            return
          }
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
          break
        case 'linkedin':
          // Check if user has credentials for LinkedIn
          if (!socialMediaSettings[platform]) {
            setSetupPlatform(platform)
            setShowSocialMediaSetup(true)
            setShowSocialMediaModal(false)
            return
          }
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?title=${encodeURIComponent('BeAligned Weekly Grounding')}&summary=${encodeURIComponent(message)}`
          break
        case 'instagram':
          // Instagram doesn't support direct URL sharing, provide instructions for image sharing
          Alert.alert(
            'Share to Instagram',
            `Perfect! Here's how to share your Week ${currentWeekNumber} grounding card:\n\n1. Save the grounding image to your photos\n2. Open Instagram\n3. Create a new post/story\n4. Use the saved image\n5. Add this caption:\n\n"${message}"`,
            [
              { text: 'Got it!', onPress: () => setShowSocialMediaModal(false) }
            ]
          )
          return
        default:
          await Share.share({ message: message })
          return
      }

      await Linking.openURL(shareUrl)
      setShowSocialMediaModal(false)
    } catch (error) {
      console.error('Error sharing to social media:', error)
      Alert.alert('Error', 'Failed to share to social media. Please try again.')
    }
  }

  const saveSocialMediaSettings = async (settings: any) => {
    try {
      if (!session?.user) return

      const { error } = await supabase
        .from('profiles')
        .update({ social_media_settings: settings })
        .eq('id', session.user.id)

      if (error) throw error

      setSocialMediaSettings(settings)
    } catch (error) {
      console.error('Error saving social media settings:', error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={scrollToTop} />

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* New Header Section */}
        <View style={styles.newHeaderSection}>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>👋 Welcome back, {firstName || 'Trina'}</Text>
          </View>

          <View style={styles.statsRow}>
            <WaveCircle
              size={60}
              color={ds.colors.primary.main}
              waveColor={`${ds.colors.primary.main}30`}
              waveCount={3}
              duration={2500}
            >
              <View style={styles.statsCircle}>
                {/* Circle is now just the container for the wave effect */}
              </View>
            </WaveCircle>
            <View style={styles.statsTextContainer}>
              <View style={styles.statsNumberContainer}>
                <Text style={styles.statsNumber}>{completedReflections}</Text>
                <Text style={styles.statsLabel}>Reflections Completed</Text>
              </View>
              <Text style={styles.statsSubtitle}>
                You have had {completedReflections} reflections over the past {daysSinceRegistration} days
              </Text>
              {daysSinceLastReflection > 0 && (
                <Text style={styles.lastReflectionText}>
                  Last reflection {daysSinceLastReflection} day{daysSinceLastReflection !== 1 ? 's' : ''} ago
                </Text>
              )}
            </View>
          </View>

          <Text style={styles.motivationalMessage}>
            Your commitment to pause, reflect, and align is creating lasting change
          </Text>
        </View>
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
                ? 'Ready to complete your first reflection?'
                : completedReflections === 0
                ? 'Ready for your first reflection?'
                : 'Ready for your next reflection?'}
            </Text>
            <Text style={styles.actionSubtitle}>Transform today's challenges into tomorrow's wisdom</Text>

            <View style={styles.actionButtons}>
              {/* For first-time users with in-progress session, only show Continue button if they haven't progressed past initial steps */}
              {completedReflections === 0 && inProgressSession && inProgressSession.current_step <= 2 ? (
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

          {/* Your Core Why Section */}
          <View style={styles.yourCoreWhyCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={20} color={ds.colors.primary.main} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Your Core Why</Text>
                <Text style={styles.sectionSubtitle}>Through your reflections, this value consistently guides your co-parenting decisions</Text>
              </View>
            </View>

            {/* Blue highlighted foundational value box with pulsating effect */}
            <PulsatingHighlight
              color="rgba(0,150,255,0.3)"
              ringCount={3}
              scale={1.4}
              duration={6000}
            >
              <View style={styles.blueFoundationalBox}>
                <View style={styles.foundationalValueHeader}>
                  <Ionicons name="heart" size={16} color={ds.colors.text.inverse} />
                  <Text style={styles.whiteFoundationalValueTitle}>Your Child's Stability</Text>
                </View>
                <Text style={styles.whiteFoundationalValueDescription}>
                  This foundational value appears in 91% of your reflections, serving as your North Star for co-parenting decisions.
                </Text>
                <View style={styles.whiteConsistencyBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={ds.colors.text.inverse} />
                  <Text style={styles.whiteConsistencyText}>Consistently identified across {completedReflections} reflections</Text>
                </View>
              </View>
            </PulsatingHighlight>

            {/* Reminder box */}
            <View style={styles.reminderBox}>
              <Text style={styles.reminderText}>
                <Text style={styles.reminderBold}>Remember:</Text> When co-parenting feels overwhelming, return to this core value. Let your child's stability guide your next steps forward.
              </Text>
            </View>
          </View>

          {/* Past Reflections Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={20} color={ds.colors.primary.main} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Past Reflections</Text>
              </View>
              <Pressable style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.primary.main} />
              </Pressable>
            </View>

            {/* Past Reflections List */}
            <View style={styles.pastReflectionsList}>
              {recentReflections.filter(r => r.status === 'completed').slice(0, 3).map((reflection, index) => (
                <View key={reflection.id} style={styles.pastReflectionItem}>
                  <View style={styles.pastReflectionMain}>
                    <View style={styles.pastReflectionLeft}>
                      <Text style={styles.pastReflectionDate}>
                        {new Date(reflection.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.pastReflectionTitle}>
                        {reflection.title || `Reflection Session ${index + 1}`}
                      </Text>
                      <View style={styles.completedStatusBadge}>
                        <Text style={styles.completedStatusText}>Complete</Text>
                      </View>
                    </View>
                    <Pressable style={styles.viewReflectionButton}>
                      <Ionicons name="eye" size={16} color={ds.colors.primary.main} />
                      <Text style={styles.viewReflectionText}>View</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {recentReflections.filter(r => r.status === 'completed').length === 0 && (
                <View style={styles.emptyReflectionsContainer}>
                  <Text style={styles.emptyReflectionsText}>
                    Complete your first reflection to see your journey here
                  </Text>
                </View>
              )}
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

          {/* Weekly Grounding Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="leaf" size={20} color={ds.colors.primary.main} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Weekly Grounding</Text>
                <Text style={styles.sectionSubtitle}>Inspiration for your journey</Text>
              </View>
            </View>

            {/* Weekly Grounding Image */}
            <View style={styles.groundingImageCard}>
              <View style={styles.groundingImageContainer}>
                <Image
                  source={getGroundingImageSource()}
                  style={styles.groundingWeeklyImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.groundingShareContainer}>
                <Pressable style={styles.socialMediaPrimaryButton} onPress={handleSocialMediaShare}>
                  <Ionicons name="logo-twitter" size={20} color={ds.colors.text.inverse} />
                  <Text style={styles.socialMediaPrimaryText}>Share on Social Media</Text>
                </Pressable>

                <Pressable style={styles.shareGroundingSecondaryButton} onPress={async () => {
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
                  <Ionicons name="share-outline" size={20} color={ds.colors.primary.main} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Quick Access Section */}
          <View style={styles.quickAccessSection}>
            <Text style={styles.quickAccessTitle}>Quick Access</Text>
            <Text style={styles.quickAccessSubtitle}>Tools and support for your co-parenting journey</Text>

            <View style={styles.quickAccessGrid}>
              <Pressable style={styles.quickAccessCard}>
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="star" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.quickAccessCardTitle}>Feedback Survey</Text>
                <Text style={styles.quickAccessCardDescription}>Share your reflection experience</Text>
              </Pressable>

              <Pressable style={styles.quickAccessCard}>
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="heart" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.quickAccessCardTitle}>Free First Why</Text>
                <Text style={styles.quickAccessCardDescription}>Connect with a BeH2O Certified Coach</Text>
                <Text style={styles.quickAccessCardSubtext}>FREE 15-minute coaching session</Text>
              </Pressable>

              <Pressable style={styles.quickAccessCard}>
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="library" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.quickAccessCardTitle}>Resource Library</Text>
                <Text style={styles.quickAccessCardDescription}>Feelings & Needs Bank and Guardrails</Text>
              </Pressable>

              <Pressable style={styles.quickAccessCard}>
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="document-text" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.quickAccessCardTitle}>Proof of Reflection</Text>
                <Text style={styles.quickAccessCardDescription}>Request personalized certificate</Text>
              </Pressable>

              <Pressable style={styles.quickAccessCard}>
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="mic" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.quickAccessCardTitle}>Founder Soundbite Request</Text>
                <Text style={styles.quickAccessCardDescription}>Request personalized guidance</Text>
              </Pressable>

              <Pressable style={styles.quickAccessCard}>
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="people" size={24} color={ds.colors.primary.main} />
                </View>
                <Text style={styles.quickAccessCardTitle}>BeAligned Community Access</Text>
                <Text style={styles.quickAccessCardDescription}>Be part of the BeAligned Community</Text>
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

      {/* Social Media Share Modal */}
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
                <Ionicons name="close" size={24} color={ds.colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Choose your platform:</Text>

            <View style={styles.socialPlatforms}>
              <Pressable style={styles.platformButton} onPress={() => shareToSocialMedia('twitter')}>
                <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                <Text style={styles.platformText}>Twitter</Text>
              </Pressable>

              <Pressable style={styles.platformButton} onPress={() => shareToSocialMedia('facebook')}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                <Text style={styles.platformText}>Facebook</Text>
              </Pressable>

              <Pressable style={styles.platformButton} onPress={() => shareToSocialMedia('linkedin')}>
                <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
                <Text style={styles.platformText}>LinkedIn</Text>
              </Pressable>

              <Pressable style={styles.platformButton} onPress={() => shareToSocialMedia('instagram')}>
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                <Text style={styles.platformText}>Instagram</Text>
              </Pressable>
            </View>

            <Pressable style={styles.genericShareButton} onPress={() => shareToSocialMedia('generic')}>
              <Ionicons name="share" size={20} color={ds.colors.primary.main} />
              <Text style={styles.genericShareText}>Use Device Share Menu</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Social Media Setup Modal */}
      <Modal
        visible={showSocialMediaSetup}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSocialMediaSetup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set up {setupPlatform?.charAt(0).toUpperCase() + setupPlatform?.slice(1)}</Text>
              <Pressable onPress={() => setShowSocialMediaSetup(false)}>
                <Ionicons name="close" size={24} color={ds.colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Connect your {setupPlatform} account to share directly to your profile.
            </Text>

            <View style={styles.setupForm}>
              <Text style={styles.setupLabel}>Account Handle/Username:</Text>
              <TextInput
                style={styles.setupInput}
                placeholder={`@your${setupPlatform}handle`}
                placeholderTextColor={ds.colors.text.tertiary}
                onChangeText={(text) => {
                  const newSettings = { ...socialMediaSettings }
                  newSettings[setupPlatform] = { handle: text }
                  setSocialMediaSettings(newSettings)
                }}
                value={socialMediaSettings[setupPlatform]?.handle || ''}
              />
            </View>

            <View style={styles.setupActions}>
              <Pressable
                style={styles.setupCancelButton}
                onPress={() => setShowSocialMediaSetup(false)}
              >
                <Text style={styles.setupCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.setupSaveButton}
                onPress={async () => {
                  await saveSocialMediaSettings(socialMediaSettings)
                  setShowSocialMediaSetup(false)
                  // Now proceed with sharing
                  shareToSocialMedia(setupPlatform)
                }}
              >
                <Text style={styles.setupSaveText}>Save & Share</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.spacing[10], // Increased from 6 to 10 for more white space
    paddingBottom: ds.spacing[8],
  },

  // New Header Section
  newHeaderSection: {
    backgroundColor: '#f0f7ff', // Light blue tinted background
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[6],
    borderRadius: ds.borderRadius.xl,
    marginTop: ds.spacing[6], // Add margin below nav
    marginBottom: ds.spacing[6],
    marginHorizontal: ds.spacing[4], // Match other panels width
    ...ds.shadows.lg,
  },
  welcomeRow: {
    marginBottom: ds.spacing[4],
  },
  welcomeText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  statsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsNumberContainer: {
    marginLeft: ds.spacing[4],
  },
  statsNumber: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
    lineHeight: ds.typography.fontSize['3xl'].size,
  },
  statsLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  statsTextContainer: {
    flex: 1,
  },
  statsTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[1],
  },
  statsSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.sm.lineHeight + 2,
  },
  lastReflectionText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  motivationalMessage: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.sm.lineHeight + 4,
  },


  // Main Reflection Action
  reflectionActionCard: {
    backgroundColor: '#f0f7ff', // Light blue tinted background
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[8],
    marginBottom: ds.spacing[6],
    marginHorizontal: ds.spacing[4], // Match header section width
    alignItems: 'center',
    ...ds.shadows.lg,
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
    marginHorizontal: ds.spacing[4], // Match other panels width
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

  // Your Core Why Section - White with Grey Border
  yourCoreWhyCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[6],
    marginHorizontal: ds.spacing[4], // Match other panels width
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    ...ds.shadows.lg,
  },
  // Blue Inner Box for "Your Child's Stability"
  blueFoundationalBox: {
    backgroundColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    marginVertical: ds.spacing[4],
  },
  whiteFoundationalValueTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    marginLeft: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  whiteFoundationalValueDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
    opacity: 0.9,
  },
  whiteConsistencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.full,
    alignSelf: 'flex-start',
  },
  whiteConsistencyText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.inverse,
    marginLeft: ds.spacing[1],
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  foundationalValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing[2],
  },
  reminderBox: {
    backgroundColor: ds.colors.neutral[50],
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    marginTop: ds.spacing[4],
  },
  reminderText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.sm.lineHeight + 4,
    fontFamily: ds.typography.fontFamily.base,
  },
  reminderBold: {
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
  },

  // Past Reflections Section
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
  },
  viewAllText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  pastReflectionsList: {
    marginTop: ds.spacing[4],
  },
  pastReflectionItem: {
    paddingVertical: ds.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
  },
  pastReflectionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastReflectionLeft: {
    flex: 1,
  },
  pastReflectionDate: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[1],
  },
  pastReflectionTitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[2],
  },
  completedStatusBadge: {
    backgroundColor: ds.colors.success + '15',
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  completedStatusText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.success,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  viewReflectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderWidth: 1,
    borderColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.md,
    backgroundColor: 'transparent',
  },
  viewReflectionText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  emptyReflectionsContainer: {
    paddingVertical: ds.spacing[8],
    alignItems: 'center',
  },
  emptyReflectionsText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
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

  // Weekly Grounding - Image Design
  groundingImageCard: {
    alignItems: 'center',
    marginTop: ds.spacing[4],
  },
  groundingImageContainer: {
    alignSelf: 'center',
    marginBottom: ds.spacing[4],
    borderRadius: ds.borderRadius.xl,
    backgroundColor: ds.colors.background.primary,
    ...ds.shadows.xl,
    // Enhanced soft shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    // Soft border
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: ds.spacing[2],
  },
  groundingWeeklyImage: {
    width: 389, // 20% bigger than 324px
    height: 259, // 20% bigger than 216px
    borderRadius: ds.borderRadius.lg,
  },

  // Quick Access Section
  quickAccessSection: {
    marginBottom: ds.spacing[8],
    marginHorizontal: ds.spacing[4], // Match other panels width
  },
  quickAccessTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  quickAccessSubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
  },
  quickAccessCard: {
    width: '47%',
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    alignItems: 'flex-start',
    ...ds.shadows.sm,
    minHeight: 120,
  },
  quickAccessIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[3],
  },
  quickAccessCardTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
    lineHeight: ds.typography.fontSize.base.lineHeight,
  },
  quickAccessCardDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.sm.lineHeight + 2,
  },
  quickAccessCardSubtext: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
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

  // Social Media Sharing Styles
  groundingShareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ds.spacing[3],
  },
  socialMediaPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.lg,
    flex: 1,
    ...ds.shadows.base,
  },
  socialMediaPrimaryText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  shareGroundingSecondaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ds.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.primary.main,
    ...ds.shadows.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    margin: ds.spacing[6],
    minWidth: 300,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  modalTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  modalSubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  socialPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[3],
    marginBottom: ds.spacing[6],
  },
  platformButton: {
    alignItems: 'center',
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
    backgroundColor: ds.colors.neutral[50],
    minWidth: 80,
    flex: 1,
  },
  platformText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  genericShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    padding: ds.spacing[3],
    borderWidth: 1,
    borderColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  genericShareText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },

  // Social Media Setup Modal Styles
  setupForm: {
    marginVertical: ds.spacing[6],
  },
  setupLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  setupInput: {
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    fontFamily: ds.typography.fontFamily.base,
    backgroundColor: ds.colors.background.primary,
  },
  setupActions: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginTop: ds.spacing[4],
  },
  setupCancelButton: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  setupCancelText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  setupSaveButton: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    backgroundColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    ...ds.shadows.sm,
  },
  setupSaveText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },

})
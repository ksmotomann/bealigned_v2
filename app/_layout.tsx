import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useRouter, useSegments } from 'expo-router'
import { Platform } from 'react-native'
import { SEOProvider } from '../context/SEOContext'
import { AdminProvider } from '../contexts/AdminContext'
import LegalAcknowledgmentModal from '../components/LegalAcknowledgmentModal'
import AppTourModal from '../components/AppTourModal'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProxyContext, setIsProxyContext] = useState(false)
  const [requiresLegalAcknowledgment, setRequiresLegalAcknowledgment] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [requiresTour, setRequiresTour] = useState(false)
  const [showTourModal, setShowTourModal] = useState(false)
  const [requiresFirstReflection, setRequiresFirstReflection] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null)
  const router = useRouter()
  const segments = useSegments()

  // Load Nunito font for web and detect proxy context
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Add Google Fonts link
      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)

      // Set as default font
      document.body.style.fontFamily = '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

      // Detect if we're in a proxy context (accessed via bealigned.app)
      const currentOrigin = window.location.origin
      const referrer = document.referrer

      if (currentOrigin.includes('bealigned.vercel.app') &&
          (referrer.includes('bealigned.app') || window.location.pathname === '/login')) {
        setIsProxyContext(true)
        console.log('🔄 Proxy context detected - disabling automatic redirects')
      }
    }
  }, [])

  // Check user's legal acknowledgment and tour status
  const checkUserOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('requires_legal_acknowledgment, terms_acknowledged_at, privacy_acknowledged_at, tour_completed_at, first_reflection_completed_at, approval_status')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error checking user onboarding status:', error)
        return
      }

      // Set approval status
      setApprovalStatus(data?.approval_status || 'approved')

      // Check if user is pending approval - if so, route to pending approval page
      if (data?.approval_status === 'pending') {
        router.replace('/pending-approval')
        return
      }

      const needsAcknowledgment = data?.requires_legal_acknowledgment ||
                                 !data?.terms_acknowledged_at ||
                                 !data?.privacy_acknowledged_at

      const needsTour = !data?.tour_completed_at
      const needsFirstReflection = !data?.first_reflection_completed_at

      setRequiresLegalAcknowledgment(needsAcknowledgment)
      setRequiresTour(needsTour)
      setRequiresFirstReflection(needsFirstReflection)
    } catch (error) {
      console.error('Error checking user onboarding status:', error)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) {
        checkUserOnboardingStatus(session.user.id)
      }
      setIsLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.id) {
        checkUserOnboardingStatus(session.user.id)
      } else {
        setRequiresLegalAcknowledgment(false)
        setShowLegalModal(false)
        setRequiresTour(false)
        setShowTourModal(false)
        setRequiresFirstReflection(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isLoading) return

    // Skip automatic redirects if we're in a proxy context
    if (isProxyContext) {
      console.log('🔄 Skipping auto-redirect due to proxy context')
      return
    }

    const inAuthGroup = segments[0] === '(auth)'
    const inTabsGroup = segments[0] === '(tabs)'
    const onPendingApproval = segments.includes('pending-approval')

    // If user is on pending-approval page, don't redirect them
    if (onPendingApproval) {
      return
    }

    // If user has pending approval status and tries to access tabs, redirect to pending-approval
    if (session && approvalStatus === 'pending' && inTabsGroup) {
      router.replace('/pending-approval')
      return
    }

    if (!session && inTabsGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Check if user needs legal acknowledgment before proceeding
      if (requiresLegalAcknowledgment) {
        setShowLegalModal(true)
      } else if (requiresTour) {
        setShowTourModal(true)
      } else if (requiresFirstReflection) {
        // Allow users to navigate freely, but start them on the chat screen
        router.replace('/(tabs)/chat')
      } else {
        router.replace('/(tabs)/dashboard')
      }
    } else if (session && inTabsGroup) {
      // Show modals if user is in tabs but hasn't completed onboarding
      if (requiresLegalAcknowledgment) {
        setShowLegalModal(true)
      } else if (requiresTour) {
        setShowTourModal(true)
      }
      // Remove automatic chat redirect - allow users to navigate freely during first reflection
    }
  }, [session, segments, isLoading, isProxyContext, requiresLegalAcknowledgment, requiresTour, requiresFirstReflection, approvalStatus])

  const handleLegalAcknowledgmentComplete = () => {
    setShowLegalModal(false)
    setRequiresLegalAcknowledgment(false)

    // After legal acknowledgment, check if tour is needed
    if (requiresTour) {
      setShowTourModal(true)
    } else if (requiresFirstReflection) {
      router.replace('/(tabs)/chat')
    } else {
      router.replace('/(tabs)/dashboard')
    }
  }

  const handleTourComplete = () => {
    setShowTourModal(false)
    setRequiresTour(false)

    // After tour completion, allow users to navigate freely
    // Start first-time users on chat but don't force them to stay there
    if (requiresFirstReflection) {
      router.replace('/(tabs)/chat')
    } else {
      router.replace('/(tabs)/dashboard')
    }
  }

  return (
    <SafeAreaProvider>
      <AdminProvider>
        <SEOProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(marketing)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          {session?.user?.id && (
            <>
              <LegalAcknowledgmentModal
                visible={showLegalModal}
                onComplete={handleLegalAcknowledgmentComplete}
                userId={session.user.id}
              />
              <AppTourModal
                visible={showTourModal}
                onComplete={handleTourComplete}
                userId={session.user.id}
              />
            </>
          )}
        </SEOProvider>
      </AdminProvider>
    </SafeAreaProvider>
  )
}
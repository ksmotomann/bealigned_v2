import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useRouter, useSegments } from 'expo-router'
import { Platform } from 'react-native'
import { SEOProvider } from '../context/SEOContext'
import { AdminProvider } from '../contexts/AdminContext'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProxyContext, setIsProxyContext] = useState(false)
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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

    if (!session && inTabsGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/dashboard')
    }
  }, [session, segments, isLoading, isProxyContext])

  return (
    <SafeAreaProvider>
      <AdminProvider>
        <SEOProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(marketing)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SEOProvider>
      </AdminProvider>
    </SafeAreaProvider>
  )
}
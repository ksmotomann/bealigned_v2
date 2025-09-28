import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

export default function Index() {
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false)

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Check if accessed via /login proxy (referrer will be bealigned.app/login)
      const referrer = document.referrer
      const currentUrl = window.location.href

      // If referrer contains bealigned.app/login or we're in a proxy context
      if (referrer.includes('bealigned.app/login') ||
          currentUrl.includes('bealigned.vercel.app') && referrer.includes('bealigned.app')) {
        setShouldRedirectToLogin(true)
      }
    }
  }, [])

  if (shouldRedirectToLogin) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(marketing)" />
}
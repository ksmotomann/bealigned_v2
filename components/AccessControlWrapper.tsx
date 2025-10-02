import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'
import BeBetaUserLanding from './BeBetaUserLanding'
import ds from '../styles/design-system'

interface AccessControlWrapperProps {
  children: React.ReactNode
}

export default function AccessControlWrapper({ children }: AccessControlWrapperProps) {
  const [loading, setLoading] = useState(true)
  const [accessStatus, setAccessStatus] = useState<string>('full_access')
  const [landingMessage, setLandingMessage] = useState<any>(null)

  useEffect(() => {
    checkAccessStatus()
  }, [])

  const checkAccessStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Get user's profile with app_access_status
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('app_access_status, alignment_code_used')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setAccessStatus('full_access')
        setLoading(false)
        return
      }

      const status = profile?.app_access_status || 'full_access'
      setAccessStatus(status)

      // If restricted, get the custom landing message from alignment code
      if (status === 'restrict_with_landing' && profile?.alignment_code_used) {
        const { data: codeData } = await supabase
          .from('alignment_codes')
          .select('custom_landing_message')
          .eq('code', profile.alignment_code_used)
          .single()

        if (codeData?.custom_landing_message) {
          setLandingMessage(codeData.custom_landing_message)
        }
      }

    } catch (error) {
      console.error('Error checking access status:', error)
      setAccessStatus('full_access')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.colors.background.secondary }}>
        <ActivityIndicator size="large" color={ds.colors.primary.main} />
      </View>
    )
  }

  // Show restricted landing page if user's access is restricted
  if (accessStatus === 'restrict_with_landing') {
    return (
      <BeBetaUserLanding
        title={landingMessage?.title}
        message={landingMessage?.message}
      />
    )
  }

  // Show full app access for other statuses
  return <>{children}</>
}

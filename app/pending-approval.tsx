import React, { useEffect } from 'react'
import { View, StyleSheet, Image, Pressable, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

export default function PendingApprovalPage() {
  const router = useRouter()
  const { width, height } = useWindowDimensions()

  // Prevent navigation away from this page
  useEffect(() => {
    const checkApprovalStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/(auth)/login')
        return
      }

      // Check if user is approved
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', user.id)
        .single()

      if (profile?.approval_status === 'approved') {
        router.replace('/(tabs)/dashboard')
      }
    }

    checkApprovalStatus()

    // Check approval status every 30 seconds
    const interval = setInterval(checkApprovalStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        {/* Sign Out Button in top right */}
        <View style={styles.signOutContainer}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={ds.colors.text.secondary} />
          </Pressable>
        </View>

        {/* BeBetaUser Landing Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/BeBetaUser_Landing.png')}
            style={[
              styles.landingImage,
              {
                width: Math.min(width * 0.9, 800),
                height: Math.min(height * 0.8, 600),
              }
            ]}
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  signOutContainer: {
    position: 'absolute',
    top: ds.spacing[4],
    right: ds.spacing[4],
    zIndex: 10,
  },
  signOutButton: {
    backgroundColor: ds.colors.background.secondary,
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.full,
    ...ds.shadows.sm,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing[6],
  },
  landingImage: {
    maxWidth: '100%',
    maxHeight: '100%',
  },
})

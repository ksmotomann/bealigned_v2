import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import UserMenu from './UserMenu'
import ds from '../styles/design-system'

interface InAppNavigationHeaderProps {
  onLogoPress?: () => void
}

export default function InAppNavigationHeader({ onLogoPress }: InAppNavigationHeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
  }, [])

  async function getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error getting user:', error)
    }
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Pressable style={styles.logo} onPress={() => onLogoPress ? onLogoPress() : router.push('/(tabs)/dashboard')}>
          <Image
            source={require('../assets/bealigned_logo.avif')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Pressable>
        
        <View style={styles.rightSection}>
          <UserMenu user={user} />
        </View>

        {/* Mobile navigation - UserMenu handles mobile differently */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
    position: 'relative',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[12],
    paddingVertical: ds.spacing[4],
    maxWidth: ds.containers.xl,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 40,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
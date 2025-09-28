import React from 'react'
import { View, Text, Pressable, StyleSheet, Image, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface AppNavigationHeaderProps {
  firstName?: string
  showSignOut?: boolean
}

export default function AppNavigationHeader({ firstName, showSignOut = true }: AppNavigationHeaderProps) {
  const router = useRouter()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Thank you for your reflection journey with BeH2O. Are you ready to sign out and continue growing differently?')
      if (!confirmed) return
    }
    
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        router.replace('/(auth)/login')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      router.replace('/(auth)/login')
    }
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <Image 
            source={require('../assets/bealigned_logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={styles.subtitle}>
              This is your space to pause, reflect, and realign.
            </Text>
            <Text style={styles.subSubtitle}>
              Your BeH2O journey together, differently – reflecting difficult conversations.
            </Text>
          </View>
        </View>
        
        {showSignOut && (
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={ds.colors.text.secondary} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    paddingTop: ds.spacing[6],
    paddingBottom: ds.spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: ds.spacing[6],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: ds.spacing[4],
  },
  logo: {
    width: 40,
    height: 40,
    tintColor: ds.colors.primary.main,
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[1],
  },
  subtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[1],
  },
  subSubtitle: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.neutral[50],
    gap: ds.spacing[2],
  },
  signOutText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
})
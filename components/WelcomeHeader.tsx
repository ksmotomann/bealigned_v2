import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import ds from '../styles/design-system'

interface WelcomeHeaderProps {
  firstName?: string
}

export default function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
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
})
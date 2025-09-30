import React, { useEffect } from 'react'
import { View, Text, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ds from '../../styles/design-system'

export default function GoodbyePage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 7 seconds
    const timer = setTimeout(() => {
      router.replace('/(marketing)/')
    }, 7000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <Ionicons name="checkmark" size={32} color={ds.colors.success} />
            </View>
          </View>

          {/* Thank You Message */}
          <Text style={styles.title}>Thank You for Using BeAligned!</Text>

          <Text style={styles.message}>
            Your journey towards alignment matters, and we're honored to be part of it.
          </Text>

          <Text style={styles.subMessage}>
            You have been successfully signed out.
          </Text>

          {/* BeAligned Message */}
          <View style={styles.beAlignedMessage}>
            <Text style={styles.beText}>Be</Text>
            <Text style={styles.beSubtext}>Be strong. Be grounded. BeAligned.</Text>
          </View>

          {/* Redirect Notice */}
          <View style={styles.redirectNotice}>
            <Text style={styles.redirectText}>
              You'll be returned to our main site momentarily...
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>

          {/* Manual Redirect Text */}
          <Text style={styles.manualRedirectText}>
            If you're not redirected automatically, the app will guide you back to the main page.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: ds.gradients.light[0],
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    width: 64,
    height: 64,
    backgroundColor: ds.colors.success + '20', // 20% opacity
    borderRadius: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 12,
    fontFamily: ds.typography.fontFamily.heading,
  },
  message: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: ds.typography.fontFamily.base,
  },
  subMessage: {
    fontSize: 14,
    color: ds.colors.text.tertiary,
    textAlign: 'center' as const,
    marginBottom: 24,
    fontFamily: ds.typography.fontFamily.base,
  },
  beAlignedMessage: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  beText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: 4,
  },
  beSubtext: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  redirectNotice: {
    backgroundColor: ds.colors.primary.lightest,
    borderRadius: ds.borderRadius.lg,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center' as const,
  },
  redirectText: {
    fontSize: 14,
    color: ds.colors.primary.dark,
    textAlign: 'center' as const,
    marginBottom: 8,
    fontFamily: ds.typography.fontFamily.base,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: ds.colors.primary.light,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ds.colors.primary.main,
    width: '100%',
    transform: [{ scaleX: 0 }],
    transformOrigin: 'left',
    // Note: React Native doesn't support CSS animations like the web version
    // In a real implementation, you might use Animated API for the progress animation
  },
  manualRedirectText: {
    fontSize: 12,
    color: ds.colors.text.tertiary,
    textAlign: 'center' as const,
    lineHeight: 18,
    fontFamily: ds.typography.fontFamily.base,
  },
}
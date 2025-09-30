import { useState, useEffect } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'

export default function EmailVerified() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  useEffect(() => {
    checkUserSession()
  }, [])

  async function checkUserSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email_confirmed_at) {
        setUser(user)
      } else {
        // If no confirmed user, redirect to login
        router.replace('/(auth)/login')
      }
    } catch (error) {
      console.error('Error checking user session:', error)
      router.replace('/(auth)/login')
    }
  }

  async function continueToApp() {
    setLoading(true)
    try {
      // Redirect to login page where the normal auth flow will handle the rest
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Error:', error)
      router.replace('/(auth)/login')
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Verifying your account...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SEOHead page="email-verified" />

      {/* Navigation Header */}
      <NavigationHeader />

      {/* Hero Section */}
      <AnimatedWaveHero style={styles.hero}>
        <View style={styles.contentContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>

          <Text style={styles.title}>Welcome to BeAligned!</Text>
          <Text style={styles.subtitle}>
            Your email has been verified successfully. You're ready to begin your reflection journey.
          </Text>

          {user.email && (
            <View style={styles.emailConfirmation}>
              <Text style={styles.emailLabel}>Verified Email:</Text>
              <Text style={styles.emailText}>{user.email}</Text>
            </View>
          )}

          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>What's Next?</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔥</Text>
                <Text style={styles.featureText}>Start your first reflection session</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Track your progress and insights</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💡</Text>
                <Text style={styles.featureText}>Discover patterns in your thinking</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={continueToApp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Continue to Sign In'}
            </Text>
          </Pressable>

          <Text style={styles.helpText}>
            Questions? Visit our{' '}
            <Text style={styles.link} onPress={() => router.push('/(marketing)/faq')}>
              FAQ
            </Text>{' '}
            or{' '}
            <Text style={styles.link} onPress={() => router.push('/(marketing)/contact')}>
              contact us
            </Text>
          </Text>
        </View>
      </AnimatedWaveHero>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require('../../assets/bealigned_logo.avif')}
          style={styles.footerLogoImage}
          resizeMode="contain"
        />

        <Text style={styles.footerDisclaimer}>
          © 2025 BeAligned • BeH2O® is a registered trademark{'\n'}
          BeAligned provides educational guidance and is not a substitute for professional therapy or legal advice
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  hero: {
    paddingVertical: ds.spacing[20],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
    minHeight: 600,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: ds.spacing[6],
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ds.spacing[6],
  },
  checkmark: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: ds.typography.fontSize['4xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    marginBottom: ds.spacing[3],
    color: ds.colors.text.inverse,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.inverse,
    marginBottom: ds.spacing[6],
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.lg.lineHeight + 4,
  },
  emailConfirmation: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[6],
    alignItems: 'center',
  },
  emailLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.inverse,
    opacity: 0.8,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  emailText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  welcomeContent: {
    width: '100%',
    marginBottom: ds.spacing[8],
  },
  welcomeTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  featureList: {
    gap: ds.spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: ds.spacing[3],
  },
  featureText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    fontFamily: ds.typography.fontFamily.base,
    flex: 1,
  },
  button: {
    backgroundColor: ds.colors.background.primary,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[8],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    marginBottom: ds.spacing[6],
    width: '100%',
    ...ds.shadows.base,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  helpText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    opacity: 0.8,
    fontFamily: ds.typography.fontFamily.base,
  },
  link: {
    fontWeight: ds.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  loadingText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginTop: 100,
    fontFamily: ds.typography.fontFamily.base,
  },
  footer: {
    backgroundColor: ds.colors.neutral[800],
    paddingVertical: ds.spacing[10],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
  },
  footerLogoImage: {
    width: 120,
    height: 32,
    marginBottom: 24,
    tintColor: '#FFFFFF',
  },
  footerDisclaimer: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.neutral[400],
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.xs.lineHeight + 2,
    fontFamily: ds.typography.fontFamily.base,
  },
})
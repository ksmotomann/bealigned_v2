import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'

export default function ConfirmEmail() {
  const router = useRouter()
  const { email } = useLocalSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function resendConfirmation() {
    if (!email || typeof email !== 'string') {
      setMessage({ type: 'error', text: 'Email address not found. Please try signing up again.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/(auth)/email-verified`,
      }
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Confirmation email sent! Check your inbox.' })
    }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="confirm-email" />

      {/* Navigation Header */}
      <NavigationHeader />

      {/* Main Content with Animated Wave Background */}
      <AnimatedWaveHero style={styles.hero}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={48} color={ds.colors.primary.main} />
            </View>
          </View>

          <Text style={styles.title}>
            Check Your Email
          </Text>

          <Text style={styles.subtitle}>
            We've sent a confirmation link to
          </Text>

          {email && (
            <Text style={styles.email}>
              {email}
            </Text>
          )}

          <View style={styles.instructionsContainer}>
            <Text style={styles.sectionTitle}>Next Steps</Text>

            <View style={styles.instruction}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instructionTitle}>Check your inbox</Text>
                <Text style={styles.instructionDescription}>
                  Look for an email from BeAligned with the subject "Confirm your signup"
                </Text>
              </View>
            </View>

            <View style={styles.instruction}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instructionTitle}>Click the confirmation link</Text>
                <Text style={styles.instructionDescription}>
                  This will verify your email address and activate your account
                </Text>
              </View>
            </View>

            <View style={styles.instruction}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.instructionText}>
                <Text style={styles.instructionTitle}>Sign in to BeAligned</Text>
                <Text style={styles.instructionDescription}>
                  Once confirmed, you can sign in and begin your reflection journey
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Didn't receive the email?</Text>
            <Text style={styles.helpText}>
              Check your spam folder, or wait a few minutes and try again. Confirmation emails can sometimes take a moment to arrive.
            </Text>

            {message && (
              <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
                <Text style={[styles.messageText, message.type === 'success' ? styles.successText : styles.errorText]}>
                  {message.text}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.resendButton, loading && styles.buttonDisabled]}
              onPress={resendConfirmation}
              disabled={loading}
            >
              <Text style={styles.resendButtonText}>
                {loading ? 'Sending...' : 'Resend Confirmation Email'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already confirmed? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </AnimatedWaveHero>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require('../../assets/bealigned_logo.avif')}
          style={styles.footerLogoImage}
          resizeMode="contain"
        />

        <View style={styles.footerLinks}>
          <Pressable onPress={() => router.push('/(marketing)')}>
            <Text style={styles.footerLink}>Home</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/our-story')}>
            <Text style={styles.footerLink}>Our Story</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/faq')}>
            <Text style={styles.footerLink}>FAQ</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/contact')}>
            <Text style={styles.footerLink}>Contact</Text>
          </Pressable>
        </View>

        <Text style={styles.footerDisclaimer}>
          © 2025 BeAligned • BeH2O® is a registered trademark{'\n'}
          BeAligned provides educational guidance and is not a substitute for professional therapy or legal advice
        </Text>
      </View>
    </ScrollView>
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
  content: {
    paddingHorizontal: ds.spacing[6],
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing[6],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ds.colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    opacity: 0.9,
    fontFamily: ds.typography.fontFamily.base,
  },
  email: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[8],
    fontFamily: ds.typography.fontFamily.base,
  },
  instructionsContainer: {
    marginBottom: ds.spacing[8],
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    marginBottom: ds.spacing[5],
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: ds.spacing[5],
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing[4],
    marginTop: 2,
  },
  stepNumberText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.heading,
  },
  instructionDescription: {
    fontSize: ds.typography.fontSize.base.size,
    lineHeight: ds.typography.fontSize.base.lineHeight,
    color: ds.colors.text.inverse,
    opacity: 0.9,
    fontFamily: ds.typography.fontFamily.base,
  },
  helpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: ds.spacing[5],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[6],
  },
  helpTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    marginBottom: ds.spacing[2],
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  helpText: {
    fontSize: ds.typography.fontSize.base.size,
    lineHeight: ds.typography.fontSize.base.lineHeight,
    color: ds.colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  messageBox: {
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[4],
  },
  successBox: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.success,
  },
  errorBox: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.error,
  },
  messageText: {
    fontSize: ds.typography.fontSize.sm.size,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  successText: {
    color: ds.colors.success,
  },
  errorText: {
    color: ds.colors.error,
  },
  resendButton: {
    backgroundColor: ds.colors.background.primary,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
    alignSelf: 'center',
    ...ds.shadows.base,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: ds.spacing[4],
  },
  linkText: {
    color: ds.colors.text.inverse,
    opacity: 0.8,
    fontFamily: ds.typography.fontFamily.base,
  },
  link: {
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
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
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerLink: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.neutral[300],
    fontFamily: ds.typography.fontFamily.base,
  },
  footerDivider: {
    color: '#666666',
    marginHorizontal: 12,
    fontFamily: ds.typography.fontFamily.base,
  },
  footerDisclaimer: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.neutral[400],
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.xs.lineHeight + 2,
    fontFamily: ds.typography.fontFamily.base,
  },
})
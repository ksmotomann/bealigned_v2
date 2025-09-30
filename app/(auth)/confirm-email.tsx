import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'
import SEOHead from '../../components/SEOHead'

// Official "Be" logo component using the transparent asset
function BeLogo() {
  return (
    <View style={styles.logoCircle}>
      <Image
        source={require('../../assets/be_logo.png')}
        style={styles.beLogoImage}
        resizeMode="contain"
      />
    </View>
  )
}

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

      <View style={styles.content}>
        {/* Be Logo */}
        <BeLogo />

        {/* Welcome Heading */}
        <Text style={styles.welcomeTitle}>Welcome to BeAligned™</Text>

        {/* Email Confirmation Card */}
        <View style={styles.emailCard}>
          {/* Checkmark Icon */}
          <View style={styles.checkmarkContainer}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={32} color={ds.colors.primary.main} />
            </View>
          </View>

          {/* Check Your Email */}
          <Text style={styles.cardTitle}>Check Your Email</Text>

          <Text style={styles.cardSubtitle}>
            We've sent a confirmation link to
          </Text>

          {/* Email Display */}
          {email && (
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          )}
        </View>

        {/* Next Steps - On Main Body */}
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>Next Steps</Text>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Check your inbox</Text>
              <Text style={styles.stepDescription}>
                Look for an email from BeAligned with the subject "Confirm your signup"
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Click the confirmation link</Text>
              <Text style={styles.stepDescription}>
                This will verify your email address and activate your account
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sign in to BeAligned</Text>
              <Text style={styles.stepDescription}>
                Once confirmed, you can sign in and begin your reflection journey
              </Text>
            </View>
          </View>
        </View>

        {/* Help Card */}
        <View style={styles.helpCard}>
          {/* Didn't receive email section */}
          <View style={styles.noEmailSection}>
            <Text style={styles.noEmailTitle}>Didn't receive the email?</Text>
            <Text style={styles.noEmailText}>
              Check your spam folder, or wait a few minutes and try again.
              Confirmation emails can sometimes take a moment to arrive.
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

          {/* Already confirmed section */}
          <View style={styles.alreadyConfirmedSection}>
            <Text style={styles.alreadyConfirmedText}>Already confirmed?</Text>
            <Pressable
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light gray background like in the design
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[8],
  },

  // Be Logo styles
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ds.spacing[6],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  beLogoImage: {
    width: 60,
    height: 60,
  },

  // Welcome heading
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[10],
    fontFamily: ds.typography.fontFamily.heading,
  },

  // Email confirmation card
  emailCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    padding: ds.spacing[8],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: ds.spacing[8],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Help card
  helpCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    padding: ds.spacing[8],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: ds.spacing[8],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Checkmark icon
  checkmarkContainer: {
    marginBottom: ds.spacing[6],
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ds.colors.primary.main + '20', // 20% opacity
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card title and subtitle
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.heading,
  },
  cardSubtitle: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },

  // Email display
  emailContainer: {
    backgroundColor: ds.colors.primary.lightest,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[8],
  },
  emailText: {
    fontSize: 16,
    color: ds.colors.primary.dark,
    fontFamily: ds.typography.fontFamily.base,
    fontWeight: '500',
  },

  // Next Steps
  nextStepsContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: ds.spacing[8],
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.heading,
  },
  step: {
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
    fontSize: 14,
    fontWeight: '600',
    fontFamily: ds.typography.fontFamily.base,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.heading,
  },
  stepDescription: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    lineHeight: 20,
    fontFamily: ds.typography.fontFamily.base,
  },

  // No email section
  noEmailSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: ds.spacing[6],
  },
  noEmailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.heading,
  },
  noEmailText: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },

  // Message box
  messageBox: {
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[4],
    width: '100%',
  },
  successBox: {
    backgroundColor: ds.colors.success + '10',
    borderWidth: 1,
    borderColor: ds.colors.success,
  },
  errorBox: {
    backgroundColor: ds.colors.error + '10',
    borderWidth: 1,
    borderColor: ds.colors.error,
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  successText: {
    color: ds.colors.success,
  },
  errorText: {
    color: ds.colors.error,
  },

  // Resend button
  resendButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
    ...ds.shadows.base,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    color: ds.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: ds.typography.fontFamily.base,
  },

  // Already confirmed section
  alreadyConfirmedSection: {
    alignItems: 'center',
  },
  alreadyConfirmedText: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
  },
  signInButton: {
    borderWidth: 1,
    borderColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
  },
  signInButtonText: {
    color: ds.colors.primary.main,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: ds.typography.fontFamily.base,
  },
})
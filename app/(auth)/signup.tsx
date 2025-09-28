import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'

export default function SignUp() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registrationCode, setRegistrationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string, showPasswordReset?: boolean } | null>(null)
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  async function signUpWithEmail() {
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    // Basic password validation
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      setLoading(false)
      return
    }

    let data, error
    let alignmentCodeResult = null

    // Validate alignment code if provided
    if (registrationCode) {
      try {
        const { data: codeData, error: codeError } = await supabase.rpc('validate_alignment_code', {
          p_code: registrationCode
        })

        if (codeError) {
          console.error('Alignment code validation error:', codeError)
          setMessage({ type: 'error', text: 'Error validating alignment code' })
          setLoading(false)
          return
        }

        // Check first result for validation
        if (codeData && codeData.length > 0) {
          alignmentCodeResult = codeData[0]
          if (!alignmentCodeResult.success) {
            setMessage({ type: 'error', text: alignmentCodeResult.message })
            setLoading(false)
            return
          }
        } else {
          setMessage({ type: 'error', text: 'Invalid alignment code' })
          setLoading(false)
          return
        }
      } catch (codeException) {
        console.error('Alignment code validation exception:', codeException)
        setMessage({ type: 'error', text: 'Error validating alignment code' })
        setLoading(false)
        return
      }
    }

    try {
      const response = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            registration_code: registrationCode,
          },
          emailRedirectTo: `${window.location.origin}/(auth)/email-verified`,
        }
      })
      data = response.data
      error = response.error

      // Apply alignment code after successful user creation
      if (!error && data?.user && registrationCode && alignmentCodeResult) {
        try {
          await supabase.rpc('use_alignment_code', {
            p_code: registrationCode,
            p_user_id: data.user.id
          })
        } catch (applyError) {
          console.warn('Failed to apply alignment code after signup:', applyError)
        }
      }
    } catch (exception) {
      error = { message: `Signup failed: ${exception.message}` }
    }

    if (error) {
      // Check if this is a duplicate email error
      if (error.message?.includes('already registered') || error.message?.includes('User already exists')) {
        setMessage({
          type: 'error',
          text: 'An account with this email already exists. You can sign in or reset your password.',
          showPasswordReset: true
        })
      } else {
        setMessage({ type: 'error', text: error.message })
      }
    } else if (data?.user) {
      // Check if email confirmation is required
      if (data.user.email_confirmed_at) {
        // Email already confirmed, redirect to welcome
        setMessage({ type: 'success', text: 'Account created successfully!' })
        setTimeout(() => {
          router.replace('/(auth)/welcome')
        }, 1500)
      } else {
        // Email confirmation required - redirect to confirmation page
        setMessage({ type: 'success', text: 'Account created successfully!' })
        setTimeout(() => {
          router.replace(`/(auth)/confirm-email?email=${encodeURIComponent(email)}`)
        }, 1000)
      }
    }
    setLoading(false)
  }

  async function resetPassword() {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address first' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/(auth)/reset-password`,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Check your inbox for instructions.'
      })
    }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="signup" />

      {/* Navigation Header */}
      <NavigationHeader />

      {/* Hero Section with Form */}
      <AnimatedWaveHero style={styles.hero}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Get Started</Text>
            <Text style={styles.subtitle}>Create your BeAligned account to begin your reflection journey</Text>

            {message && (
              <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
                <Text style={[styles.messageText, message.type === 'success' ? styles.successText : styles.errorText]}>
                  {message.text}
                </Text>
                {message.showPasswordReset && (
                  <Pressable
                    style={styles.resetPasswordButton}
                    onPress={resetPassword}
                    disabled={loading}
                  >
                    <Text style={styles.resetPasswordButtonText}>
                      Reset Password
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.nameContainer}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!loading}
                  placeholderTextColor={ds.colors.text.tertiary}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!loading}
                  placeholderTextColor={ds.colors.text.tertiary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                placeholderTextColor={ds.colors.text.tertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                placeholderTextColor={ds.colors.text.tertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
                placeholderTextColor={ds.colors.text.tertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Alignment Pass (optional)"
                value={registrationCode}
                onChangeText={setRegistrationCode}
                autoCapitalize="characters"
                editable={!loading}
                placeholderTextColor={ds.colors.text.tertiary}
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={signUpWithEmail}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </Pressable>

            <Text style={styles.disclaimer}>
              By signing up, you agree to our{' '}
              <Link href="/(marketing)/terms" asChild>
                <Text style={styles.linkInline}>Terms of Service</Text>
              </Link>{' '}
              and{' '}
              <Link href="/(marketing)/privacy" asChild>
                <Text style={styles.linkInline}>Privacy Policy</Text>
              </Link>
            </Text>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.link}>Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    width: '100%',
    maxWidth: 500,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: ds.spacing[6],
  },
  title: {
    fontSize: ds.typography.fontSize['4xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    marginBottom: ds.spacing[2],
    color: ds.colors.text.inverse,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.inverse,
    marginBottom: ds.spacing[8],
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: ds.typography.fontFamily.base,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: ds.spacing[3],
  },
  inputContainer: {
    marginBottom: ds.spacing[4],
  },
  halfInput: {
    flex: 1,
  },
  input: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  button: {
    backgroundColor: ds.colors.background.primary,
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    marginTop: ds.spacing[4],
    ...ds.shadows.base,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  disclaimer: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginTop: ds.spacing[4],
    opacity: 0.8,
    fontFamily: ds.typography.fontFamily.base,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: ds.spacing[6],
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
  linkInline: {
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
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
  resetPasswordButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.sm,
    marginTop: ds.spacing[3],
    alignSelf: 'center',
  },
  resetPasswordButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
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
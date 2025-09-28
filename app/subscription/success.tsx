import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

export default function SubscriptionSuccess() {
  const router = useRouter()
  const { session_id } = useLocalSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'processing' | 'error'>('processing')

  useEffect(() => {
    if (session_id) {
      verifyPayment()
    } else {
      setPaymentStatus('success')
      setLoading(false)
    }
  }, [session_id])

  const verifyPayment = async () => {
    try {
      // Call our edge function to verify the payment
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          action: 'verify-payment',
          session_id: session_id
        }
      })

      if (error) {
        console.error('Payment verification error:', error)
        setPaymentStatus('error')
      } else {
        setPaymentStatus('success')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      setPaymentStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    router.replace('/(tabs)/dashboard')
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="card" size={48} color={ds.colors.primary.main} />
          <Text style={styles.loadingText}>Verifying your payment...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (paymentStatus === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color={ds.colors.danger} />
          </View>

          <Text style={styles.title}>Payment Verification Failed</Text>
          <Text style={styles.description}>
            We encountered an issue verifying your payment. Please contact support if you believe this is an error.
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={ds.colors.success} />
        </View>

        <Text style={styles.title}>🎉 Welcome to BeAligned Premium!</Text>
        <Text style={styles.description}>
          Thank you for upgrading! Your subscription is now active and you have access to all premium features.
        </Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's included:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color={ds.colors.success} />
            <Text style={styles.featureText}>Unlimited reflection sessions</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color={ds.colors.success} />
            <Text style={styles.featureText}>Advanced pattern analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color={ds.colors.success} />
            <Text style={styles.featureText}>Priority support</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={20} color={ds.colors.success} />
            <Text style={styles.featureText}>BeH2O® certified coaching access</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Start Your Premium Journey</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Your subscription will be automatically renewed. You can manage your subscription anytime in Settings.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[6],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ds.spacing[4],
  },
  loadingText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  iconContainer: {
    marginBottom: ds.spacing[6],
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  description: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
    marginBottom: ds.spacing[8],
    fontFamily: ds.typography.fontFamily.base,
  },
  featuresContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[8],
    width: '100%',
    maxWidth: 400,
    ...ds.shadows.base,
  },
  featuresTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[4],
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    marginBottom: ds.spacing[2],
  },
  featureText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: ds.spacing[6],
  },
  button: {
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
  },
  primaryButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  footerText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
})
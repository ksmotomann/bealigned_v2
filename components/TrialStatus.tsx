import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface TrialStatus {
  code: string
  trial_ends_at: string
  days_remaining: number
  is_trial_active: boolean
  conversion_price: number
  regular_price: number
}

interface TrialStatusProps {
  userId: string
  onClose?: () => void
}

export default function TrialStatus({ userId, onClose }: TrialStatusProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    loadTrialStatus()
  }, [userId])

  const loadTrialStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_trial_status', {
        p_user_id: userId
      })

      if (error) {
        console.error('Error loading trial status:', error)
        return
      }

      if (data && data.length > 0) {
        setTrialStatus(data[0])
      }
    } catch (err) {
      console.error('Error loading trial status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!trialStatus) return

    setUpgrading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'Please sign in to upgrade')
        return
      }

      // Call our Stripe checkout function
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'create-checkout-session',
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: window.location.href,
        }),
      })

      const result = await response.json()

      if (result.error) {
        Alert.alert('Error', result.error)
        return
      }

      if (result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      Alert.alert('Error', 'Unable to start checkout process')
    } finally {
      setUpgrading(false)
    }
  }

  const getDaysRemainingColor = (days: number) => {
    if (days <= 3) return ds.colors.danger
    if (days <= 7) return ds.colors.warning
    return ds.colors.success
  }

  const getUrgencyMessage = (days: number) => {
    if (days <= 0) return "Your trial has expired"
    if (days <= 3) return "Trial ending soon!"
    if (days <= 7) return "Trial ending this week"
    return "Trial active"
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading trial status...</Text>
      </View>
    )
  }

  if (!trialStatus || !trialStatus.is_trial_active) {
    return null // Don't show if no active trial
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 PILOT-PARTNERS Trial</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.statusCard}>
        <View style={styles.countdownSection}>
          <Text style={[styles.daysRemaining, { color: getDaysRemainingColor(trialStatus.days_remaining) }]}>
            {trialStatus.days_remaining}
          </Text>
          <Text style={styles.daysLabel}>
            {trialStatus.days_remaining === 1 ? 'day remaining' : 'days remaining'}
          </Text>
          <Text style={[styles.urgencyMessage, { color: getDaysRemainingColor(trialStatus.days_remaining) }]}>
            {getUrgencyMessage(trialStatus.days_remaining)}
          </Text>
        </View>

        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>🎯 Special Trial Pricing</Text>

          <View style={styles.priceComparison}>
            <View style={styles.trialPrice}>
              <Text style={styles.discountBadge}>TRIAL PRICE</Text>
              <Text style={styles.price}>${trialStatus.conversion_price}/year</Text>
              <Text style={styles.savings}>Save ${(trialStatus.regular_price - trialStatus.conversion_price).toFixed(2)}!</Text>
            </View>

            <Text style={styles.vs}>vs</Text>

            <View style={styles.regularPrice}>
              <Text style={styles.regularLabel}>Regular Price</Text>
              <Text style={[styles.price, styles.crossedOut]}>${trialStatus.regular_price}/year</Text>
            </View>
          </View>

          <Pressable
            style={[styles.upgradeButton, upgrading && styles.upgradeButtonDisabled]}
            onPress={handleUpgrade}
            disabled={upgrading}
          >
            <Text style={styles.upgradeButtonText}>
              {upgrading ? 'Starting Checkout...' : `Upgrade Now - $${trialStatus.conversion_price}/year`}
            </Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            ✨ This special pricing is only available during your trial period
          </Text>
        </View>
      </View>

      <View style={styles.trialInfo}>
        <Text style={styles.trialInfoText}>
          Trial ends: {new Date(trialStatus.trial_ends_at).toLocaleDateString()}
        </Text>
        <Text style={styles.trialInfoText}>
          Code: {trialStatus.code}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ds.colors.text.primary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ds.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: ds.colors.text.secondary,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  countdownSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  daysRemaining: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  daysLabel: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    marginTop: 4,
  },
  urgencyMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  pricingSection: {
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: ds.colors.text.primary,
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trialPrice: {
    alignItems: 'center',
    flex: 1,
  },
  discountBadge: {
    backgroundColor: ds.colors.success,
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ds.colors.text.primary,
  },
  savings: {
    fontSize: 12,
    color: ds.colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
  vs: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    marginHorizontal: 16,
  },
  regularPrice: {
    alignItems: 'center',
    flex: 1,
  },
  regularLabel: {
    fontSize: 10,
    color: ds.colors.text.secondary,
    marginBottom: 8,
  },
  crossedOut: {
    textDecorationLine: 'line-through',
    color: ds.colors.text.secondary,
  },
  upgradeButton: {
    backgroundColor: ds.colors.success,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: ds.colors.text.secondary,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  trialInfo: {
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
    paddingTop: 12,
    alignItems: 'center',
  },
  trialInfoText: {
    fontSize: 12,
    color: ds.colors.text.secondary,
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    textAlign: 'center',
  },
})
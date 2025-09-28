import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface CreditCardFormProps {
  amount: number
  description: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  loading?: boolean
  setLoading?: (loading: boolean) => void
}

const CheckoutForm: React.FC<CreditCardFormProps> = ({
  amount,
  description,
  onSuccess,
  onError,
  loading = false,
  setLoading
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [cardComplete, setCardComplete] = useState(false)

  const handlePayPress = async () => {
    if (!stripe || !elements) {
      onError('Stripe has not loaded yet')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError('Card element not found')
      return
    }

    if (!cardComplete) {
      Alert.alert('Error', 'Please enter complete card details')
      return
    }

    if (setLoading) setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create Payment Intent on server
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          action: 'create-payment-intent',
          amount: amount * 100, // Convert to cents
          description,
          customer_email: user.email
        }
      })

      if (error) throw error

      // Confirm payment with card details
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user.email,
            },
          },
        }
      )

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      } else {
        throw new Error('Payment failed')
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      onError(error.message || 'Payment failed')
    } finally {
      if (setLoading) setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: ds.colors.text.primary,
        '::placeholder': {
          color: ds.colors.text.secondary,
        },
      },
      invalid: {
        color: ds.colors.danger,
        iconColor: ds.colors.danger,
      },
    },
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Information</Text>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.cardContainer}>
        <Text style={styles.cardLabel}>Card Details</Text>
        <View style={styles.cardElementWrapper}>
          <CardElement
            options={cardElementOptions}
            onChange={(event) => {
              setCardComplete(event.complete)
            }}
          />
        </View>
      </View>

      <View style={styles.securityInfo}>
        <Text style={styles.securityText}>
          🔒 Your payment information is secure and encrypted
        </Text>
        <Text style={styles.testModeText}>
          Test Mode: Use card number 4242 4242 4242 4242
        </Text>
      </View>

      <Pressable
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handlePayPress}
        disabled={loading || !cardComplete || !stripe}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Text>
      </Pressable>
    </View>
  )
}

export default function CreditCardForm(props: CreditCardFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: ds.spacing[6],
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    ...ds.shadows.base,
  },
  title: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ds.colors.background.secondary,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[4],
  },
  amountLabel: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  amountText: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
  },
  description: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  cardContainer: {
    marginBottom: ds.spacing[4],
  },
  cardLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  cardElementWrapper: {
    backgroundColor: ds.colors.background.primary,
    borderColor: ds.colors.neutral[300],
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  securityInfo: {
    backgroundColor: ds.colors.success + '10',
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[6],
  },
  securityText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.success,
    textAlign: 'center',
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  testModeText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: ds.typography.fontFamily.base,
  },
  payButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: ds.colors.neutral[400],
  },
  payButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
})
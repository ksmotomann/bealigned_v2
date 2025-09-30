import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface SubscriptionProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripe_price_id: string;
}

interface UserSubscription {
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export default function SubscriptionScreen() {
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setCheckoutMessage('🎉 Subscription activated successfully! Welcome to BeAligned Premium.');
      // Reload subscription data to show updated status
      loadSubscriptionData();
    } else if (canceled === 'true') {
      setCheckoutMessage('Subscription setup was canceled. You can try again anytime.');
    }
  }, [searchParams]);

  const loadSubscriptionData = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Load available products
      const { data: productsData } = await supabase
        .from('subscription_products')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (productsData) {
        setProducts(productsData);
      }

      // Load user's subscription if exists
      if (currentUser) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('status, current_period_end, cancel_at_period_end')
          .eq('user_id', currentUser.id)
          .single();

        if (subData) {
          setSubscription(subData);
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      Alert.alert('Please sign in', 'You need to be signed in to subscribe');
      return;
    }

    setCheckoutLoading(true);

    try {
      // Create checkout session for subscription
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          action: 'create-checkout-session',
          successUrl: `${window.location.origin}/(tabs)/subscription?success=true`,
          cancelUrl: `${window.location.origin}/(tabs)/subscription?canceled=true`
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      Alert.alert('Error', error.message || 'Failed to start checkout process');
    } finally {
      setCheckoutLoading(false);
    }
  };


  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'get_portal_link' }
      });

      if (error) throw error;

      if (data?.url) {
        await Linking.openURL(data.url);
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      Alert.alert('Error', 'Failed to open subscription management');
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You will still have access until the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.functions.invoke('manage-subscription', {
                body: { action: 'cancel' }
              });
              Alert.alert('Success', 'Subscription will cancel at period end');
              loadSubscriptionData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription</Text>
        {hasActiveSubscription && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        )}
      </View>

      {hasActiveSubscription ? (
        <View style={styles.activeSubscription}>
          <Text style={styles.sectionTitle}>Your Subscription</Text>
          <Text style={styles.statusDetails}>
            Status: {subscription?.status}
          </Text>
          <Text style={styles.statusDetails}>
            Renews: {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
          </Text>
          {subscription?.cancel_at_period_end && (
            <Text style={styles.cancelNotice}>
              Your subscription will cancel at the end of this period
            </Text>
          )}

          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageSubscription}
          >
            <Text style={styles.buttonText}>Manage Subscription</Text>
          </TouchableOpacity>

          {!subscription?.cancel_at_period_end && (
            <TouchableOpacity
              style={[styles.manageButton, styles.cancelButton]}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.buttonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              <Text style={styles.productPrice}>
                ${product.price}/{product.interval}
              </Text>
              <View style={styles.featuresContainer}>
                {product.features.map((feature, index) => (
                  <Text key={index} style={styles.feature}>
                    • {feature}
                  </Text>
                ))}
              </View>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => handleSubscribe(product.stripe_price_id)}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Subscribe</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Checkout Message */}
      {checkoutMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{checkoutMessage}</Text>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => setCheckoutMessage(null)}
          >
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  activeSubscription: {
    padding: 20,
  },
  statusDetails: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  cancelNotice: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 12,
    marginBottom: 16,
  },
  productsContainer: {
    padding: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  subscribeButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 60, // Account for status bar
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  productSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productSummaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  productSummaryPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 12,
  },
  productSummaryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

export default function PendingApprovalPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/(marketing)/landing')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={64} color={ds.colors.primary.main} />
          </View>
        </View>

        <Text style={styles.title}>Account Pending Approval</Text>

        <Text style={styles.message}>
          Thank you for joining BeAligned™ with the BeBetaUser code!
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={ds.colors.primary.main} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoText}>
              Our admin team will review your account and approve access within 24-48 hours.
              You'll receive an email notification once your account is approved.
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color={ds.colors.text.secondary} />
            <Text style={styles.detailText}>{userEmail}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark" size={20} color={ds.colors.text.secondary} />
            <Text style={styles.detailText}>7-day free trial (upon approval)</Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionTitle}>While you wait...</Text>
          <Text style={styles.actionText}>
            • Check your email for the approval notification{'\n'}
            • Review our FAQ to learn more about BeAligned™{'\n'}
            • Explore our methodology at bealigned.app
          </Text>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={ds.colors.text.secondary} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={styles.supportSection}>
          <Text style={styles.supportText}>
            Questions? Contact us at{' '}
            <Text style={styles.supportLink}>support@bealigned.com</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing[6],
    paddingTop: ds.spacing[12],
  },
  iconContainer: {
    marginBottom: ds.spacing[6],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ds.colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[4],
    textAlign: 'center',
  },
  message: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[8],
    textAlign: 'center',
    maxWidth: 500,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: ds.colors.primary.lightest,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[6],
    width: '100%',
    maxWidth: 600,
    borderWidth: 1,
    borderColor: ds.colors.primary.light,
    gap: ds.spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
  },
  infoText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[6],
    width: '100%',
    maxWidth: 600,
    gap: ds.spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  detailText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
  },
  actionsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[8],
    width: '100%',
    maxWidth: 600,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
  },
  actionText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: 24,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    marginBottom: ds.spacing[6],
  },
  signOutText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
  },
  supportSection: {
    paddingTop: ds.spacing[4],
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
  },
  supportText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    textAlign: 'center',
  },
  supportLink: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
  },
})

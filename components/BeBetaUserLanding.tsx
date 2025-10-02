import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface BeBetaUserLandingProps {
  title?: string
  message?: string
  onClose?: () => void
}

export default function BeBetaUserLanding({ title, message, onClose }: BeBetaUserLandingProps) {
  const defaultTitle = 'Welcome, BeBetaUser!'
  const defaultMessage = `You're one of the very first to join BeAligned™. Right now, we're still putting the finishing touches on our reflection tool so that it's clear, grounded, and truly built for you.

Thank you for stepping in early — your presence matters. You're not just waiting for an app, you're helping build a movement. We will notify you as soon as it is ready.

Beta access will open soon. As an early BeBetaUser, you'll be the first to experience it.`

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {onClose && (
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={ds.colors.text.tertiary} />
          </Pressable>
        )}

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💧</Text>
        </View>

        <Text style={styles.title}>{title || defaultTitle}</Text>

        <Text style={styles.message}>
          {message || defaultMessage}
        </Text>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing[6],
  },
  card: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    padding: ds.spacing[8],
    maxWidth: 600,
    width: '100%',
    position: 'relative',
    ...ds.shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: ds.spacing[6],
    right: ds.spacing[6],
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
  },
  message: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.lg.lineHeight * 1.6,
    marginBottom: ds.spacing[8],
  },
  signOutButton: {
    backgroundColor: ds.colors.background.secondary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.lg,
    alignSelf: 'center',
  },
  signOutButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
})

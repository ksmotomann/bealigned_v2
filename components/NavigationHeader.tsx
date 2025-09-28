import React from 'react'
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Image } from 'react-native'
import { useRouter } from 'expo-router'
import ds from '../styles/design-system'

interface NavigationHeaderProps {
  activeLink?: 'home' | 'our-story' | 'faq' | 'contact'
}

export default function NavigationHeader({ activeLink }: NavigationHeaderProps) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Pressable style={styles.logo} onPress={() => router.push('/(marketing)')}>
          <Image
            source={require('../assets/bealigned_logo.avif')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Pressable>
        
        {isDesktop && (
          <View style={styles.nav}>
            <Pressable onPress={() => router.push('/(marketing)')}>
              <Text style={[styles.navLink, activeLink === 'home' && styles.navLinkActive]}>Home</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(marketing)/our-story')}>
              <Text style={[styles.navLink, activeLink === 'our-story' && styles.navLinkActive]}>Our Story</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(marketing)/faq')}>
              <Text style={[styles.navLink, activeLink === 'faq' && styles.navLinkActive]}>FAQ</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(marketing)/contact')}>
              <Text style={[styles.navLink, activeLink === 'contact' && styles.navLinkActive]}>Contact</Text>
            </Pressable>
            <Pressable style={styles.signInButton} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInText}>Login</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
    position: 'relative',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[12],
    paddingVertical: ds.spacing[4],
    maxWidth: ds.containers.xl,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 40,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  navLinkActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  signInButton: {
    backgroundColor: ds.colors.primary.dark,
    paddingHorizontal: ds.spacing[5],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
  },
  signInText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
})
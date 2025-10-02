import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../contexts/AdminContext'
import ds from '../styles/design-system'
import { createShadow } from '../utils/platformStyles'

interface UserMenuProps {
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const { adminViewEnabled, setAdminViewEnabled, setIsActualAdmin } = useAdmin()
  const [showDropdown, setShowDropdown] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user])

  async function loadProfile() {
    try {
      if (!user?.id) return

      // Load profile data from the database
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, user_type')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
      } else if (profileData) {
        setProfile(profileData)
      }

      // Determine admin status from profile data or email
      const adminEmails = [
        // Add admin emails here - robert@freedomrallyracing.com should NOT be admin for testing
        // 'admin@bealigned.app',
        // Add other verified admin emails here
      ]

      const isAdmin = (profileData?.user_type === 'admin' || profileData?.user_type === 'super_admin') ||
                     (user?.email && adminEmails.includes(user.email))
      setIsActualAdmin(isAdmin)

      console.log('Profile loaded:', {
        email: user?.email,
        profile: profileData,
        isAdmin
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      setIsActualAdmin(false)
    }
  }

  const getInitials = () => {
    const firstName = profile?.first_name || user?.firstName || ''
    const lastName = profile?.last_name || user?.lastName || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'
  }

  const getDisplayName = () => {
    const firstName = profile?.first_name || user?.firstName || ''
    const lastName = profile?.last_name || user?.lastName || ''
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    return user?.email || 'User'
  }

  async function handleSignOut() {
    setShowDropdown(false)
    setShowSignOutModal(true)
  }

  async function performSignOut() {
    try {
      // Close the modal first
      setShowSignOutModal(false)

      const { error } = await supabase.auth.signOut()
      if (!error) {
        router.replace('/(marketing)/goodbye')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      router.replace('/(marketing)/goodbye')
    }
  }

  // Get role-specific sign-out content
  const getSignOutContent = () => {
    const userType = profile?.user_type || 'user'
    const isSpecialRole = ['admin', 'super_admin', 'expert'].includes(userType)

    if (isSpecialRole) {
      return {
        title: 'Continue Supporting Families',
        message: `Thank you for your dedicated work supporting users on their BeAligned journeys. Your guidance and expertise help families navigate conflict with wisdom and create safer spaces for children.`,
        subMessage: `As ${userType === 'super_admin' ? 'a super admin' : userType === 'admin' ? 'an admin' : 'an expert'}, you're the backbone of this platform. Ready to continue supporting families beyond these digital walls?`,
        buttonText: 'Sign Out'
      }
    } else {
      return {
        title: 'Continue Growing Differently',
        message: 'Thank you for your reflection journey with BeH2O®. The insights you\'ve discovered and the growth you\'ve experienced are yours to carry forward.',
        subMessage: 'Are you ready to sign out and continue this growth in your daily life?',
        buttonText: 'Sign Out'
      }
    }
  }

  const handleMenuAction = (action: string) => {
    setShowDropdown(false)

    switch (action) {
      case 'profile':
        router.push('/(tabs)/settings')
        break
      case 'settings':
        router.push('/(tabs)/settings')
        break
      case 'help':
        router.push('/(marketing)/faq')
        break
      case 'terms':
        router.push('/(legal)/terms')
        break
      case 'privacy':
        router.push('/(legal)/privacy')
        break
      case 'admin':
        router.push('/(tabs)/admin')
        break
      case 'signout':
        handleSignOut()
        break
    }
  }

  const isAdmin = profile?.user_type === 'admin' || profile?.user_type === 'super_admin'

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.avatarContainer}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <Ionicons 
          name={showDropdown ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={ds.colors.text.secondary} 
        />
      </Pressable>

      {showDropdown && (
        <Modal
          visible={showDropdown}
          transparent={true}
          onRequestClose={() => setShowDropdown(false)}
        >
          <Pressable 
            style={styles.overlay}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdown}>
              {/* User Info Header */}
              <View style={styles.userInfoSection}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarTextLarge}>{getInitials()}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{getDisplayName()}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                  {isAdmin && (
                    <View style={styles.roleBadge}>
                      <Ionicons name="shield-checkmark" size={14} color={ds.colors.primary.main} />
                      <Text style={styles.roleText}>Admin</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.menuSection}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('settings')}
                >
                  <Ionicons name="settings-outline" size={20} color={ds.colors.text.secondary} />
                  <Text style={styles.menuText}>Settings</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('help')}
                >
                  <Ionicons name="help-circle-outline" size={20} color={ds.colors.text.secondary} />
                  <Text style={styles.menuText}>Help & Support</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('terms')}
                >
                  <Ionicons name="document-text-outline" size={20} color={ds.colors.text.secondary} />
                  <Text style={styles.menuText}>Terms & Conditions</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('privacy')}
                >
                  <Ionicons name="shield-outline" size={20} color={ds.colors.text.secondary} />
                  <Text style={styles.menuText}>Privacy Policy</Text>
                </Pressable>

                {isAdmin && (
                  <>
                    <Pressable 
                      style={[styles.menuItem, styles.adminMenuItem]}
                      onPress={() => handleMenuAction('admin')}
                    >
                      <Ionicons name="shield-outline" size={20} color={ds.colors.warning} />
                      <Text style={[styles.menuText, styles.adminMenuText]}>Admin Dashboard</Text>
                    </Pressable>
                    
                    <Pressable 
                      style={styles.menuItem}
                      onPress={() => {
                        setAdminViewEnabled(!adminViewEnabled)
                        setShowDropdown(false)
                      }}
                    >
                      <Ionicons 
                        name={adminViewEnabled ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color={ds.colors.text.secondary} 
                      />
                      <Text style={styles.menuText}>
                        Admin View: {adminViewEnabled ? 'On' : 'Off'}
                      </Text>
                      <View style={[styles.toggle, adminViewEnabled && styles.toggleActive]}>
                        <View style={[styles.toggleHandle, adminViewEnabled && styles.toggleHandleActive]} />
                      </View>
                    </Pressable>
                  </>
                )}

                <Pressable 
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('signout')}
                >
                  <Ionicons name="log-out-outline" size={20} color={ds.colors.text.secondary} />
                  <Text style={styles.menuText}>Sign Out</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Sign Out Modal */}
      <Modal
        visible={showSignOutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.signOutOverlay}>
          <View style={styles.signOutModal}>
            <View style={styles.signOutHeader}>
              <View style={styles.signOutIconContainer}>
                <Ionicons name="heart" size={32} color={ds.colors.primary.main} />
              </View>
              <Text style={styles.signOutTitle}>{getSignOutContent().title}</Text>
            </View>

            <View style={styles.signOutContent}>
              <Text style={styles.signOutMessage}>
                {getSignOutContent().message}
              </Text>

              <Text style={styles.signOutSubMessage}>
                {getSignOutContent().subMessage}
              </Text>

              <View style={styles.signOutQuote}>
                <Text style={styles.quote}>
                  "In between every stimulus and response there is a space. In that space is the power to choose..."
                </Text>
                <Text style={styles.quoteAuthor}>- Victor Frankl</Text>
              </View>

              <View style={styles.beAlignedMessage}>
                <Text style={styles.beText}>Be</Text>
                <Text style={styles.beSubtext}>Be strong. Be grounded. BeAligned.</Text>
              </View>
            </View>

            <View style={styles.signOutActions}>
              <Pressable
                style={[styles.signOutButton, styles.stayButton]}
                onPress={() => setShowSignOutModal(false)}
              >
                <Ionicons name="time" size={20} color={ds.colors.primary.main} />
                <Text style={styles.stayButtonText}>Stay a Little Longer</Text>
              </Pressable>

              <Pressable
                style={[styles.signOutButton, styles.continueButton]}
                onPress={performSignOut}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
                <Text style={styles.continueButtonText}>{getSignOutContent().buttonText}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    padding: ds.spacing[2],
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60, // Account for header height
    paddingRight: ds.spacing[4],
  },
  dropdown: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    minWidth: 280,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.15,
      radius: 12,
      elevation: 8,
    }),
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing[3],
  },
  avatarTextLarge: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    fontFamily: ds.typography.fontFamily.base,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[1],
  },
  userEmail: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[2],
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.primary.lightest,
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.md,
    alignSelf: 'flex-start',
    gap: ds.spacing[1],
  },
  roleText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  menuSection: {
    paddingVertical: ds.spacing[2],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[5],
    paddingVertical: ds.spacing[3],
    gap: ds.spacing[3],
  },
  menuText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  adminMenuItem: {
    backgroundColor: ds.colors.warning + '10', // 10% opacity
  },
  adminMenuText: {
    color: ds.colors.warning,
    fontWeight: ds.typography.fontWeight.medium,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.neutral[300],
    padding: 2,
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  toggleActive: {
    backgroundColor: ds.colors.primary.main,
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleHandleActive: {
    transform: [{ translateX: 20 }],
  },
  signOutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[6],
  },
  signOutModal: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  signOutHeader: {
    alignItems: 'center',
    paddingTop: ds.spacing[8],
    paddingHorizontal: ds.spacing[6],
    paddingBottom: ds.spacing[4],
  },
  signOutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ds.colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[4],
  },
  signOutTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  signOutContent: {
    paddingHorizontal: ds.spacing[6],
    paddingBottom: ds.spacing[6],
  },
  signOutMessage: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.primary,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.lg.lineHeight + 4,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  signOutSubMessage: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.base.lineHeight + 2,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  signOutQuote: {
    backgroundColor: ds.colors.neutral[50],
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.primary.main,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[6],
  },
  quote: {
    fontSize: ds.typography.fontSize.base.size,
    fontStyle: 'italic',
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  quoteAuthor: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    textAlign: 'right',
    fontFamily: ds.typography.fontFamily.base,
  },
  beAlignedMessage: {
    alignItems: 'center',
    marginBottom: ds.spacing[4],
  },
  beText: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[1],
  },
  beSubtext: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  signOutActions: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    paddingHorizontal: ds.spacing[6],
    paddingBottom: ds.spacing[6],
  },
  signOutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
  },
  stayButton: {
    backgroundColor: ds.colors.background.secondary,
    borderWidth: 2,
    borderColor: ds.colors.primary.main,
  },
  stayButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  continueButton: {
    backgroundColor: ds.colors.primary.main,
  },
  continueButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
})
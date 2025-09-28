import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Platform, Alert, Modal } from 'react-native'
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

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user])

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      if (!error && data) {
        setProfile(data)
        setIsActualAdmin(data.role === 'admin')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
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
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Thank you for your reflection journey with BeH2O. Are you ready to sign out and continue growing differently?')
      if (!confirmed) return
    } else {
      Alert.alert(
        'Continue Growing Differently',
        'Thank you for your reflection journey with BeH2O. Are you ready to sign out and continue this growth in your daily life?',
        [
          { text: 'Stay Longer', style: 'cancel' },
          {
            text: 'Continue Growing',
            style: 'default',
            onPress: performSignOut,
          },
        ]
      )
      return
    }
    
    performSignOut()
  }

  async function performSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        router.replace('/(auth)/login')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      router.replace('/(auth)/login')
    }
  }

  const handleMenuAction = (action: string) => {
    setShowDropdown(false)
    
    switch (action) {
      case 'profile':
        router.push('/(tabs)/profile')
        break
      case 'settings':
        router.push('/(tabs)/settings')
        break
      case 'help':
        router.push('/(marketing)/faq')
        break
      case 'admin':
        router.push('/(tabs)/admin')
        break
      case 'signout':
        handleSignOut()
        break
    }
  }

  const isAdmin = profile?.role === 'admin' || user?.role === 'admin'

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
                  onPress={() => handleMenuAction('profile')}
                >
                  <Ionicons name="person-outline" size={20} color={ds.colors.text.secondary} />
                  <Text style={styles.menuText}>Profile</Text>
                </Pressable>

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
})
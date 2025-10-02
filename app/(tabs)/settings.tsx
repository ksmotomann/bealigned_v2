import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useAdmin } from '../../contexts/AdminContext'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import AdminSettings from '../../components/AdminSettings'
import AdminTrainingTranscripts from '../../components/AdminTrainingTranscripts'
import ds from '../../styles/design-system'
import { BeAlignedModal } from '../../components/BeAligned/BeAlignedModal'

export default function Settings() {
  const router = useRouter()
  const { adminViewEnabled, setAdminViewEnabled, isActualAdmin, setIsActualAdmin } = useAdmin()
  const [activeSection, setActiveSection] = useState('profile')
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Settings state
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  // Profile edit state
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [editProfileData, setEditProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    your_why: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Chat configuration state
  const [showStepGuidance, setShowStepGuidance] = useState(true)
  const [autoAdvanceSteps, setAutoAdvanceSteps] = useState(true)
  const [showFeelingsHelper, setShowFeelingsHelper] = useState(true)
  const [showNeedsHelper, setShowNeedsHelper] = useState(true)
  const [showPhasePrompts, setShowPhasePrompts] = useState(false)

  // BeAligned modal state
  const [showBeAligned, setShowBeAligned] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [showTrainingTranscripts, setShowTrainingTranscripts] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  // Subscription state
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  // Admin management state
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showApprovals, setShowApprovals] = useState(false)
  const [showAlignmentCodes, setShowAlignmentCodes] = useState(false)
  const [users, setUsers] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [alignmentCodes, setAlignmentCodes] = useState([])
  const [managementLoading, setManagementLoading] = useState(false)

  // Settings sections - dynamically include admin section for admins
  const getSettingsSections = () => {
    const baseSections = [
      { id: 'profile', title: 'Profile', icon: 'person-outline' },
      { id: 'notifications', title: 'Notifications', icon: 'notifications-outline' },
      { id: 'privacy', title: 'Privacy & Data', icon: 'shield-checkmark-outline' },
      { id: 'account', title: 'Account', icon: 'card-outline' },
      { id: 'connected', title: 'Connected Services', icon: 'link-outline' },
      { id: 'support', title: 'Support', icon: 'help-circle-outline' },
    ]

    // Only show Reflection Settings for admins
    if (isActualAdmin) {
      baseSections.splice(2, 0, { id: 'reflection', title: 'Reflection Settings', icon: 'chatbubbles-outline' })
      baseSections.push({ id: 'admin', title: 'Administration', icon: 'settings-outline' })
      console.log('✅ Administration section added to sidebar')
    } else {
      console.log('❌ Administration section NOT added - isActualAdmin:', isActualAdmin)
    }

    return baseSections
  }

  useEffect(() => {
    loadProfile()
    loadSubscription()
  }, [])

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error
        setProfile(data)
        const isAdmin = data?.user_type === 'admin' || data?.user_type === 'super_admin'
        setIsActualAdmin(isAdmin)
        console.log('🔍 Admin Status Check:', {
          user_type: data?.user_type,
          isAdmin,
          email: session.user.email
        })

        // Load preferences from profile settings
        const preferences = data?.settings || {}
        setShowPhasePrompts(preferences.showPhasePrompts ?? false)
        setShowStepGuidance(preferences.showStepGuidance ?? true)
        setAutoAdvanceSteps(preferences.autoAdvanceSteps ?? true)
        setShowFeelingsHelper(preferences.showFeelingsHelper ?? true)
        setShowNeedsHelper(preferences.showNeedsHelper ?? true)

        // Populate edit form data
        setEditProfileData({
          first_name: data?.first_name || '',
          last_name: data?.last_name || '',
          email: session.user.email || '',
          your_why: data?.your_why || '',
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(key: string, value: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentSettings = profile?.settings || {}
      const newSettings = { ...currentSettings, [key]: value }

      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', user.id)

      if (error) throw error

      // Update local profile state
      setProfile(prev => ({ ...prev, settings: newSettings }))
    } catch (error) {
      console.error('Error updating preference:', error)
    }
  }

  async function loadSubscription() {
    setSubscriptionLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user's subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .single()

      if (subData) {
        setSubscription(subData)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  async function handleManageSubscription() {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'get_portal_link' }
      })

      if (error) throw error

      if (data?.url) {
        await Linking.openURL(data.url)
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      setSaveMessage({ type: 'error', text: 'Failed to open subscription management' })
    }
  }

  async function handleCancelSubscription() {
    try {
      await supabase.functions.invoke('manage-subscription', {
        body: { action: 'cancel' }
      })
      setSaveMessage({ type: 'success', text: 'Subscription will cancel at period end' })
      loadSubscription() // Refresh
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to cancel subscription' })
    }
  }

  async function signOut() {
    setShowSignOutModal(true)
  }

  async function performSignOut() {
    try {
      // Close the modal first
      setShowSignOutModal(false)

      // Clear local session first
      setSession(null)
      setProfile(null)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error signing out:', error)
      }

      // Always redirect to login, even if there's an error
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Sign out error:', error)
      router.replace('/(auth)/login')
    }
  }

  async function handleSaveProfile() {
    if (!session?.user?.id) return

    setSaving(true)
    setSaveMessage(null)

    try {
      // Validate required fields
      if (!editProfileData.first_name.trim() || !editProfileData.last_name.trim()) {
        throw new Error('First name and last name are required')
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editProfileData.first_name.trim(),
          last_name: editProfileData.last_name.trim(),
          your_why: editProfileData.your_why.trim(),
        })
        .eq('id', session.user.id)

      if (profileError) throw profileError

      // Update email if changed
      if (editProfileData.email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editProfileData.email
        })

        if (emailError) throw emailError

        setSaveMessage({
          type: 'success',
          text: 'Profile updated! Please check your email to confirm the new address.'
        })
      } else {
        setSaveMessage({
          type: 'success',
          text: 'Profile updated successfully!'
        })
      }

      // Refresh profile data
      await loadProfile()

      // Close modal after a short delay
      setTimeout(() => {
        setShowEditProfile(false)
        setSaveMessage(null)
      }, 2000)

    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveMessage({
        type: 'error',
        text: error.message || 'Failed to update profile'
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!session?.user) return

    setSaving(true)
    setSaveMessage(null)

    try {
      // Validate passwords
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error('All password fields are required')
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match')
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters')
      }

      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setSaveMessage({
        type: 'success',
        text: 'Password changed successfully!'
      })

      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      // Close modal after a short delay
      setTimeout(() => {
        setShowChangePassword(false)
        setSaveMessage(null)
      }, 2000)

    } catch (error) {
      console.error('Error changing password:', error)
      setSaveMessage({
        type: 'error',
        text: error.message || 'Failed to change password'
      })
    } finally {
      setSaving(false)
    }
  }

  // Admin Management Functions
  async function loadUsers() {
    if (!isActualAdmin) return
    setManagementLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, user_type, alignment_code_used, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      setSaveMessage({ type: 'error', text: 'Failed to load users' })
    } finally {
      setManagementLoading(false)
    }
  }

  async function loadPendingApprovals() {
    if (!isActualAdmin) return
    setManagementLoading(true)
    try {
      // Load alignment codes that need approval (ADMIN-REQUEST type)
      const { data, error } = await supabase
        .from('alignment_codes')
        .select('*')
        .eq('code', 'ADMIN-REQUEST')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Alignment codes table may not exist yet:', error)
        setPendingApprovals([]) // Set empty array if table doesn't exist
      } else {
        setPendingApprovals(data || [])
      }
    } catch (error) {
      console.warn('Error loading approvals (table may not exist):', error)
      setPendingApprovals([]) // Set empty array instead of showing error
    } finally {
      setManagementLoading(false)
    }
  }

  async function updateUserType(userId: string, newUserType: string) {
    if (!isActualAdmin) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newUserType, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      setSaveMessage({ type: 'success', text: `User type updated to ${newUserType}` })
      loadUsers() // Refresh the list
    } catch (error) {
      console.error('Error updating user type:', error)
      setSaveMessage({ type: 'error', text: 'Failed to update user type' })
    }
  }

  async function approveAlignmentRequest(requestId: string, userId: string) {
    if (!isActualAdmin) return
    try {
      // Update the request status
      const { error: approvalError } = await supabase
        .from('alignment_codes')
        .update({ status: 'approved', approved_by: session?.user?.id })
        .eq('id', requestId)

      if (approvalError) throw approvalError

      // Update user to admin type
      const { error: userError } = await supabase
        .from('profiles')
        .update({ user_type: 'admin', updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (userError) throw userError

      setSaveMessage({ type: 'success', text: 'Admin request approved successfully' })
      loadPendingApprovals() // Refresh
      loadUsers() // Refresh
    } catch (error) {
      console.error('Error approving request:', error)
      setSaveMessage({ type: 'error', text: 'Failed to approve request' })
    }
  }

  async function rejectAlignmentRequest(requestId: string) {
    if (!isActualAdmin) return
    try {
      // Update the request status to rejected
      const { error } = await supabase
        .from('alignment_codes')
        .update({ status: 'rejected', approved_by: session?.user?.id })
        .eq('id', requestId)

      if (error) throw error

      setSaveMessage({ type: 'success', text: 'Admin request rejected successfully' })
      loadPendingApprovals() // Refresh
    } catch (error) {
      console.error('Error rejecting request:', error)
      setSaveMessage({ type: 'error', text: 'Failed to reject request' })
    }
  }

  const renderActiveSection = () => {
    console.log('🔧 renderActiveSection called with:', activeSection)
    switch (activeSection) {
      case 'profile':
        return renderProfileSection()
      case 'notifications':
        return renderNotificationsSection()
      case 'reflection':
        return renderReflectionSection()
      case 'privacy':
        return renderPrivacySection()
      case 'account':
        return renderAccountSection()
      case 'connected':
        return renderConnectedServicesSection()
      case 'support':
        return renderSupportSection()
      case 'admin':
        return renderAdminSection()
      default:
        return renderProfileSection()
    }
  }

  const renderProfileSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Profile</Text>

      <View style={styles.infoSection}>
        <Text style={styles.subsectionTitle}>Personal Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>
            {profile?.first_name} {profile?.last_name}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{session?.user?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{profile?.role || 'User'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Your Why</Text>
          <Text style={styles.value}>
            {profile?.your_why ? profile.your_why : 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <Text style={styles.subsectionTitle}>Profile Actions</Text>

        <Pressable style={styles.preferenceRow} onPress={() => setShowEditProfile(true)}>
          <Text style={styles.preferenceText}>Edit Profile</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.preferenceRow} onPress={() => setShowChangePassword(true)}>
          <Text style={styles.preferenceText}>Change Password</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  )

  const renderNotificationsSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Notifications</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Receive notifications about your reflections
          </Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Email Updates</Text>
          <Text style={styles.settingDescription}>
            Weekly summary of your reflection journey
          </Text>
        </View>
        <Switch
          value={emailUpdates}
          onValueChange={setEmailUpdates}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Email Preferences</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </View>
  )

  const renderReflectionSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Reflection Settings</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Show Step Guidance</Text>
          <Text style={styles.settingDescription}>
            Display helpful prompts during reflections
          </Text>
        </View>
        <Switch
          value={showStepGuidance}
          onValueChange={setShowStepGuidance}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Auto-advance Steps</Text>
          <Text style={styles.settingDescription}>
            Automatically move to next step when complete
          </Text>
        </View>
        <Switch
          value={autoAdvanceSteps}
          onValueChange={(value) => {
            setAutoAdvanceSteps(value)
            updatePreference('autoAdvanceSteps', value)
          }}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Show Feelings Helper</Text>
          <Text style={styles.settingDescription}>
            Quick access to feelings selector in Step 3
          </Text>
        </View>
        <Switch
          value={showFeelingsHelper}
          onValueChange={setShowFeelingsHelper}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Show Needs Helper</Text>
          <Text style={styles.settingDescription}>
            Quick access to needs selector in Step 4
          </Text>
        </View>
        <Switch
          value={showNeedsHelper}
          onValueChange={setShowNeedsHelper}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Show Phase Prompts</Text>
          <Text style={styles.settingDescription}>
            Display "PHASE X:" labels in chat messages
          </Text>
        </View>
        <Switch
          value={showPhasePrompts}
          onValueChange={(value) => {
            setShowPhasePrompts(value)
            updatePreference('showPhasePrompts', value)
          }}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Auto-save Reflections</Text>
          <Text style={styles.settingDescription}>
            Automatically save your progress
          </Text>
        </View>
        <Switch
          value={autoSave}
          onValueChange={setAutoSave}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Response Style</Text>
        <View style={styles.preferenceValue}>
          <Text style={styles.preferenceValueText}>Supportive</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Session Time Limit</Text>
        <View style={styles.preferenceValue}>
          <Text style={styles.preferenceValueText}>No Limit</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Clear Chat History</Text>
        <Text style={[styles.chevron, styles.dangerText]}>›</Text>
      </Pressable>

      <Pressable
        style={[styles.preferenceRow, styles.beAlignedRow]}
        onPress={() => setShowBeAligned(true)}
      >
        <View style={styles.settingInfo}>
          <Text style={[styles.preferenceText, styles.beAlignedText]}>🧘‍♀️ BeAligned Reflection (Beta)</Text>
          <Text style={styles.settingDescription}>
            Guided 7-phase reflection for co-parenting challenges
          </Text>
        </View>
        <Text style={[styles.chevron, styles.beAlignedChevron]}>›</Text>
      </Pressable>
    </View>
  )

  const renderPrivacySection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Privacy & Data</Text>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Privacy Settings</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Export My Data</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Download Reflections</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Text style={styles.settingDescription}>
            Use dark theme (coming soon)
          </Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
          disabled
        />
      </View>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Language & Region</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={[styles.preferenceRow, styles.dangerRow]}>
        <Text style={[styles.preferenceText, styles.dangerText]}>Delete Account</Text>
        <Text style={[styles.chevron, styles.dangerText]}>›</Text>
      </Pressable>
    </View>
  )

  const renderAccountSection = () => {
    const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing'

    return (
      <View style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.infoSection}>
          <Text style={styles.subsectionTitle}>Subscription</Text>

          {subscriptionLoading ? (
            <Text style={styles.loadingText}>Loading subscription...</Text>
          ) : hasActiveSubscription ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.activeStatusBadge}>
                    <Text style={styles.statusBadgeText}>Active</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Plan Status</Text>
                <Text style={styles.value}>{subscription.status}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Renews</Text>
                <Text style={styles.value}>
                  {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                </Text>
              </View>

              {subscription.cancel_at_period_end && (
                <View style={styles.cancelNoticeContainer}>
                  <Text style={styles.cancelNotice}>
                    Your subscription will cancel at the end of this period
                  </Text>
                </View>
              )}

              <View style={styles.subscriptionActions}>
                <Pressable style={styles.manageSubscriptionButton} onPress={handleManageSubscription}>
                  <Text style={styles.manageSubscriptionText}>Manage Billing</Text>
                </Pressable>

                {!subscription.cancel_at_period_end && (
                  <Pressable style={styles.cancelSubscriptionButton} onPress={handleCancelSubscription}>
                    <Text style={styles.cancelSubscriptionText}>Cancel Subscription</Text>
                  </Pressable>
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>No Active Subscription</Text>
              </View>

              <Pressable
                style={styles.upgradeButton}
                onPress={() => router.push('/(tabs)/subscription')}
              >
                <Text style={styles.upgradeButtonText}>View Plans & Subscribe</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    )
  }

  const renderConnectedServicesSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Connected Services</Text>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Link Calendar</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Integrations</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </View>
  )

  const renderSupportSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Support</Text>

      <Pressable
        style={styles.preferenceRow}
        onPress={() => router.push('/(marketing)/faq')}
      >
        <Text style={styles.preferenceText}>Help & FAQ</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.preferenceRow}
        onPress={() => router.push('/(marketing)/contact')}
      >
        <Text style={styles.preferenceText}>Contact Support</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>Terms & Privacy</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.preferenceRow}>
        <Text style={styles.preferenceText}>About BeAligned</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* App Version */}
      <View style={styles.versionSection}>
        <Text style={styles.versionText}>BeAligned Version 1.0.0</Text>
        <Text style={styles.versionSubtext}>© 2024 BeH2O. All rights reserved.</Text>
      </View>
    </View>
  )

  const renderAdminSection = () => {
    console.log('🔧 renderAdminSection called')
    return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Administration</Text>

      <Pressable
        style={styles.preferenceRow}
        onPress={() => {
          setShowUserManagement(true)
          loadUsers()
        }}
      >
        <View style={styles.preferenceContent}>
          <Ionicons name="people-outline" size={20} color={ds.colors.primary.main} />
          <Text style={[styles.preferenceText, { marginLeft: 12, fontWeight: '600' }]}>User Management</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.preferenceRow}
        onPress={() => {
          console.log('🔵 Pending Approvals clicked!')
          setShowApprovals(true)
          loadPendingApprovals()
        }}
      >
        <View style={styles.preferenceContent}>
          <Ionicons name="checkmark-circle-outline" size={20} color={ds.colors.warning} />
          <Text style={[styles.preferenceText, { marginLeft: 12, fontWeight: '600' }]}>
            Pending Approvals {pendingApprovals.length > 0 ? `(${pendingApprovals.length})` : ''}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={[styles.preferenceRow, styles.adminDashboardRow]}
        onPress={() => router.push('/(tabs)/admin')}
      >
        <View style={styles.preferenceContent}>
          <Ionicons name="shield-checkmark-outline" size={20} color={ds.colors.primary.main} />
          <Text style={[styles.preferenceText, { marginLeft: 12, fontWeight: '600' }]}>Admin Dashboard</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.preferenceRow}
        onPress={() => setAdminViewEnabled(!adminViewEnabled)}
      >
        <View style={styles.preferenceContent}>
          <Ionicons
            name={adminViewEnabled ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={ds.colors.primary.main}
          />
          <Text style={[styles.preferenceText, { marginLeft: 12 }]}>
            Admin Features: {adminViewEnabled ? 'On' : 'Off'}
          </Text>
        </View>
        <View style={[styles.toggle, adminViewEnabled && styles.toggleActive]}>
          <View style={[styles.toggleHandle, adminViewEnabled && styles.toggleHandleActive]} />
        </View>
      </Pressable>
    </View>
  )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />

      <View style={styles.header}>
        <Ionicons name="settings" size={24} color={ds.colors.primary.main} />
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your preferences and account settings</Text>
      </View>

      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {getSettingsSections().map((section) => (
              <Pressable
                key={section.id}
                style={[
                  styles.sidebarItem,
                  activeSection === section.id && styles.sidebarItemActive
                ]}
                onPress={() => setActiveSection(section.id)}
              >
                <Ionicons
                  name={section.icon as any}
                  size={20}
                  color={activeSection === section.id ? ds.colors.primary.main : ds.colors.text.secondary}
                />
                <Text style={[
                  styles.sidebarItemText,
                  activeSection === section.id && styles.sidebarItemTextActive
                ]}>
                  {section.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          {renderActiveSection()}
        </ScrollView>
      </View>

      <BeAlignedModal
        visible={showBeAligned}
        onClose={() => setShowBeAligned(false)}
        onComplete={(reflection) => {
          console.log('BeAligned reflection completed:', reflection.finalMessage)
          // TODO: Save to Supabase if desired
        }}
      />

      {/* Admin Dashboard Modal */}
      <Modal
        visible={showAdminDashboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdminDashboard(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Training Settings</Text>
            <Pressable
              onPress={() => setShowAdminDashboard(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <AdminSettings />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Training Transcripts Modal */}
      <Modal
        visible={showTrainingTranscripts}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowTrainingTranscripts(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Training Transcripts</Text>
            <Pressable
              onPress={() => setShowTrainingTranscripts(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </Pressable>
          </View>
          <AdminTrainingTranscripts />
        </SafeAreaView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Pressable
              onPress={() => setShowEditProfile(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formContainer}>
              {saveMessage && (
                <View style={[
                  styles.saveMessage,
                  saveMessage.type === 'success' ? styles.saveMessageSuccess : styles.saveMessageError
                ]}>
                  <Ionicons
                    name={saveMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveMessageText}>{saveMessage.text}</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>First Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editProfileData.first_name}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, first_name: text }))}
                  placeholder="Enter your first name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Last Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editProfileData.last_name}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, last_name: text }))}
                  placeholder="Enter your last name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={editProfileData.email}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.formHelperText}>
                  Changing your email will require confirmation
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Your Why</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={editProfileData.your_why}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, your_why: text }))}
                  placeholder="What drives your co-parenting journey? What's your deeper purpose?"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.formHelperText}>
                  Share the deeper purpose that guides your co-parenting decisions
                </Text>
              </View>

              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <Text style={styles.saveButtonText}>Saving...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Pressable
              onPress={() => setShowChangePassword(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formContainer}>
              {saveMessage && (
                <View style={[
                  styles.saveMessage,
                  saveMessage.type === 'success' ? styles.saveMessageSuccess : styles.saveMessageError
                ]}>
                  <Ionicons
                    name={saveMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveMessageText}>{saveMessage.text}</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Enter your current password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Enter your new password"
                  secureTextEntry
                />
                <Text style={styles.formHelperText}>
                  Password must be at least 6 characters
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm your new password"
                  secureTextEntry
                />
              </View>

              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <Text style={styles.saveButtonText}>Changing...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Change Password</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* User Management Modal */}
      <Modal
        visible={showUserManagement}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowUserManagement(false)}
      >
        <SafeAreaView style={styles.managementModal}>
          <View style={styles.managementHeader}>
            <Pressable onPress={() => setShowUserManagement(false)}>
              <Ionicons name="arrow-back" size={24} color={ds.colors.text.primary} />
            </Pressable>
            <Text style={styles.managementTitle}>User Management</Text>
          </View>

          <ScrollView style={styles.managementContent}>
            {managementLoading ? (
              <Text>Loading users...</Text>
            ) : (
              users.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <Text style={styles.userName}>
                      {user.first_name} {user.last_name}
                    </Text>
                    <Text style={styles.userType}>{user.user_type || 'user'}</Text>
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <View style={styles.userActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => updateUserType(user.id, 'user')}
                    >
                      <Text style={styles.actionButtonText}>Set User</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => updateUserType(user.id, 'expert')}
                    >
                      <Text style={styles.actionButtonText}>Set Expert</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => updateUserType(user.id, 'admin')}
                    >
                      <Text style={styles.actionButtonText}>Set Admin</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Pending Approvals Modal */}
      <Modal
        visible={showApprovals}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowApprovals(false)}
      >
        <SafeAreaView style={styles.managementModal}>
          <View style={styles.managementHeader}>
            <Pressable onPress={() => setShowApprovals(false)}>
              <Ionicons name="arrow-back" size={24} color={ds.colors.text.primary} />
            </Pressable>
            <Text style={styles.managementTitle}>Pending Approvals</Text>
          </View>

          <ScrollView style={styles.managementContent}>
            {managementLoading ? (
              <Text>Loading approvals...</Text>
            ) : pendingApprovals.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 50, color: ds.colors.text.secondary }}>
                No pending approvals
              </Text>
            ) : (
              pendingApprovals.map((approval) => (
                <View key={approval.id} style={styles.approvalCard}>
                  <Text style={styles.userName}>Admin Access Request</Text>
                  <Text style={styles.userEmail}>Code: {approval.code}</Text>
                  <Text style={styles.userEmail}>Requested: {new Date(approval.created_at).toLocaleDateString()}</Text>

                  <View style={styles.approvalActions}>
                    <Pressable
                      style={styles.approveButton}
                      onPress={() => approveAlignmentRequest(approval.id, approval.requested_by)}
                    >
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={styles.rejectButton}
                      onPress={() => rejectAlignmentRequest(approval.id)}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
              <Text style={styles.signOutTitle}>Continue Growing Differently</Text>
            </View>

            <View style={styles.signOutContent}>
              <Text style={styles.signOutMessage}>
                Thank you for your reflection journey with BeH2O®. The insights you've discovered and the growth you've experienced are yours to carry forward.
              </Text>

              <Text style={styles.signOutSubMessage}>
                Are you ready to sign out and continue this growth in your daily life?
              </Text>

              <View style={styles.signOutQuote}>
                <Text style={styles.quote}>
                  "In between every stimulus and response there is a space. In that space is the power to choose..."
                </Text>
                <Text style={styles.quoteAuthor}>- Victor Frankl</Text>
              </View>

              <View style={styles.beAlignedMessage}>
                <Text style={styles.beText}>Be</Text>
                <Text style={styles.beSubtext}>Be conscious. Be your BeAligned.</Text>
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
                <Text style={styles.continueButtonText}>Continue Growing</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    gap: ds.spacing[3],
  },
  headerTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  headerSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: ds.colors.background.primary,
    borderRightWidth: 1,
    borderRightColor: ds.colors.neutral[200],
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    gap: ds.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
  },
  sidebarItemActive: {
    backgroundColor: ds.colors.primary.lightest,
    borderRightWidth: 3,
    borderRightColor: ds.colors.primary.main,
  },
  sidebarItemText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  sidebarItemTextActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
  },
  mainContent: {
    flex: 1,
  },
  sectionContent: {
    padding: ds.spacing[6],
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.heading,
  },
  subsectionTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.spacing[4],
    marginTop: ds.spacing[6],
  },
  infoSection: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[4],
    ...ds.shadows.base,
  },
  buttonSection: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    ...ds.shadows.base,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
  },
  label: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  value: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
  },
  settingInfo: {
    flex: 1,
    marginRight: ds.spacing[4],
  },
  settingLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[1],
  },
  settingDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
  },
  preferenceText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  chevron: {
    fontSize: ds.typography.fontSize.xl.size,
    color: ds.colors.text.tertiary,
  },
  preferenceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  preferenceValueText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  signOutButton: {
    marginTop: ds.spacing[4],
    backgroundColor: ds.colors.danger,
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
    marginLeft: ds.spacing[2],
  },
  dangerRow: {
    borderBottomColor: ds.colors.danger + '20',
  },
  dangerText: {
    color: ds.colors.danger,
  },
  beAlignedRow: {
    backgroundColor: ds.colors.primary.main + '08',
    borderLeftWidth: 3,
    borderLeftColor: ds.colors.primary.main,
    paddingLeft: ds.spacing[4],
  },
  beAlignedText: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  beAlignedChevron: {
    color: ds.colors.primary.main,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: ds.spacing[8],
    marginTop: ds.spacing[6],
  },
  versionText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  versionSubtext: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  preferenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: ds.colors.neutral[300],
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: ds.colors.primary.main,
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleHandleActive: {
    transform: [{ translateX: 20 }],
  },
  adminDashboardRow: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: ds.colors.primary.main,
    paddingLeft: ds.spacing[4],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    padding: ds.spacing[6],
  },
  formGroup: {
    marginBottom: ds.spacing[4],
  },
  formLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  formInput: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  formHelperText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  saveButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    marginTop: ds.spacing[4],
  },
  saveButtonDisabled: {
    backgroundColor: ds.colors.neutral[400],
  },
  saveButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  saveMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[4],
  },
  saveMessageSuccess: {
    backgroundColor: ds.colors.success,
  },
  saveMessageError: {
    backgroundColor: ds.colors.danger,
  },
  saveMessageText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
    flex: 1,
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
    ...ds.shadows.lg,
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
  // Admin Management Styles
  managementTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: ds.colors.warning,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: ds.typography.fontFamily.base,
  },
  managementModal: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  managementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ds.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  managementTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    marginLeft: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.heading,
  },
  managementContent: {
    flex: 1,
    padding: ds.spacing[4],
  },
  userCard: {
    backgroundColor: ds.colors.background.secondary,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[3],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[2],
  },
  userName: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  userType: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.primary.main,
    textTransform: 'uppercase',
    fontFamily: ds.typography.fontFamily.base,
  },
  userEmail: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
  },
  userActions: {
    flexDirection: 'row',
    gap: ds.spacing[2],
  },
  actionButton: {
    flex: 1,
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  approvalCard: {
    backgroundColor: ds.colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.warning,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[3],
  },
  approvalActions: {
    flexDirection: 'row',
    gap: ds.spacing[2],
    marginTop: ds.spacing[3],
  },
  approveButton: {
    backgroundColor: ds.colors.success,
    flex: 1,
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: ds.colors.danger,
    flex: 1,
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  // Subscription styles
  statusContainer: {
    alignItems: 'flex-end',
  },
  activeStatusBadge: {
    backgroundColor: ds.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  cancelNoticeContainer: {
    backgroundColor: ds.colors.warning + '20',
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginTop: ds.spacing[3],
  },
  cancelNotice: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.warning,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
  },
  subscriptionActions: {
    marginTop: ds.spacing[4],
    gap: ds.spacing[2],
  },
  manageSubscriptionButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  manageSubscriptionText: {
    color: 'white',
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  cancelSubscriptionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ds.colors.danger,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  cancelSubscriptionText: {
    color: ds.colors.danger,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  upgradeButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.lg,
    alignItems: 'center',
    marginTop: ds.spacing[4],
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  textArea: {
    height: 80,
    paddingTop: ds.spacing[3],
  },
});
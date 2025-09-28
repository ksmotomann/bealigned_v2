import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import ds from '../../styles/design-system'
import { BeAlignedModal } from '../../components/BeAligned/BeAlignedModal'

export default function Settings() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Settings state
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  
  // Chat configuration state
  const [showStepGuidance, setShowStepGuidance] = useState(true)
  const [autoAdvanceSteps, setAutoAdvanceSteps] = useState(true)
  const [showFeelingsHelper, setShowFeelingsHelper] = useState(true)
  const [showNeedsHelper, setShowNeedsHelper] = useState(true)
  const [showPhasePrompts, setShowPhasePrompts] = useState(false)

  // BeAligned modal state
  const [showBeAligned, setShowBeAligned] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)

        // Load preferences from profile settings
        const preferences = data?.settings || {}
        setShowPhasePrompts(preferences.showPhasePrompts ?? false)
        setShowStepGuidance(preferences.showStepGuidance ?? true)
        setAutoAdvanceSteps(preferences.autoAdvanceSteps ?? true)
        setShowFeelingsHelper(preferences.showFeelingsHelper ?? true)
        setShowNeedsHelper(preferences.showNeedsHelper ?? true)
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

  const isAdmin = profile?.role === 'admin'

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <InAppNavigationHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences and account settings</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
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
        </View>

        {/* Chat Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat & Reflection Settings</Text>
          
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

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
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
            <Text style={styles.preferenceText}>Language & Region</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Privacy Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Pressable
            style={styles.preferenceRow}
            onPress={() => router.push('/(tabs)/subscription')}
          >
            <Text style={styles.preferenceText}>Manage Subscription</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
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
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>BeAligned Version 1.0.0</Text>
          <Text style={styles.versionSubtext}>© 2024 BeH2O. All rights reserved.</Text>
        </View>
      </ScrollView>

      <BeAlignedModal
        visible={showBeAligned}
        onClose={() => setShowBeAligned(false)}
        onComplete={(reflection) => {
          console.log('BeAligned reflection completed:', reflection.finalMessage)
          // TODO: Save to Supabase if desired
        }}
      />
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
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  title: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  section: {
    backgroundColor: ds.colors.background.primary,
    marginTop: ds.spacing[4],
    paddingVertical: ds.spacing[3],
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: ds.spacing[5],
    paddingBottom: ds.spacing[2],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing[5],
    paddingVertical: ds.spacing[3],
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
    paddingHorizontal: ds.spacing[5],
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
  dangerRow: {
    borderBottomColor: ds.colors.danger + '20',
  },
  dangerText: {
    color: ds.colors.danger,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: ds.spacing[8],
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
  beAlignedRow: {
    backgroundColor: ds.colors.primary.main + '08',
    borderLeftWidth: 3,
    borderLeftColor: ds.colors.primary.main,
  },
  beAlignedText: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  beAlignedChevron: {
    color: ds.colors.primary.main,
  },
})
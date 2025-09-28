import { View, Text, Pressable, StyleSheet, Alert, Platform, Modal, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { Ionicons } from '@expo/vector-icons'
import { useAdmin } from '../../contexts/AdminContext'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import AdminSettings from '../../components/AdminSettings'
import AdminTrainingTranscripts from '../../components/AdminTrainingTranscripts'
import ds from '../../styles/design-system'

export default function Profile() {
  const router = useRouter()
  const { adminViewEnabled, setAdminViewEnabled, isActualAdmin, setIsActualAdmin } = useAdmin()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [showTrainingTranscripts, setShowTrainingTranscripts] = useState(false)

  useEffect(() => {
    loadProfile()
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
        setIsActualAdmin(data?.role === 'admin')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    // For web, use confirm dialog. For mobile, use Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Thank you for your reflection journey with BeH2O. Are you ready to sign out and continue growing differently?')
      if (confirmed) {
        await performSignOut()
      }
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
    }
  }

  async function performSignOut() {
    try {
      // Clear local session first
      setSession(null)
      setProfile(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
      }
      
      // Always redirect to login, even if there's an error
      // This ensures the user is logged out from the UI perspective
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Sign out error:', error)
      // Still redirect on error
      router.replace('/(auth)/login')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader activeTab="profile" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your personal information and account</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
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
        </View>

        {/* Admin Dashboard Section - Only visible to admins */}
        {isActualAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            
            <Pressable 
              style={[styles.preferenceRow, styles.adminDashboardRow]}
              onPress={() => router.push('/(admin)')}
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
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <Pressable style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          
          <Pressable style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          
          <Pressable style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Email Preferences</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          
          <Pressable style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Privacy Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Pressable style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Export My Data</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          
          <Pressable style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Download Reflections</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          
          <Pressable style={[styles.preferenceRow, styles.dangerRow]}>
            <Text style={[styles.preferenceText, styles.dangerText]}>Delete Account</Text>
            <Text style={[styles.chevron, styles.dangerText]}>›</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
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
        
        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

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
  content: {
    flex: 1,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing[5],
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
  signOutButton: {
    margin: ds.spacing[5],
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
  },
  dangerRow: {
    borderBottomColor: ds.colors.danger + '20',
  },
  dangerText: {
    color: ds.colors.danger,
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
})
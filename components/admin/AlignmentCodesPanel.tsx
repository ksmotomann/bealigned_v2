import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ActivityIndicator, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import StandardModal from '../StandardModal'
import ds from '../../styles/design-system'

interface AlignmentCode {
  id: string
  code: string
  user_type: string
  description: string
  max_uses: number | null
  current_uses: number
  is_active: boolean
  created_at: string
  trial_days: number
  subscription_tier: string
  app_access_status: string
  custom_landing_message: any
}

interface CodeAnalytics {
  code: string
  total_active_users: number
  avg_logins_per_user: number
  avg_minutes_per_session: number
  extensions_percentage: number
  conversion_percentage: number
  expiring_in_14_days: number
}

interface CodeWithAnalytics extends AlignmentCode {
  analytics: CodeAnalytics
}

export default function AlignmentCodesPanel() {
  const [alignmentCodes, setAlignmentCodes] = useState<CodeWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All Types')
  const [filterTime, setFilterTime] = useState('All Time')

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCode, setEditingCode] = useState<CodeWithAnalytics | null>(null)
  const [editForm, setEditForm] = useState({
    description: '',
    is_active: true,
    trial_days: 30,
    subscription_tier: 'premium',
    app_access_status: 'full_access',
    landing_title: '',
    landing_message: '',
  })
  const [saving, setSaving] = useState(false)

  // Global stats
  const [totalActiveUsers, setTotalActiveUsers] = useState(0)
  const [totalExpiring, setTotalExpiring] = useState(0)
  const [avgExtensions, setAvgExtensions] = useState(0)
  const [avgConversion, setAvgConversion] = useState(0)

  useEffect(() => {
    loadAlignmentCodesWithAnalytics()
  }, [])

  const loadAlignmentCodesWithAnalytics = async () => {
    try {
      setLoading(true)

      // Fetch all alignment codes
      const { data: codes, error: codesError } = await supabase
        .from('alignment_codes')
        .select('*')
        .order('code', { ascending: true })

      if (codesError) throw codesError

      if (!codes) {
        setAlignmentCodes([])
        setLoading(false)
        return
      }

      // Fetch analytics for each code
      const codesWithAnalytics: CodeWithAnalytics[] = []
      let globalActiveUsers = 0
      let globalExpiring = 0
      let totalExtensionsPercentage = 0
      let totalConversionPercentage = 0
      let codeCount = 0

      for (const code of codes) {
        try {
          const { data: analyticsData, error: analyticsError } = await supabase
            .rpc('get_alignment_code_analytics', { p_code: code.code })

          if (!analyticsError && analyticsData && analyticsData.length > 0) {
            const analytics = analyticsData[0]
            codesWithAnalytics.push({
              ...code,
              analytics: {
                code: analytics.code,
                total_active_users: analytics.total_active_users || 0,
                avg_logins_per_user: parseFloat(analytics.avg_logins_per_user) || 0,
                avg_minutes_per_session: parseFloat(analytics.avg_minutes_per_session) || 0,
                extensions_percentage: parseFloat(analytics.extensions_percentage) || 0,
                conversion_percentage: parseFloat(analytics.conversion_percentage) || 0,
                expiring_in_14_days: analytics.expiring_in_14_days || 0,
              }
            })

            globalActiveUsers += analytics.total_active_users || 0
            globalExpiring += analytics.expiring_in_14_days || 0
            totalExtensionsPercentage += parseFloat(analytics.extensions_percentage) || 0
            totalConversionPercentage += parseFloat(analytics.conversion_percentage) || 0
            codeCount++
          } else {
            // No analytics yet for this code
            codesWithAnalytics.push({
              ...code,
              analytics: {
                code: code.code,
                total_active_users: 0,
                avg_logins_per_user: 0,
                avg_minutes_per_session: 0,
                extensions_percentage: 0,
                conversion_percentage: 0,
                expiring_in_14_days: 0,
              }
            })
          }
        } catch (error) {
          console.error(`Error loading analytics for code ${code.code}:`, error)
          // Add code with zero analytics
          codesWithAnalytics.push({
            ...code,
            analytics: {
              code: code.code,
              total_active_users: 0,
              avg_logins_per_user: 0,
              avg_minutes_per_session: 0,
              extensions_percentage: 0,
              conversion_percentage: 0,
              expiring_in_14_days: 0,
            }
          })
        }
      }

      setAlignmentCodes(codesWithAnalytics)
      setTotalActiveUsers(globalActiveUsers)
      setTotalExpiring(globalExpiring)
      setAvgExtensions(codeCount > 0 ? totalExtensionsPercentage / codeCount : 0)
      setAvgConversion(codeCount > 0 ? totalConversionPercentage / codeCount : 0)

    } catch (error) {
      console.error('Error loading alignment codes:', error)
      if (Platform.OS === 'web') {
        window.alert('Failed to load alignment codes')
      }
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('pilot')) return '🧪'
    if (type.toLowerCase().includes('beta')) return '⚗️'
    if (type.toLowerCase().includes('qa') || type.toLowerCase().includes('free')) return '🎁'
    return '👤'
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 70) return '#10B981' // green
    if (percentage >= 50) return '#F59E0B' // yellow
    if (percentage >= 30) return '#F97316' // orange
    return '#EF4444' // red
  }

  const handleEditCode = (code: CodeWithAnalytics) => {
    setEditingCode(code)
    setEditForm({
      description: code.description || '',
      is_active: code.is_active,
      trial_days: code.trial_days || 30,
      subscription_tier: code.subscription_tier || 'premium',
      app_access_status: code.app_access_status || 'full_access',
      landing_title: code.custom_landing_message?.title || '',
      landing_message: code.custom_landing_message?.message || '',
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCode) return

    setSaving(true)
    try {
      const updateData: any = {
        description: editForm.description,
        is_active: editForm.is_active,
        trial_days: editForm.trial_days,
        subscription_tier: editForm.subscription_tier,
        app_access_status: editForm.app_access_status,
        updated_at: new Date().toISOString(),
      }

      // Add custom landing message if restrict_with_landing is selected
      if (editForm.app_access_status === 'restrict_with_landing') {
        updateData.custom_landing_message = {
          title: editForm.landing_title,
          message: editForm.landing_message,
        }
      } else {
        updateData.custom_landing_message = null
      }

      const { error } = await supabase
        .from('alignment_codes')
        .update(updateData)
        .eq('id', editingCode.id)

      if (error) throw error

      if (Platform.OS === 'web') {
        window.alert('Alignment code updated successfully!')
      }

      setShowEditModal(false)
      setEditingCode(null)
      loadAlignmentCodesWithAnalytics()

    } catch (error) {
      console.error('Error updating alignment code:', error)
      if (Platform.OS === 'web') {
        window.alert('Failed to update alignment code')
      }
    } finally {
      setSaving(false)
    }
  }

  const filteredCodes = alignmentCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase())
    // Add filter logic for type and time if needed
    return matchesSearch
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ds.colors.primary.main} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alignment Codes</Text>
          <Text style={styles.subtitle}>Manage access codes and track user engagement</Text>
        </View>
        <View style={styles.superAdminBadge}>
          <Text style={styles.superAdminText}>SUPER ADMIN ACCESS</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="people" size={24} color={ds.colors.primary.main} />
          </View>
          <Text style={styles.statValue}>{totalActiveUsers}</Text>
          <Text style={styles.statLabel}>Total Active Users</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="time" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{totalExpiring}</Text>
          <Text style={styles.statLabel}>Expiring in ≤14 Days</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{avgExtensions.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Avg Extensions Earned</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="cash" size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.statValue}>{avgConversion.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Avg Conversion Rate</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={ds.colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search codes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={ds.colors.text.tertiary}
          />
        </View>

        <View style={styles.filtersRow}>
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterButtonText}>{filterType}</Text>
            <Ionicons name="chevron-down" size={16} color={ds.colors.text.secondary} />
          </Pressable>

          <Pressable style={styles.filterButton}>
            <Text style={styles.filterButtonText}>{filterTime}</Text>
            <Ionicons name="chevron-down" size={16} color={ds.colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.primaryButton}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Create New Code</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton}>
          <Ionicons name="download-outline" size={20} color={ds.colors.text.primary} />
          <Text style={styles.secondaryButtonText}>Export Report</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton}>
          <Ionicons name="settings-outline" size={20} color={ds.colors.text.primary} />
          <Text style={styles.secondaryButtonText}>Tools</Text>
        </Pressable>
      </View>

      {/* Data Table Header */}
      <Text style={styles.sectionTitle}>Alignment Codes Overview</Text>
      <Text style={styles.sectionSubtitle}>
        Comprehensive tracking of all access codes and user engagement metrics. Click on any code row to view and manage its notification schedule.
      </Text>

      {/* Data Table */}
      <View style={styles.table}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContent}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.codeColumn]}>Code</Text>
              <Text style={[styles.tableHeaderCell, styles.typeColumn]}>Type</Text>
              <Text style={[styles.tableHeaderCell, styles.numColumn]}>Active Users</Text>
              <Text style={[styles.tableHeaderCell, styles.numColumn]}>Avg Logins/User</Text>
              <Text style={[styles.tableHeaderCell, styles.numColumn]}>Avg Min/Session</Text>
              <Text style={[styles.tableHeaderCell, styles.numColumn]}>Extensions %</Text>
              <Text style={[styles.tableHeaderCell, styles.numColumn]}>Conversion %</Text>
              <Text style={[styles.tableHeaderCell, styles.numColumn]}>Expiring ≤14d</Text>
              <Text style={[styles.tableHeaderCell, styles.statusColumn]}>Status</Text>
            </View>

            {/* Table Rows */}
            {filteredCodes.map((code, index) => (
              <Pressable
                key={code.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven
                ]}
                onPress={() => handleEditCode(code)}
              >
                <View style={[styles.tableCell, styles.codeColumn]}>
                  <Ionicons name="link-outline" size={16} color={ds.colors.text.tertiary} />
                  <Text style={styles.codeText}>{code.code}</Text>
                </View>

                <View style={[styles.tableCell, styles.typeColumn]}>
                  <View style={[styles.typeBadge, {
                    backgroundColor: code.subscription_tier?.includes('pilot') ? '#EFF6FF' :
                                   code.subscription_tier?.includes('beta') ? '#FDF4FF' :
                                   '#F0FDF4'
                  }]}>
                    <Text style={styles.typeBadgeText}>
                      {getTypeIcon(code.subscription_tier)} {code.subscription_tier || 'User'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.tableCell, styles.numColumn]}>
                  {code.analytics.total_active_users}
                </Text>

                <Text style={[styles.tableCell, styles.numColumn]}>
                  {code.analytics.avg_logins_per_user.toFixed(1)}
                </Text>

                <Text style={[styles.tableCell, styles.numColumn]}>
                  {code.analytics.avg_minutes_per_session.toFixed(1)}
                </Text>

                <View style={[styles.tableCell, styles.numColumn]}>
                  <Text style={[styles.percentageText, {
                    color: getPercentageColor(code.analytics.extensions_percentage)
                  }]}>
                    {code.analytics.extensions_percentage.toFixed(0)}%
                  </Text>
                  <Ionicons
                    name={code.analytics.extensions_percentage >= 50 ? "trending-up" : "trending-down"}
                    size={12}
                    color={getPercentageColor(code.analytics.extensions_percentage)}
                  />
                </View>

                <View style={[styles.tableCell, styles.numColumn]}>
                  <Text style={[styles.percentageText, {
                    color: getPercentageColor(code.analytics.conversion_percentage)
                  }]}>
                    {code.analytics.conversion_percentage.toFixed(0)}%
                  </Text>
                  <Ionicons
                    name={code.analytics.conversion_percentage >= 50 ? "trending-up" : "trending-down"}
                    size={12}
                    color={getPercentageColor(code.analytics.conversion_percentage)}
                  />
                </View>

                <View style={[styles.tableCell, styles.numColumn]}>
                  {code.analytics.expiring_in_14_days > 0 ? (
                    <>
                      <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                      <Text style={[styles.expiringText, { color: '#F59E0B' }]}>
                        {code.analytics.expiring_in_14_days}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.expiringText}>-</Text>
                  )}
                </View>

                <View style={[styles.tableCell, styles.statusColumn]}>
                  <View style={[styles.statusBadge, {
                    backgroundColor: code.is_active ? '#D1FAE5' : '#FEE2E2'
                  }]}>
                    <View style={[styles.statusDot, {
                      backgroundColor: code.is_active ? '#10B981' : '#EF4444'
                    }]} />
                    <Text style={[styles.statusText, {
                      color: code.is_active ? '#065F46' : '#991B1B'
                    }]}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {filteredCodes.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={ds.colors.text.tertiary} />
          <Text style={styles.emptyText}>No alignment codes found</Text>
        </View>
      )}

      {/* Edit Code Modal */}
      <StandardModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${editingCode?.code}`}
        subtitle="Update code settings and access control"
        headerIcon="settings-outline"
        maxWidth={700}
        buttons={[
          {
            text: 'Cancel',
            onPress: () => setShowEditModal(false),
            variant: 'secondary',
          },
          {
            text: 'Save Changes',
            onPress: handleSaveEdit,
            variant: 'primary',
            loading: saving,
            icon: 'checkmark',
          },
        ]}
      >
        <View style={styles.editForm}>
          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editForm.description}
              onChangeText={(text) => setEditForm({ ...editForm, description: text })}
              placeholder="Code description"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Trial Days */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trial Days</Text>
            <TextInput
              style={styles.input}
              value={String(editForm.trial_days)}
              onChangeText={(text) => setEditForm({ ...editForm, trial_days: parseInt(text) || 0 })}
              placeholder="30"
              keyboardType="numeric"
            />
          </View>

          {/* Subscription Tier */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subscription Tier</Text>
            <TextInput
              style={styles.input}
              value={editForm.subscription_tier}
              onChangeText={(text) => setEditForm({ ...editForm, subscription_tier: text })}
              placeholder="pilot_partner, beta, premium, etc."
            />
          </View>

          {/* App Access Status */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>App Access Control</Text>
            <Text style={styles.helpText}>
              Controls what users with this code can access
            </Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'full_access', label: 'Full Access', description: 'Users can access all app features' },
                { value: 'restrict_with_landing', label: 'Restricted with Landing Page', description: 'Show custom landing page, restrict app access' },
                { value: 'approval_required', label: 'Approval Required', description: 'Admin approval needed before access' },
                { value: 'disabled', label: 'Disabled', description: 'Block all access' },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.radioOption,
                    editForm.app_access_status === option.value && styles.radioOptionActive
                  ]}
                  onPress={() => setEditForm({ ...editForm, app_access_status: option.value })}
                >
                  <View style={styles.radioButton}>
                    {editForm.app_access_status === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.radioContent}>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                    <Text style={styles.radioDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Custom Landing Message (only if restrict_with_landing) */}
          {editForm.app_access_status === 'restrict_with_landing' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Landing Page Title</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.landing_title}
                  onChangeText={(text) => setEditForm({ ...editForm, landing_title: text })}
                  placeholder="Welcome, BeBetaUser!"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Landing Page Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.landing_message}
                  onChangeText={(text) => setEditForm({ ...editForm, landing_message: text })}
                  placeholder="Enter the message to show on the landing page..."
                  multiline
                  numberOfLines={6}
                />
              </View>
            </>
          )}

          {/* Active Status */}
          <View style={styles.formGroup}>
            <Pressable
              style={[styles.checkboxRow]}
              onPress={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
            >
              <View style={[styles.checkbox, editForm.is_active && styles.checkboxChecked]}>
                {editForm.is_active && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <View>
                <Text style={styles.checkboxLabel}>Active</Text>
                <Text style={styles.checkboxDescription}>
                  Users can sign up with this code
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </StandardModal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
    padding: ds.spacing[6],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.background.secondary,
    gap: ds.spacing[3],
  },
  loadingText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[6],
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  superAdminBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.full,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  superAdminText: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: '#92400E',
    fontFamily: ds.typography.fontFamily.base,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: ds.spacing[4],
    marginBottom: ds.spacing[6],
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[5],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    ...ds.shadows.sm,
  },
  statIcon: {
    marginBottom: ds.spacing[3],
  },
  statValue: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[1],
  },
  statLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  controls: {
    marginBottom: ds.spacing[4],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    paddingHorizontal: ds.spacing[4],
    marginBottom: ds.spacing[3],
  },
  searchIcon: {
    marginRight: ds.spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: ds.spacing[3],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
  },
  filterButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  actions: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginBottom: ds.spacing[6],
    flexWrap: 'wrap',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[5],
    borderRadius: ds.borderRadius.lg,
    ...ds.shadows.sm,
  },
  primaryButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[5],
    borderRadius: ds.borderRadius.lg,
  },
  secondaryButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  sectionSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[4],
    lineHeight: 20,
  },
  table: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    overflow: 'hidden',
  },
  tableContent: {
    minWidth: 1200,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: ds.colors.neutral[50],
    borderBottomWidth: 2,
    borderBottomColor: ds.colors.neutral[200],
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
  },
  tableHeaderCell: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[4],
  },
  tableRowEven: {
    backgroundColor: ds.colors.neutral[50],
  },
  tableCell: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  codeColumn: {
    width: 150,
  },
  typeColumn: {
    width: 140,
  },
  numColumn: {
    width: 120,
  },
  statusColumn: {
    width: 100,
  },
  codeText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  typeBadge: {
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  typeBadgeText: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  percentageText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  expiringText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
    color: ds.colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing[12],
    gap: ds.spacing[3],
  },
  emptyText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  editForm: {
    gap: ds.spacing[5],
  },
  formGroup: {
    gap: ds.spacing[2],
  },
  label: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  helpText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[2],
  },
  input: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    gap: ds.spacing[2],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
    backgroundColor: ds.colors.background.primary,
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
  },
  radioOptionActive: {
    borderColor: ds.colors.primary.main,
    backgroundColor: ds.colors.primary.lightest,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ds.colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ds.colors.primary.main,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  radioDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
    padding: ds.spacing[3],
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: ds.borderRadius.sm,
    borderWidth: 2,
    borderColor: ds.colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  checkboxLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  checkboxDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
})

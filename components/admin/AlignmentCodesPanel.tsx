import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ActivityIndicator, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
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
              <View
                key={code.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven
                ]}
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
              </View>
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
})

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

type AnalyticsTab = 'overview' | 'performance' | 'activity'

interface CodeAnalytics {
  code: string
  description: string
  user_type: string
  total_users: number
  active_users: number
  trial_users: number
  converted_users: number
  expired_users: number
  conversion_rate: number
  last_used: string
}

interface TopPerformingCode {
  code: string
  user_type: string
  performance_score: number
  total_users: number
  conversion_rate: number
}

interface RecentUsage {
  code: string
  user_name: string
  user_email: string
  status: string
  used_at: string
  trial_ends_at: string | null
  days_in_trial: number
}

export default function AnalyticsPanel() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<CodeAnalytics[]>([])
  const [topPerformingCodes, setTopPerformingCodes] = useState<TopPerformingCode[]>([])
  const [recentUsage, setRecentUsage] = useState<RecentUsage[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Load all analytics data in parallel
      const [analyticsResult, topCodesResult, recentUsageResult] = await Promise.all([
        supabase.rpc('get_alignment_code_analytics'),
        supabase.rpc('get_top_performing_codes', { limit_count: 10 }),
        supabase.rpc('get_recent_code_usage', { days_back: 30 })
      ])

      if (analyticsResult.error) {
        console.error('Analytics error:', analyticsResult.error)
      } else {
        setAnalyticsData(analyticsResult.data || [])
      }

      if (topCodesResult.error) {
        console.error('Top codes error:', topCodesResult.error)
      } else {
        setTopPerformingCodes(topCodesResult.data || [])
      }

      if (recentUsageResult.error) {
        console.error('Recent usage error:', recentUsageResult.error)
      } else {
        setRecentUsage(recentUsageResult.data || [])
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview' as AnalyticsTab, label: 'Overview' },
    { id: 'performance' as AnalyticsTab, label: 'Performance' },
    { id: 'activity' as AnalyticsTab, label: 'Recent Activity' },
  ]

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alignment Code Analytics</Text>
      <Text style={styles.subtitle}>
        Track performance, usage patterns, and effectiveness of your alignment codes
      </Text>

      {/* Sub-tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ds.colors.primary.main} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View>
              <Text style={styles.sectionTitle}>Code Performance Summary</Text>
              {analyticsData.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No analytics data available yet</Text>
                </View>
              ) : (
                <View style={styles.codesList}>
                  {analyticsData.map((code, index) => (
                    <View key={index} style={styles.codeCard}>
                      <View style={styles.codeHeader}>
                        <View style={styles.codeHeaderLeft}>
                          <Text style={styles.codeText}>{code.code}</Text>
                          <Text style={styles.codeDescription}>{code.description}</Text>
                        </View>
                        <View style={[styles.tierBadge, {
                          backgroundColor:
                            code.user_type === 'admin' ? '#EF4444' :
                            code.user_type === 'expert' ? '#F59E0B' :
                            '#10B981'
                        }]}>
                          <Text style={styles.tierText}>{code.user_type.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.statsGrid}>
                        <Text style={styles.statItem}>Total Users: {code.total_users}</Text>
                        <Text style={styles.statItem}>
                          Active: {code.active_users} | Trial: {code.trial_users}
                        </Text>
                        <Text style={styles.statItem}>
                          Converted: {code.converted_users} | Expired: {code.expired_users}
                        </Text>
                        {code.conversion_rate > 0 && (
                          <Text style={[styles.statItem, styles.statSuccess]}>
                            Conversion Rate: {code.conversion_rate}%
                          </Text>
                        )}
                        {code.last_used && (
                          <Text style={styles.statItem}>
                            Last Used: {new Date(code.last_used).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <View>
              <Text style={styles.sectionTitle}>Top Performing Codes</Text>
              {topPerformingCodes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No performance data available yet</Text>
                </View>
              ) : (
                <View style={styles.codesList}>
                  {topPerformingCodes.map((code, index) => (
                    <View
                      key={index}
                      style={[
                        styles.codeCard,
                        styles.performanceCard,
                        {
                          borderLeftColor:
                            index === 0 ? '#FFD700' :
                            index === 1 ? '#C0C0C0' :
                            index === 2 ? '#CD7F32' :
                            ds.colors.neutral[300]
                        }
                      ]}
                    >
                      <View style={styles.codeHeader}>
                        <View style={styles.codeHeaderLeft}>
                          <Text style={styles.codeText}>
                            #{index + 1} {code.code}
                          </Text>
                          <Text style={styles.codeDescription}>
                            Performance Score: {Math.round(code.performance_score)}
                          </Text>
                        </View>
                        <View style={[styles.tierBadge, {
                          backgroundColor:
                            code.user_type === 'admin' ? '#EF4444' :
                            code.user_type === 'expert' ? '#F59E0B' :
                            '#10B981'
                        }]}>
                          <Text style={styles.tierText}>{code.user_type.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.statsGrid}>
                        <Text style={styles.statItem}>Total Users: {code.total_users}</Text>
                        <Text style={[styles.statItem, styles.statSuccess]}>
                          Conversion Rate: {code.conversion_rate}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <View>
              <Text style={styles.sectionTitle}>Recent Code Usage (Last 30 Days)</Text>
              {recentUsage.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No recent activity</Text>
                </View>
              ) : (
                <>
                  <View style={styles.codesList}>
                    {recentUsage.slice(0, 10).map((usage, index) => (
                      <View key={index} style={styles.codeCard}>
                        <View style={styles.codeHeader}>
                          <View style={styles.codeHeaderLeft}>
                            <Text style={styles.codeText}>{usage.code}</Text>
                            <Text style={styles.codeDescription}>
                              {usage.user_name} ({usage.user_email})
                            </Text>
                          </View>
                          <View style={[styles.tierBadge, {
                            backgroundColor:
                              usage.status === 'active' ? '#10B981' :
                              usage.status === 'converted' ? ds.colors.primary.main :
                              usage.status === 'expired' ? '#EF4444' :
                              '#F59E0B'
                          }]}>
                            <Text style={styles.tierText}>{usage.status.toUpperCase()}</Text>
                          </View>
                        </View>

                        <View style={styles.statsGrid}>
                          <Text style={styles.statItem}>
                            Used: {new Date(usage.used_at).toLocaleDateString()}
                          </Text>
                          {usage.trial_ends_at && (
                            <Text style={styles.statItem}>
                              Trial Ends: {new Date(usage.trial_ends_at).toLocaleDateString()}
                              ({usage.days_in_trial} days used)
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  {recentUsage.length > 10 && (
                    <Text style={styles.moreText}>
                      Showing 10 of {recentUsage.length} recent activities
                    </Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* Refresh Button */}
          <Pressable
            style={[styles.refreshButton, loading && styles.buttonDisabled]}
            onPress={loadAnalytics}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? 'Refreshing...' : 'Refresh Analytics'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    ...ds.shadows.lg,
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[6],
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[1],
    marginBottom: ds.spacing[6],
    gap: ds.spacing[1],
  },
  tab: {
    flex: 1,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: ds.colors.primary.main,
  },
  tabLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: ds.typography.fontWeight.semibold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing[12],
    gap: ds.spacing[3],
  },
  loadingText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[4],
  },
  emptyState: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  codesList: {
    gap: ds.spacing[4],
    marginBottom: ds.spacing[6],
  },
  codeCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[5],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  performanceCard: {
    borderLeftWidth: 4,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[3],
  },
  codeHeaderLeft: {
    flex: 1,
    marginRight: ds.spacing[3],
  },
  codeText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[1],
  },
  codeDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  tierBadge: {
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  tierText: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  statsGrid: {
    gap: ds.spacing[2],
  },
  statItem: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  statSuccess: {
    color: '#10B981',
    fontWeight: ds.typography.fontWeight.semibold,
  },
  moreText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
  },
  refreshButton: {
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
})

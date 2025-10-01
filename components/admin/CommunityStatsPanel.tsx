import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { TrendingUp, Users, MessageSquare, Heart, Eye } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

interface CommunityStats {
  totalPosts: number
  pendingPosts: number
  approvedPosts: number
  totalLikes: number
  totalComments: number
  totalViews: number
  activeUsers: number
}

export default function CommunityStatsPanel() {
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Get post stats
      const { data: posts } = await supabase
        .from('community_posts')
        .select('status, likes, user_id')

      const totalPosts = posts?.length || 0
      const pendingPosts = posts?.filter(p => p.status === 'pending').length || 0
      const approvedPosts = posts?.filter(p => p.status === 'approved').length || 0
      const totalLikes = posts?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0

      // Get unique active users
      const uniqueUsers = new Set(posts?.map(p => p.user_id) || [])
      const activeUsers = uniqueUsers.size

      // Get comment count
      const { count: totalComments } = await supabase
        .from('community_post_comments')
        .select('*', { count: 'exact', head: true })

      // Get video plays (total views)
      const { data: videos } = await supabase
        .from('founders_voice_videos')
        .select('plays')

      const totalViews = videos?.reduce((sum, v) => sum + (v.plays || 0), 0) || 0

      setStats({
        totalPosts,
        pendingPosts,
        approvedPosts,
        totalLikes,
        totalComments: totalComments || 0,
        totalViews,
        activeUsers
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ds.colors.primary.main} />
      </View>
    )
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load stats</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Wall Dashboard</Text>

      <View style={styles.statsGrid}>
        {/* Total Posts */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: ds.colors.primary.lightest }]}>
            <MessageSquare size={24} color={ds.colors.primary.main} strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.totalPosts}</Text>
          <Text style={styles.statLabel}>Total Posts</Text>
        </View>

        {/* Pending Approvals */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
            <TrendingUp size={24} color="#FF8A65" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.pendingPosts}</Text>
          <Text style={styles.statLabel}>Pending Approval</Text>
        </View>

        {/* Approved Posts */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
            <MessageSquare size={24} color="#4CAF50" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.approvedPosts}</Text>
          <Text style={styles.statLabel}>Approved Posts</Text>
        </View>

        {/* Total Likes */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#FCE4EC' }]}>
            <Heart size={24} color="#FF8A65" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.totalLikes}</Text>
          <Text style={styles.statLabel}>Total Likes</Text>
        </View>

        {/* Total Comments */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
            <MessageSquare size={24} color="#9C27B0" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.totalComments}</Text>
          <Text style={styles.statLabel}>Total Comments</Text>
        </View>

        {/* Active Users */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
            <Users size={24} color="#2196F3" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>

        {/* Total Video Views */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#FFF9C4' }]}>
            <Eye size={24} color="#FBC02D" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.totalViews}</Text>
          <Text style={styles.statLabel}>Video Plays</Text>
        </View>

        {/* Engagement Rate */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
            <TrendingUp size={24} color="#009688" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>
            {stats.totalPosts > 0
              ? ((stats.totalLikes + stats.totalComments) / stats.totalPosts).toFixed(1)
              : '0'
            }
          </Text>
          <Text style={styles.statLabel}>Avg Engagement</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[6],
    ...ds.shadows.lg,
  },
  loadingContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[12],
    marginBottom: ds.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadows.lg,
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[6],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
  },
  statCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    width: 'calc(25% - 12px)',
    minWidth: 150,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  errorText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.error,
    textAlign: 'center',
  },
})

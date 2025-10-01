import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Image, ScrollView } from 'react-native'
import { Check, X, Eye } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

interface PendingPost {
  id: string
  author_name: string
  content: string
  badge: string | null
  media_url: string | null
  media_type: string | null
  created_at: string
  user_id: string
}

export default function CommunityApprovalsPanel() {
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
    loadPendingPosts()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id || null)
  }

  async function loadPendingPosts() {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingPosts(data || [])
    } catch (error) {
      console.error('Error loading pending posts:', error)
      Alert.alert('Error', 'Failed to load pending posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(post: PendingPost) {
    if (!userId) return

    setProcessingId(post.id)
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: userId,
        })
        .eq('id', post.id)

      if (error) throw error
      loadPendingPosts()
    } catch (error) {
      console.error('Error approving post:', error)
      Alert.alert('Error', 'Failed to approve post')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(post: PendingPost) {
    Alert.alert(
      'Reject Post',
      'Are you sure you want to reject this post? It will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(post.id)
            try {
              const { error } = await supabase
                .from('community_posts')
                .delete()
                .eq('id', post.id)

              if (error) throw error
              loadPendingPosts()
            } catch (error) {
              console.error('Error rejecting post:', error)
              Alert.alert('Error', 'Failed to reject post')
            } finally {
              setProcessingId(null)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ds.colors.primary.main} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Post Approvals</Text>
      <Text style={styles.subtitle}>
        Review and approve community posts before they appear on the wall
      </Text>

      {pendingPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Check size={48} color={ds.colors.primary.main} strokeWidth={2} />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>No pending posts to review</Text>
        </View>
      ) : (
        <View style={styles.postsList}>
          {pendingPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View>
                  <Text style={styles.postAuthor}>{post.author_name}</Text>
                  <Text style={styles.postDate}>
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {post.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{post.badge}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.media_url && (
                <View style={styles.mediaContainer}>
                  <Image
                    source={{ uri: post.media_url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  {post.media_type === 'video' && (
                    <View style={styles.videoIndicator}>
                      <Text style={styles.videoIndicatorText}>VIDEO</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(post)}
                  disabled={processingId === post.id}
                >
                  {processingId === post.id ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Check size={18} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(post)}
                  disabled={processingId === post.id}
                >
                  <X size={18} color="#EF4444" strokeWidth={2} />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    ...ds.shadows.lg,
  },
  loadingContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyState: {
    alignItems: 'center',
    padding: ds.spacing[12],
  },
  emptyTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginTop: ds.spacing[4],
    marginBottom: ds.spacing[2],
  },
  emptyText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  postsList: {
    gap: ds.spacing[4],
  },
  postCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[5],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[3],
  },
  postAuthor: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  postDate: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  badge: {
    backgroundColor: ds.colors.primary.lightest,
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  badgeText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  postContent: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.base.lineHeight * 1.6,
    marginBottom: ds.spacing[4],
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: ds.borderRadius.lg,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: ds.spacing[3],
    left: ds.spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.md,
  },
  videoIndicatorText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
    fontWeight: ds.typography.fontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: ds.spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  approveButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  rejectButton: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#EF4444',
    fontFamily: ds.typography.fontFamily.base,
  },
})

import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert, Modal, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Heart, MessageCircle, Sparkles, X, AlertCircle } from 'lucide-react-native'
import InAppNavigationHeader from '../components/InAppNavigationHeader'
import WaveCircle from '../components/WaveCircle'
import ShareYourWhyModal from '../components/ShareYourWhyModal'
import PostDetailModal from '../components/PostDetailModal'
import ReplyModal from '../components/ReplyModal'
import LikeButton from '../components/LikeButton'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface Post {
  id: string
  author: string
  badge: string
  content: string
  likes: number
  replies: number
}

interface Article {
  title: string
  author: string
  views: string
}

export default function Community() {
  const router = useRouter()
  const [showShareModal, setShowShareModal] = useState(false)
  const [communityPosts, setCommunityPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [likingPost, setLikingPost] = useState<string | null>(null)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyToPost, setReplyToPost] = useState<{ id: string; author: string } | null>(null)
  const [foundersVideos, setFoundersVideos] = useState<any[]>([])
  const [coachWisdomItems, setCoachWisdomItems] = useState<any[]>([])

  useEffect(() => {
    loadPosts()
    checkAdminStatus()
    loadFoundersVideos()
    loadCoachWisdom()
  }, [showShareModal]) // Reload when modal closes

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.user_type === 'admin' || profile?.user_type === 'super_admin')
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  async function loadPosts() {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform database posts to match Post interface
      const transformedPosts: Post[] = (data || []).map((post) => ({
        id: post.id,
        author: post.author_name,
        badge: post.badge || 'Community',
        content: post.content,
        likes: post.likes || 0,
        replies: 0,
      }))

      setCommunityPosts(transformedPosts)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadFoundersVideos() {
    try {
      const { data, error } = await supabase
        .from('founders_voice_videos')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setFoundersVideos(data || [])
    } catch (error) {
      console.error('Error loading founders videos:', error)
    }
  }

  async function loadCoachWisdom() {
    try {
      const { data, error } = await supabase
        .from('coach_wisdom')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setCoachWisdomItems(data || [])
    } catch (error) {
      console.error('Error loading coach wisdom:', error)
    }
  }

  function confirmDelete(postId: string) {
    setPostToDelete(postId)
    setShowDeleteConfirm(true)
  }

  async function deletePost() {
    if (!postToDelete) return

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postToDelete)

      if (error) throw error

      // Close modal and reload posts
      setShowDeleteConfirm(false)
      setPostToDelete(null)
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      Alert.alert('Error', 'Failed to delete post')
      setShowDeleteConfirm(false)
      setPostToDelete(null)
    }
  }

  function cancelDelete() {
    setShowDeleteConfirm(false)
    setPostToDelete(null)
  }

  function openPostDetail(postId: string) {
    setSelectedPostId(postId)
    setShowPostDetail(true)
  }

  function closePostDetail() {
    setShowPostDetail(false)
    setSelectedPostId(null)
    loadPosts() // Reload to refresh comment counts
  }

  async function handleLike(postId: string, e?: any) {
    if (e) {
      e.stopPropagation()
    }

    // Prevent double-clicking
    if (likingPost === postId) return

    setLikingPost(postId)

    try {
      // Optimistically update the UI
      const updatedPosts = communityPosts.map(post =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
      setCommunityPosts(updatedPosts)
      setLikedPosts(new Set([...likedPosts, postId]))

      // Update the database
      const post = communityPosts.find(p => p.id === postId)
      if (!post) return

      const { error } = await supabase
        .from('community_posts')
        .update({ likes: post.likes + 1 })
        .eq('id', postId)

      if (error) throw error
    } catch (error) {
      console.error('Error liking post:', error)
      // Revert the optimistic update
      loadPosts()
      const newLikedPosts = new Set(likedPosts)
      newLikedPosts.delete(postId)
      setLikedPosts(newLikedPosts)
    } finally {
      setLikingPost(null)
    }
  }

  function handleReply(postId: string, postAuthor: string, e: any) {
    e.stopPropagation()
    setReplyToPost({ id: postId, author: postAuthor })
    setShowReplyModal(true)
  }

  // Fallback posts if database is empty
  const fallbackPosts: Post[] = [
    {
      id: '1',
      author: 'Sarah M.',
      badge: 'Hero',
      content: 'Reflection is creating a peaceful home where my children can flourish without feeling caught in the middle...',
      likes: 23,
      replies: 0
    },
    {
      id: '2',
      author: 'Michael R.',
      badge: 'Growth',
      content: 'Learning to pause before reacting has transformed how my kids see conflict resolution. My why is showing them a better way...',
      likes: 18,
      replies: 0
    },
    {
      id: '3',
      author: 'Jessica L.',
      badge: 'Champion',
      content: 'This 7-step process helped me find clarity in chaos. My why is breaking generational patterns of reactive communication...',
      likes: 31,
      replies: 0
    },
    {
      id: '4',
      author: 'David K.',
      badge: 'Hero',
      content: 'Co-parenting doesn\'t have to be a battle. My why is proving that separated parents can still be a united front for our children...',
      likes: 27,
      replies: 0
    },
    {
      id: '5',
      author: 'Amanda T.',
      badge: 'Reflection',
      content: 'Reflection has become my superpower. When I pause and align, I show up as the parent my children deserve...',
      likes: 19,
      replies: 0
    },
    {
      id: '6',
      author: 'Carlos H.',
      badge: 'Impact',
      content: 'My children deserve to see their parents working together with respect, even when we\'re apart. That\'s my why...',
      likes: 25,
      replies: 0
    }
  ]


  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />

      <ShareYourWhyModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/be_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>
            BeAligned<Text style={styles.trademark}>™</Text> Community
          </Text>
          <Text style={styles.subtitle}>A shared space for reflection, wisdom, and growth.</Text>
          <View style={styles.divider} />
        </View>

        {/* Community Wall */}
        <View style={styles.section}>
          <View style={styles.communityWallContainer}>
            <Text style={styles.sectionTitle}>Community Wall</Text>
            <Text style={styles.sectionSubtitle}>
              Authentic reflections from parents transforming conflict into connection
            </Text>

            {loading ? (
              <Text style={styles.loadingText}>Loading posts...</Text>
            ) : (
              <View style={styles.postsGrid}>
                {(communityPosts.length > 0 ? communityPosts : fallbackPosts).map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    {isAdmin && communityPosts.length > 0 && (
                      <Pressable
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          confirmDelete(post.id)
                        }}
                      >
                        <X size={16} color={ds.colors.text.tertiary} strokeWidth={2} />
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.postCardContent}
                      onPress={() => openPostDetail(post.id)}
                    >
                      <View style={styles.postHeader}>
                        <WaveCircle
                          size={24}
                          color={ds.colors.primary.main}
                          waveColor={`${ds.colors.primary.main}60`}
                          waveCount={3}
                          duration={2500}
                        >
                          <View style={styles.userAvatar} />
                        </WaveCircle>
                        <View style={styles.postAuthorInfo}>
                          <Text style={styles.postAuthor}>{post.author}</Text>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{post.badge}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.postContent}>{post.content}</Text>
                      <View style={styles.postFooter}>
                        <LikeButton
                          likes={post.likes}
                          isLiked={likedPosts.has(post.id)}
                          onPress={(e) => handleLike(post.id, e)}
                          isAnimating={likingPost === post.id}
                        />
                        <Pressable
                          style={styles.postAction}
                          onPress={(e) => handleReply(post.id, post.author, e)}
                        >
                          <MessageCircle size={14} color="#FF8A65" strokeWidth={2} />
                          <Text style={styles.actionText}>Reply</Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Share Your Why */}
        <View style={styles.section}>
          <View style={styles.shareContainer}>
            <View style={styles.shareIcon}>
              <Sparkles size={32} color={ds.colors.primary.main} strokeWidth={2} />
            </View>
            <Text style={styles.shareTitle}>Share Your Why</Text>
            <Text style={styles.shareSubtitle}>
              Your reflection strengthens our community. Share your story and inspire others.
            </Text>
            <Pressable style={styles.shareButton} onPress={() => setShowShareModal(true)}>
              <Text style={styles.shareButtonText}>Share Your Why</Text>
            </Pressable>
          </View>
        </View>

        {/* Content Columns */}
        <View style={styles.columnsContainer}>
          {/* Founder's Voice */}
          <View style={styles.columnWrapper}>
            <View style={styles.column}>
              <View style={styles.columnIconBox}>
                <Ionicons name="play-outline" size={32} color="#FF8A65" />
              </View>
              <Text style={styles.columnTitle}>Founder's Voice</Text>
              <Text style={styles.columnSubtitle}>Answers to your questions</Text>

              {foundersVideos.map((video) => (
                <Pressable key={video.id} style={styles.videoCard}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Text style={styles.videoQuestion}>{video.question}</Text>
                  <View style={styles.videoMeta}>
                    <Text style={styles.videoDuration}>{video.duration}</Text>
                    <View style={styles.videoPlays}>
                      <Ionicons name="play" size={12} color={ds.colors.primary.main} />
                      <Text style={styles.videoPlaysText}>{video.plays} plays</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Coach Wisdom */}
          <View style={styles.columnWrapper}>
            <View style={styles.column}>
              <View style={styles.columnIconBox}>
                <Ionicons name="bulb-outline" size={32} color="#FF8A65" />
              </View>
              <Text style={styles.columnTitle}>Coach Wisdom</Text>
              <Text style={styles.columnSubtitle}>Tips & grounding insights</Text>

              {coachWisdomItems.map((wisdom) => (
                <View key={wisdom.id} style={styles.wisdomCard}>
                  <Text style={styles.wisdomTitle}>{wisdom.title}</Text>
                  <Text style={styles.wisdomContent}>{wisdom.content}</Text>
                  <Text style={styles.wisdomAuthor}>{wisdom.author}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Ionicons name="information-circle" size={16} color={ds.colors.text.tertiary} />
          <Text style={styles.footerText}>
            BeAligned does not offer legal advice or therapy
          </Text>
        </View>
      </ScrollView>

      {/* Share Your Why Modal */}
      <ShareYourWhyModal visible={showShareModal} onClose={() => setShowShareModal(false)} />

      {/* Post Detail Modal */}
      <PostDetailModal visible={showPostDetail} onClose={closePostDetail} postId={selectedPostId} />

      {/* Reply Modal */}
      <ReplyModal
        visible={showReplyModal}
        onClose={() => {
          setShowReplyModal(false)
          setReplyToPost(null)
          loadPosts() // Refresh to show new reply
        }}
        postId={replyToPost?.id || null}
        postAuthor={replyToPost?.author || ''}
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={cancelDelete}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <AlertCircle size={24} color={ds.colors.warning} strokeWidth={2} />
              <Text style={styles.deleteModalTitle}>Delete Post</Text>
            </View>

            <Text style={styles.deleteModalMessage}>
              Are you sure you want to remove this reflection from the Community Wall? This action cannot be undone.
            </Text>

            <View style={styles.deleteModalButtons}>
              <Pressable style={styles.deleteModalCancelButton} onPress={cancelDelete}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.deleteModalConfirmButton} onPress={deletePost}>
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
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
    backgroundColor: '#f0f7ff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: ds.spacing[8],
    paddingHorizontal: ds.spacing[40],
    marginTop: ds.spacing[6],
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[4],
    ...ds.shadows.lg,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size * 1.44,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  trademark: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.normal,
    lineHeight: ds.typography.fontSize.sm.size,
    position: 'relative',
    top: -12,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[4],
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: ds.colors.primary.main,
    borderRadius: 2,
  },
  section: {
    paddingHorizontal: ds.spacing[40],
    marginBottom: ds.spacing[8],
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.xl.size * 1.32,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
  },
  communityWallContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[8],
    ...ds.shadows.lg,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[6],
  },
  postCard: {
    position: 'relative',
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    width: '48%',
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    ...ds.shadows.md,
  },
  postCardContent: {
    padding: ds.spacing[4],
  },
  deleteButton: {
    position: 'absolute',
    top: ds.spacing[2],
    right: ds.spacing[2],
    padding: ds.spacing[1],
    borderRadius: ds.borderRadius.md,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing[3],
  },
  userAvatar: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ds.colors.primary.main,
  },
  postAuthorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    marginLeft: ds.spacing[2],
  },
  postAuthor: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  badge: {
    backgroundColor: ds.colors.primary.lightest,
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  badgeText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
  },
  postContent: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.sm.lineHeight,
    marginBottom: ds.spacing[3],
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[4],
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
  },
  actionText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  shareContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[8],
    ...ds.shadows.lg,
    alignItems: 'center',
  },
  shareIcon: {
    marginBottom: ds.spacing[3],
  },
  shareTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  shareSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
  },
  shareButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
  },
  shareButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    fontFamily: ds.typography.fontFamily.base,
  },
  columnsContainer: {
    paddingHorizontal: ds.spacing[40],
    flexDirection: 'row',
    gap: ds.spacing[6],
    marginBottom: ds.spacing[8],
  },
  columnWrapper: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[8],
    ...ds.shadows.lg,
  },
  column: {
    alignItems: 'center',
  },
  columnIconBox: {
    width: 64,
    height: 64,
    borderRadius: ds.borderRadius.lg,
    borderWidth: 2,
    borderColor: ds.colors.primary.main,
    backgroundColor: ds.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[3],
  },
  columnTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[1],
    textAlign: 'center',
  },
  columnSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[5],
    textAlign: 'center',
  },
  videoCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[3],
    width: '100%',
  },
  videoTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  videoQuestion: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[3],
    fontStyle: 'italic',
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoDuration: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  videoPlays: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
  },
  videoPlaysText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
  },
  wisdomCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[5],
    marginBottom: ds.spacing[3],
    width: '100%',
  },
  wisdomTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[3],
  },
  wisdomContent: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.sm.lineHeight * 1.5,
    marginBottom: ds.spacing[3],
  },
  wisdomAuthor: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[6],
  },
  footerText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  loadingText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    padding: ds.spacing[8],
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[4],
  },
  deleteModalContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    padding: ds.spacing[6],
    width: '100%',
    maxWidth: 450,
    ...ds.shadows.xl,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
    marginBottom: ds.spacing[4],
  },
  deleteModalTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  deleteModalMessage: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.sm.lineHeight * 1.5,
    marginBottom: ds.spacing[6],
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteModalCancelButton: {
    flex: 1,
    marginRight: ds.spacing[3],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
    backgroundColor: ds.colors.error,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
})

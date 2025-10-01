import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { X, Heart, Send } from 'lucide-react-native'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'
import WaveCircle from './WaveCircle'

interface PostDetailModalProps {
  visible: boolean
  onClose: () => void
  postId: string | null
}

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

interface PostDetail {
  id: string
  author_name: string
  content: string
  media_url: string | null
  media_type: string | null
  likes: number
  created_at: string
}

export default function PostDetailModal({ visible, onClose, postId }: PostDetailModalProps) {
  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentAuthorName, setCommentAuthorName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (visible && postId) {
      loadPostDetails()
      loadUser()
    }
  }, [visible, postId])

  async function loadUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  async function loadPostDetails() {
    if (!postId) return

    setLoading(true)
    try {
      // Load post
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (postError) throw postError
      setPost(postData)

      // Load comments (we'll create this table)
      const { data: commentsData, error: commentsError } = await supabase
        .from('community_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (commentsError && commentsError.code !== 'PGRST116') {
        console.error('Error loading comments:', commentsError)
      } else {
        setComments(commentsData || [])
      }
    } catch (error) {
      console.error('Error loading post details:', error)
    } finally {
      setLoading(false)
    }
  }

  async function submitComment() {
    if (!userId || !postId) return
    if (!newComment.trim() || !commentAuthorName.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('community_post_comments').insert({
        post_id: postId,
        user_id: userId,
        author_name: commentAuthorName.trim(),
        content: newComment.trim(),
      })

      if (error) throw error

      setNewComment('')
      loadPostDetails()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Post Details</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color={ds.colors.text.primary} strokeWidth={2} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={ds.colors.primary.main} />
            ) : post ? (
              <>
                {/* Post Content */}
                <View style={styles.postSection}>
                  <View style={styles.postHeader}>
                    <WaveCircle
                      size={32}
                      color={ds.colors.primary.main}
                      waveColor={`${ds.colors.primary.main}60`}
                      waveCount={3}
                      duration={2500}
                    >
                      <View style={styles.userAvatar} />
                    </WaveCircle>
                    <View style={styles.postAuthorInfo}>
                      <Text style={styles.postAuthor}>{post.author_name}</Text>
                      <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                    </View>
                  </View>

                  <Text style={styles.postContent}>{post.content}</Text>

                  {/* Media */}
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

                  {/* Likes */}
                  <View style={styles.postStats}>
                    <View style={styles.statItem}>
                      <Heart size={18} color="#ef4444" strokeWidth={2} fill="#ef4444" />
                      <Text style={styles.statText}>{post.likes} likes</Text>
                    </View>
                  </View>
                </View>

                {/* Comments Section */}
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsTitle}>Reflections ({comments.length})</Text>

                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <WaveCircle
                          size={24}
                          color={ds.colors.primary.main}
                          waveColor={`${ds.colors.primary.main}60`}
                          waveCount={3}
                          duration={2500}
                        >
                          <View style={styles.commentAvatar} />
                        </WaveCircle>
                        <View>
                          <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                          <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                        </View>
                      </View>
                      <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                  ))}

                  {/* Add Comment Form */}
                  <View style={styles.addCommentSection}>
                    <Text style={styles.addCommentTitle}>Add Your Reflection</Text>
                    <TextInput
                      style={styles.nameInput}
                      placeholder="Your name or initials"
                      placeholderTextColor={ds.colors.text.tertiary}
                      value={commentAuthorName}
                      onChangeText={setCommentAuthorName}
                    />
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Share your thoughts..."
                      placeholderTextColor={ds.colors.text.tertiary}
                      multiline
                      numberOfLines={3}
                      value={newComment}
                      onChangeText={setNewComment}
                      textAlignVertical="top"
                    />
                    <Pressable
                      style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                      onPress={submitComment}
                      disabled={isSubmitting || !newComment.trim() || !commentAuthorName.trim()}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Send size={16} color="#FFFFFF" strokeWidth={2} />
                          <Text style={styles.submitButtonText}>Post Reflection</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.errorText}>Post not found</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[4],
  },
  modalContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    padding: ds.spacing[5],
    width: '100%',
    maxWidth: 700,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[4],
  },
  title: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    flex: 1,
  },
  closeButton: {
    padding: ds.spacing[1],
  },
  postSection: {
    marginBottom: ds.spacing[6],
    paddingBottom: ds.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing[3],
  },
  userAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ds.colors.primary.main,
  },
  postAuthorInfo: {
    marginLeft: ds.spacing[3],
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
    height: 300,
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
  postStats: {
    flexDirection: 'row',
    gap: ds.spacing[4],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  statText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  commentsSection: {
    marginBottom: ds.spacing[4],
  },
  commentsTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[4],
  },
  commentCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    marginBottom: ds.spacing[3],
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing[2],
    gap: ds.spacing[2],
  },
  commentAvatar: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ds.colors.primary.main,
  },
  commentAuthor: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  commentDate: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  commentContent: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.sm.lineHeight * 1.5,
  },
  addCommentSection: {
    marginTop: ds.spacing[4],
    paddingTop: ds.spacing[4],
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
  },
  addCommentTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[3],
  },
  nameInput: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    marginBottom: ds.spacing[3],
  },
  commentInput: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    minHeight: 80,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    marginBottom: ds.spacing[3],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    fontFamily: ds.typography.fontFamily.base,
  },
  errorText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.error.main,
    textAlign: 'center',
    padding: ds.spacing[8],
  },
})

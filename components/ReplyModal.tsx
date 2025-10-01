import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { X, Send } from 'lucide-react-native'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface ReplyModalProps {
  visible: boolean
  onClose: () => void
  postId: string | null
  postAuthor: string
}

export default function ReplyModal({ visible, onClose, postId, postAuthor }: ReplyModalProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (visible) {
      loadUser()
    }
  }, [visible])

  async function loadUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      if (user?.id) {
        // Get user's profile to construct name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        if (profile?.first_name && profile?.last_name) {
          // Format: "First Last Initial" (e.g., "Robert M.")
          const displayName = `${profile.first_name} ${profile.last_name.charAt(0)}.`
          setAuthorName(displayName)
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  async function handleSubmit() {
    if (!userId || !postId) return
    if (!replyContent.trim() || !authorName.trim()) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from('community_post_comments').insert({
        post_id: postId,
        user_id: userId,
        author_name: authorName.trim(),
        content: replyContent.trim(),
      })

      if (error) throw error

      // Clear form and close
      setReplyContent('')
      onClose()
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    setReplyContent('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Reply to {postAuthor}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={ds.colors.text.primary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Reply Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Reply</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Share your thoughts..."
              placeholderTextColor={ds.colors.text.tertiary}
              multiline
              numberOfLines={4}
              value={replyContent}
              onChangeText={setReplyContent}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting || !replyContent.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.submitButtonText}>Post Reply</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
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
    maxWidth: 500,
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
  section: {
    marginBottom: ds.spacing[4],
  },
  label: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[2],
  },
  input: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  textArea: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    minHeight: 100,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: ds.spacing[2],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
  },
  submitButton: {
    backgroundColor: ds.colors.primary.main,
    marginRight: ds.spacing[3],
  },
  submitButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    fontFamily: ds.typography.fontFamily.base,
  },
  cancelButton: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  cancelButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
})

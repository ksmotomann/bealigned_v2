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
  Alert,
  Image,
} from 'react-native'
import { X, Upload, Trash2 } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface ShareYourWhyModalProps {
  visible: boolean
  onClose: () => void
}

export default function ShareYourWhyModal({ visible, onClose }: ShareYourWhyModalProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [visible])

  async function loadUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload media.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        setMediaUri(asset.uri)
        // Determine type from URI or asset type
        const isVideo = asset.type === 'video' || asset.uri.match(/\.(mp4|mov|avi)$/i)
        setMediaType(isVideo ? 'video' : 'image')
      }
    } catch (error) {
      console.error('Error picking media:', error)
      Alert.alert('Error', 'Failed to select media')
    }
  }

  const removeMedia = () => {
    setMediaUri(null)
    setMediaType(null)
  }

  const uploadMedia = async () => {
    if (!mediaUri || !userId) return null

    try {
      const fileExt = mediaUri.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const response = await fetch(mediaUri)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()

      const { data, error } = await supabase.storage
        .from('community-media')
        .upload(fileName, arrayBuffer, {
          contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
          upsert: false,
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('community-media')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error uploading media:', error)
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to share')
      return
    }

    if (!content.trim()) {
      Alert.alert('Missing Information', 'Please share your reflection')
      return
    }

    if (!authorName.trim()) {
      Alert.alert('Missing Information', 'Please enter your name or initials')
      return
    }

    setIsSubmitting(true)

    try {
      // Check user type to determine if auto-approve
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single()

      const isAdmin = profile?.user_type === 'admin' || profile?.user_type === 'super_admin'
      const status = isAdmin ? 'approved' : 'pending'

      // Upload media if present
      let mediaUrl = null
      if (mediaUri) {
        mediaUrl = await uploadMedia()
      }

      const { error } = await supabase.from('community_posts').insert({
        user_id: userId,
        author_name: authorName.trim(),
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        status: status,
        ...(isAdmin && {
          approved_at: new Date().toISOString(),
          approved_by: userId,
        }),
      })

      if (error) throw error

      // Clear form and close modal
      setContent('')
      setAuthorName('')
      setMediaUri(null)
      setMediaType(null)
      onClose()

      // Show success message
      const successMessage = isAdmin
        ? 'Your reflection has been published to the Community Wall!'
        : 'Your reflection has been submitted and will appear once approved by our community team.'

      setTimeout(() => {
        Alert.alert('Thank You!', successMessage)
      }, 100)
    } catch (error) {
      console.error('Error submitting post:', error)
      Alert.alert('Error', 'Failed to submit your reflection. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setContent('')
    setAuthorName('')
    setMediaUri(null)
    setMediaType(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Share Your Why</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color={ds.colors.text.primary} strokeWidth={2} />
              </Pressable>
            </View>

            <Text style={styles.subtitle}>Your reflection helps strengthen our community.</Text>

            {/* Content Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Why / Reflection</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your why here..."
                placeholderTextColor={ds.colors.text.tertiary}
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
            </View>

            {/* Upload Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Upload Image or Video (Optional)</Text>
              {!mediaUri ? (
                <Pressable style={styles.uploadArea} onPress={pickMedia}>
                  <Upload size={24} color={ds.colors.text.tertiary} strokeWidth={2} />
                  <Text style={styles.uploadText}>
                    <Text style={styles.uploadLink}>Click to upload</Text>
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    Add a photo or short clip to bring your reflection to life.
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
                  {mediaType === 'video' && (
                    <View style={styles.videoIndicator}>
                      <Text style={styles.videoIndicatorText}>VIDEO</Text>
                    </View>
                  )}
                  <Pressable style={styles.removeMediaButton} onPress={removeMedia}>
                    <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.removeMediaText}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.label}>First Name or Initials</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Trina N."
                placeholderTextColor={ds.colors.text.tertiary}
                value={authorName}
                onChangeText={setAuthorName}
              />
            </View>


            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Reflection</Text>
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

            {/* Moderation Notice */}
            <Text style={styles.moderationNotice}>
              Moderation Notice: Reflections only appear once approved by our community team.
            </Text>
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
    maxWidth: 550,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[1],
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
  subtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[4],
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
  textArea: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    minHeight: 90,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
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
  uploadArea: {
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    borderStyle: 'dashed',
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[5],
    alignItems: 'center',
    backgroundColor: ds.colors.background.secondary,
  },
  uploadText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[2],
  },
  uploadLink: {
    color: ds.colors.primary.main,
  },
  uploadSubtext: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    marginTop: ds.spacing[1],
  },
  mediaPreview: {
    position: 'relative',
    borderRadius: ds.borderRadius.lg,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: ds.borderRadius.lg,
  },
  removeMediaButton: {
    position: 'absolute',
    top: ds.spacing[2],
    right: ds.spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.md,
  },
  removeMediaText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: ds.spacing[2],
    left: ds.spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  buttonContainer: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginBottom: ds.spacing[3],
    marginTop: ds.spacing[2],
  },
  button: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: ds.colors.primary.main,
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
  moderationNotice: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
  },
})

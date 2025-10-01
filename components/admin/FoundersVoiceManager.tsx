import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native'
import { Plus, Edit2, Trash2, X, Play } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

interface Video {
  id: string
  title: string
  question: string
  duration_seconds: number | null
  video_url: string | null
  thumbnail_url: string | null
  plays: number
  display_order: number
  is_published: boolean
}

// Helper function to format seconds to MM:SS
function formatDuration(seconds: number | null): string {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function FoundersVoiceManager() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    video_url: '',
    is_published: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    try {
      const { data, error } = await supabase
        .from('founders_voice_videos')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error loading videos:', error)
      Alert.alert('Error', 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingVideo(null)
    setFormData({
      title: '',
      question: '',
      video_url: '',
      is_published: true,
    })
    setShowModal(true)
  }

  function openEditModal(video: Video) {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      question: video.question,
      video_url: video.video_url || '',
      is_published: video.is_published,
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.question.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from('founders_voice_videos')
          .update({
            title: formData.title.trim(),
            question: formData.question.trim(),
            video_url: formData.video_url.trim() || null,
            is_published: formData.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingVideo.id)

        if (error) throw error
      } else {
        // Create new video
        const maxOrder = videos.length > 0 ? Math.max(...videos.map(v => v.display_order)) : 0
        const { error } = await supabase.from('founders_voice_videos').insert({
          title: formData.title.trim(),
          question: formData.question.trim(),
          video_url: formData.video_url.trim() || null,
          is_published: formData.is_published,
          display_order: maxOrder + 1,
        })

        if (error) throw error
      }

      setShowModal(false)
      loadVideos()
    } catch (error) {
      console.error('Error saving video:', error)
      Alert.alert('Error', 'Failed to save video')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(video: Video) {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('founders_voice_videos')
                .delete()
                .eq('id', video.id)

              if (error) throw error
              loadVideos()
            } catch (error) {
              console.error('Error deleting video:', error)
              Alert.alert('Error', 'Failed to delete video')
            }
          },
        },
      ]
    )
  }

  async function togglePublished(video: Video) {
    try {
      const { error } = await supabase
        .from('founders_voice_videos')
        .update({ is_published: !video.is_published })
        .eq('id', video.id)

      if (error) throw error
      loadVideos()
    } catch (error) {
      console.error('Error toggling published:', error)
      Alert.alert('Error', 'Failed to update video status')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Founder's Voice Videos</Text>
        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.addButtonText}>Add Video</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ds.colors.primary.main} style={styles.loader} />
      ) : (
        <View style={styles.videoList}>
          {videos.map((video) => (
            <View key={video.id} style={styles.videoCard}>
              <View style={styles.videoInfo}>
                <View style={styles.videoHeader}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: video.is_published ? '#4CAF50' : '#FF9800' },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {video.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.videoQuestion}>{video.question}</Text>
                <View style={styles.videoMeta}>
                  <Text style={styles.metaText}>Duration: {formatDuration(video.duration_seconds)}</Text>
                  <Text style={styles.metaText}>
                    <Play size={12} color={ds.colors.text.tertiary} /> {video.plays} plays
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, styles.publishButton]}
                  onPress={() => togglePublished(video)}
                >
                  <Text style={styles.actionButtonText}>
                    {video.is_published ? 'Unpublish' : 'Publish'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => openEditModal(video)}
                >
                  <Edit2 size={16} color={ds.colors.primary.main} strokeWidth={2} />
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleDelete(video)}
                >
                  <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          ))}

          {videos.length === 0 && (
            <Text style={styles.emptyText}>No videos yet. Click "Add Video" to create one.</Text>
          )}
        </View>
      )}

      {/* Edit/Add Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVideo ? 'Edit Video' : 'Add Video'}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <X size={24} color={ds.colors.text.primary} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="e.g., Why I Created BeAligned"
                  placeholderTextColor={ds.colors.text.tertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Question *</Text>
                <TextInput
                  style={styles.textArea}
                  value={formData.question}
                  onChangeText={(text) => setFormData({ ...formData, question: text })}
                  placeholder='"What inspired you to start this journey?"'
                  placeholderTextColor={ds.colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Video URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.video_url}
                  onChangeText={(text) => setFormData({ ...formData, video_url: text })}
                  placeholder="https://..."
                  placeholderTextColor={ds.colors.text.tertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Pressable
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, is_published: !formData.is_published })}
                >
                  <View style={[styles.checkboxBox, formData.is_published && styles.checkboxChecked]}>
                    {formData.is_published && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Publish immediately</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingVideo ? 'Update' : 'Create'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[6],
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
  },
  addButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  loader: {
    padding: ds.spacing[12],
  },
  videoList: {
    gap: ds.spacing[4],
  },
  videoCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  videoInfo: {
    flex: 1,
    marginRight: ds.spacing[4],
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[2],
  },
  videoTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
    backgroundColor: ds.colors.background.primary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  videoQuestion: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[2],
    fontStyle: 'italic',
  },
  videoMeta: {
    flexDirection: 'row',
    gap: ds.spacing[4],
  },
  metaText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  actions: {
    flexDirection: 'row',
    gap: ds.spacing[2],
    alignItems: 'center',
  },
  actionButton: {
    padding: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.background.primary,
  },
  publishButton: {
    paddingHorizontal: ds.spacing[3],
  },
  actionButtonText: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
  },
  emptyText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    padding: ds.spacing[8],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[4],
  },
  modalContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  modalTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  modalContent: {
    padding: ds.spacing[5],
  },
  formGroup: {
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
    minHeight: 80,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    textAlignVertical: 'top',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: ds.typography.fontWeight.bold,
  },
  checkboxLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ds.spacing[3],
    padding: ds.spacing[5],
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
  },
  button: {
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[5],
    borderRadius: ds.borderRadius.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: ds.colors.background.secondary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  cancelButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  saveButton: {
    backgroundColor: ds.colors.primary.main,
  },
  saveButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
})

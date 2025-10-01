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
import { Plus, Edit2, Trash2, X } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

interface Wisdom {
  id: string
  title: string
  content: string
  author: string
  display_order: number
  is_published: boolean
}

export default function CoachWisdomManager() {
  const [wisdoms, setWisdoms] = useState<Wisdom[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWisdom, setEditingWisdom] = useState<Wisdom | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    is_published: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadWisdoms()
  }, [])

  async function loadWisdoms() {
    try {
      const { data, error } = await supabase
        .from('coach_wisdom')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setWisdoms(data || [])
    } catch (error) {
      console.error('Error loading wisdom:', error)
      Alert.alert('Error', 'Failed to load coach wisdom')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingWisdom(null)
    setFormData({
      title: '',
      content: '',
      author: '',
      is_published: true,
    })
    setShowModal(true)
  }

  function openEditModal(wisdom: Wisdom) {
    setEditingWisdom(wisdom)
    setFormData({
      title: wisdom.title,
      content: wisdom.content,
      author: wisdom.author,
      is_published: wisdom.is_published,
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.content.trim() || !formData.author.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      if (editingWisdom) {
        // Update existing wisdom
        const { error } = await supabase
          .from('coach_wisdom')
          .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
            author: formData.author.trim(),
            is_published: formData.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingWisdom.id)

        if (error) throw error
      } else {
        // Create new wisdom
        const maxOrder = wisdoms.length > 0 ? Math.max(...wisdoms.map(w => w.display_order)) : 0
        const { error } = await supabase.from('coach_wisdom').insert({
          title: formData.title.trim(),
          content: formData.content.trim(),
          author: formData.author.trim(),
          is_published: formData.is_published,
          display_order: maxOrder + 1,
        })

        if (error) throw error
      }

      setShowModal(false)
      loadWisdoms()
    } catch (error) {
      console.error('Error saving wisdom:', error)
      Alert.alert('Error', 'Failed to save coach wisdom')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(wisdom: Wisdom) {
    Alert.alert(
      'Delete Wisdom',
      `Are you sure you want to delete "${wisdom.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('coach_wisdom')
                .delete()
                .eq('id', wisdom.id)

              if (error) throw error
              loadWisdoms()
            } catch (error) {
              console.error('Error deleting wisdom:', error)
              Alert.alert('Error', 'Failed to delete wisdom')
            }
          },
        },
      ]
    )
  }

  async function togglePublished(wisdom: Wisdom) {
    try {
      const { error } = await supabase
        .from('coach_wisdom')
        .update({ is_published: !wisdom.is_published })
        .eq('id', wisdom.id)

      if (error) throw error
      loadWisdoms()
    } catch (error) {
      console.error('Error toggling published:', error)
      Alert.alert('Error', 'Failed to update wisdom status')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coach Wisdom</Text>
        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.addButtonText}>Add Wisdom</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ds.colors.primary.main} style={styles.loader} />
      ) : (
        <View style={styles.wisdomList}>
          {wisdoms.map((wisdom) => (
            <View key={wisdom.id} style={styles.wisdomCard}>
              <View style={styles.wisdomInfo}>
                <View style={styles.wisdomHeader}>
                  <Text style={styles.wisdomTitle}>{wisdom.title}</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: wisdom.is_published ? '#4CAF50' : '#FF9800' },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {wisdom.is_published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.wisdomContent}>{wisdom.content}</Text>
                <Text style={styles.wisdomAuthor}>{wisdom.author}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, styles.publishButton]}
                  onPress={() => togglePublished(wisdom)}
                >
                  <Text style={styles.actionButtonText}>
                    {wisdom.is_published ? 'Unpublish' : 'Publish'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => openEditModal(wisdom)}
                >
                  <Edit2 size={16} color={ds.colors.primary.main} strokeWidth={2} />
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleDelete(wisdom)}
                >
                  <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          ))}

          {wisdoms.length === 0 && (
            <Text style={styles.emptyText}>No wisdom yet. Click "Add Wisdom" to create one.</Text>
          )}
        </View>
      )}

      {/* Edit/Add Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingWisdom ? 'Edit Wisdom' : 'Add Wisdom'}
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
                  placeholder="e.g., The Power of Pause"
                  placeholderTextColor={ds.colors.text.tertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Wisdom Content *</Text>
                <TextInput
                  style={styles.textArea}
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
                  placeholder="Share the wisdom..."
                  placeholderTextColor={ds.colors.text.tertiary}
                  multiline
                  numberOfLines={5}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Author *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.author}
                  onChangeText={(text) => setFormData({ ...formData, author: text })}
                  placeholder="e.g., — Dr. Maria Santos"
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
                    {editingWisdom ? 'Update' : 'Create'}
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
  wisdomList: {
    gap: ds.spacing[4],
  },
  wisdomCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  wisdomInfo: {
    flex: 1,
    marginRight: ds.spacing[4],
  },
  wisdomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[2],
  },
  wisdomTitle: {
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
  wisdomContent: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[2],
    lineHeight: ds.typography.fontSize.sm.lineHeight * 1.5,
  },
  wisdomAuthor: {
    fontSize: ds.typography.fontSize.sm.size,
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
    minHeight: 120,
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

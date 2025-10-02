import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler'
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type ViewMode = 'list' | 'create' | 'edit'

export default function FAQManager() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<FAQItem | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showDeleted, setShowDeleted] = useState(false)

  // Form state
  const [category, setCategory] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [isPublished, setIsPublished] = useState(true)

  // Categories
  const categories = [
    'Getting Started',
    'Privacy & Security',
    'Usage & Features',
    'Pricing & Plans',
    'Technical Support'
  ]

  useEffect(() => {
    loadFAQItems()
  }, [])

  useEffect(() => {
    loadFAQItems()
  }, [showDeleted])

  const loadFAQItems = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('faq_items')
        .select('*')

      if (!showDeleted) {
        query = query.is('deleted_at', null)
      }

      const { data, error } = await query
        .order('category')
        .order('display_order')

      if (error) throw error
      setFaqItems(data || [])
    } catch (error) {
      console.error('Error loading FAQ items:', error)
      Alert.alert('Error', 'Failed to load FAQ items')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCategory('')
    setQuestion('')
    setAnswer('')
    setDisplayOrder('0')
    setIsPublished(true)
    setSelectedItem(null)
  }

  const handleCreate = () => {
    resetForm()
    setViewMode('create')
  }

  const handleEdit = (item: FAQItem) => {
    setSelectedItem(item)
    setCategory(item.category)
    setQuestion(item.question)
    setAnswer(item.answer)
    setDisplayOrder(item.display_order.toString())
    setIsPublished(item.is_published)
    setViewMode('edit')
  }

  const handleSave = async () => {
    if (!category || !question || !answer) {
      Alert.alert('Validation Error', 'Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const newOrder = parseInt(displayOrder) || 0

      // Get all non-deleted items in the same category
      const { data: categoryItems } = await supabase
        .from('faq_items')
        .select('id, display_order')
        .eq('category', category)
        .is('deleted_at', null)
        .order('display_order')

      // If editing, exclude the current item
      const existingItems = viewMode === 'edit' && selectedItem
        ? categoryItems?.filter(item => item.id !== selectedItem.id) || []
        : categoryItems || []

      // Shift items at or above the new order
      for (const item of existingItems) {
        if (item.display_order >= newOrder) {
          await supabase
            .from('faq_items')
            .update({ display_order: item.display_order + 1 })
            .eq('id', item.id)
        }
      }

      const itemData = {
        category,
        question,
        answer,
        display_order: newOrder,
        is_published: isPublished
      }

      if (viewMode === 'create') {
        const { error } = await supabase
          .from('faq_items')
          .insert([itemData])

        if (error) throw error
        Alert.alert('Success', 'FAQ item created successfully')
      } else if (viewMode === 'edit' && selectedItem) {
        const { error } = await supabase
          .from('faq_items')
          .update(itemData)
          .eq('id', selectedItem.id)

        if (error) throw error
        Alert.alert('Success', 'FAQ item updated successfully')
      }

      await loadFAQItems()
      setViewMode('list')
      resetForm()
    } catch (error) {
      console.error('Error saving FAQ item:', error)
      Alert.alert('Error', 'Failed to save FAQ item')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item: FAQItem) => {
    console.log('Delete button clicked for item:', item.id)

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this FAQ item?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this FAQ item?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
            ]
          )
        })

    if (!confirmDelete) {
      console.log('Delete cancelled')
      return
    }

    try {
      console.log('Delete confirmed, starting soft delete...')
      setLoading(true)
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('faq_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Delete successful')
      if (Platform.OS === 'web') {
        alert('FAQ item deleted successfully')
      } else {
        Alert.alert('Success', 'FAQ item deleted successfully')
      }
      await loadFAQItems()
    } catch (error) {
      console.error('Error deleting FAQ item:', error)
      if (Platform.OS === 'web') {
        alert('Failed to delete FAQ item')
      } else {
        Alert.alert('Error', 'Failed to delete FAQ item')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (item: FAQItem) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('faq_items')
        .update({ deleted_at: null })
        .eq('id', item.id)

      if (error) throw error

      Alert.alert('Success', 'FAQ item restored successfully')
      await loadFAQItems()
    } catch (error) {
      console.error('Error restoring FAQ item:', error)
      Alert.alert('Error', 'Failed to restore FAQ item')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveUp = async (item: FAQItem) => {
    try {
      setLoading(true)
      // Get items in the same category
      const categoryItems = faqItems.filter(i => i.category === item.category)
      const currentIndex = categoryItems.findIndex(i => i.id === item.id)

      if (currentIndex <= 0) {
        setLoading(false)
        return // Already at the top
      }

      const previousItem = categoryItems[currentIndex - 1]

      // Swap display orders
      const { error: error1 } = await supabase
        .from('faq_items')
        .update({ display_order: previousItem.display_order })
        .eq('id', item.id)

      const { error: error2 } = await supabase
        .from('faq_items')
        .update({ display_order: item.display_order })
        .eq('id', previousItem.id)

      if (error1 || error2) throw error1 || error2

      await loadFAQItems()
    } catch (error) {
      console.error('Error moving FAQ item:', error)
      Alert.alert('Error', 'Failed to move FAQ item')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveDown = async (item: FAQItem) => {
    try {
      setLoading(true)
      // Get items in the same category
      const categoryItems = faqItems.filter(i => i.category === item.category)
      const currentIndex = categoryItems.findIndex(i => i.id === item.id)

      if (currentIndex >= categoryItems.length - 1) {
        setLoading(false)
        return // Already at the bottom
      }

      const nextItem = categoryItems[currentIndex + 1]

      // Swap display orders
      const { error: error1 } = await supabase
        .from('faq_items')
        .update({ display_order: nextItem.display_order })
        .eq('id', item.id)

      const { error: error2 } = await supabase
        .from('faq_items')
        .update({ display_order: item.display_order })
        .eq('id', nextItem.id)

      if (error1 || error2) throw error1 || error2

      await loadFAQItems()
    } catch (error) {
      console.error('Error moving FAQ item:', error)
      Alert.alert('Error', 'Failed to move FAQ item')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async ({ data }: { data: FAQItem[] }) => {
    try {
      // Update local state immediately for smooth UX
      setFaqItems(data)

      // Update display_order for all items in the database
      const updates = data.map((item, index) => ({
        id: item.id,
        display_order: index
      }))

      // Update all items
      for (const update of updates) {
        await supabase
          .from('faq_items')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      }

      // Reload to ensure consistency
      await loadFAQItems()
    } catch (error) {
      console.error('Error reordering FAQ items:', error)
      Alert.alert('Error', 'Failed to reorder FAQ items')
      // Reload original order on error
      await loadFAQItems()
    }
  }

  const handleTogglePublish = async (item: FAQItem) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({ is_published: !item.is_published })
        .eq('id', item.id)

      if (error) throw error

      Alert.alert('Success', `FAQ item ${item.is_published ? 'unpublished' : 'published'} successfully`)
      await loadFAQItems()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      Alert.alert('Error', 'Failed to update publish status')
    }
  }

  const filteredItems = filterCategory === 'all'
    ? faqItems
    : faqItems.filter(item => item.category === filterCategory)

  const renderFAQItem = ({ item, drag, isActive }: RenderItemParams<FAQItem>) => (
    <ScaleDecorator>
      <View style={[styles.itemCard, isActive && styles.itemCardActive]}>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <Text style={styles.itemCategory}>{item.category}</Text>
              {!item.is_published && (
                <View style={styles.draftBadge}>
                  <Text style={styles.draftBadgeText}>Draft</Text>
                </View>
              )}
              {item.deleted_at && (
                <View style={styles.deletedBadge}>
                  <Text style={styles.deletedBadgeText}>Deleted</Text>
                </View>
              )}
            </View>
            <Text style={styles.itemOrder}>Order: {item.display_order}</Text>
          </View>

          <Text style={styles.itemQuestion}>{item.question}</Text>
          <Text style={styles.itemAnswer} numberOfLines={3}>{item.answer}</Text>
        </Pressable>

        <View style={styles.itemActions}>
          {item.deleted_at ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.restoreButton]}
              onPress={() => handleRestore(item)}
            >
              <Ionicons name="refresh-outline" size={20} color={ds.colors.success} />
              <Text style={[styles.actionButtonText, styles.restoreButtonText]}>Restore</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.orderButtons}>
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => handleMoveUp(item)}
                  disabled={loading}
                >
                  <Ionicons name="arrow-up" size={18} color={ds.colors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => handleMoveDown(item)}
                  disabled={loading}
                >
                  <Ionicons name="arrow-down" size={18} color={ds.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, item.is_published ? styles.unpublishButton : styles.publishButton]}
                onPress={() => handleTogglePublish(item)}
              >
                <Ionicons
                  name={item.is_published ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={item.is_published ? ds.colors.text.secondary : ds.colors.success}
                />
                <Text style={[
                  styles.actionButtonText,
                  item.is_published ? styles.unpublishButtonText : styles.publishButtonText
                ]}>
                  {item.is_published ? 'Unpublish' : 'Publish'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(item)}
              >
                <Ionicons name="create-outline" size={20} color={ds.colors.primary.main} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  console.log('TouchableOpacity pressed')
                  handleDelete(item)
                }}
              >
                <Ionicons name="trash-outline" size={20} color={ds.colors.error} />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScaleDecorator>
  )

  const renderListView = () => (
    <View style={styles.listContainer}>
      {/* Header Actions */}
      <View style={styles.listHeader}>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <Pressable
              style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
              onPress={() => setFilterCategory('all')}
            >
              <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </Pressable>
            {categories.map(cat => (
              <Pressable
                key={cat}
                style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                onPress={() => setFilterCategory(cat)}
              >
                <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable
          style={styles.toggleDeletedContainer}
          onPress={() => setShowDeleted(!showDeleted)}
        >
          <View style={[styles.toggleCheckbox, showDeleted && styles.toggleCheckboxActive]}>
            {showDeleted && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.toggleDeletedLabel}>Show Deleted Items</Text>
        </Pressable>

        <Pressable style={styles.createButton} onPress={handleCreate}>
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create New FAQ</Text>
        </Pressable>
      </View>

      {/* FAQ Items List */}
      {loading ? (
        <View style={styles.itemsList}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.itemsList}>
          <Text style={styles.emptyText}>No FAQ items found</Text>
        </View>
      ) : (
        <GestureHandlerRootView style={styles.itemsList}>
          <DraggableFlatList
            data={filteredItems}
            renderItem={renderFAQItem}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
          />
        </GestureHandlerRootView>
      )}
    </View>
  )

  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {viewMode === 'create' ? 'Create New FAQ' : 'Edit FAQ'}
        </Text>
        <Pressable
          style={styles.closeButton}
          onPress={() => {
            setViewMode('list')
            resetForm()
          }}
        >
          <Ionicons name="close" size={24} color={ds.colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(cat => (
              <Pressable
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Question *</Text>
          <TextInput
            style={styles.textInput}
            value={question}
            onChangeText={setQuestion}
            placeholder="Enter the FAQ question"
            multiline
            placeholderTextColor={ds.colors.text.tertiary}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Answer *</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Enter the FAQ answer"
            multiline
            numberOfLines={6}
            placeholderTextColor={ds.colors.text.tertiary}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formField, styles.halfField]}>
            <Text style={styles.fieldLabel}>Display Order</Text>
            <TextInput
              style={styles.textInput}
              value={displayOrder}
              onChangeText={setDisplayOrder}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={ds.colors.text.tertiary}
            />
          </View>

          <View style={[styles.formField, styles.halfField]}>
            <Text style={styles.fieldLabel}>Status</Text>
            <Pressable
              style={styles.toggleContainer}
              onPress={() => setIsPublished(!isPublished)}
            >
              <View style={[styles.toggle, isPublished && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isPublished && styles.toggleThumbActive]} />
              </View>
              <Text style={styles.toggleLabel}>
                {isPublished ? 'Published' : 'Draft'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formActions}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => {
              setViewMode('list')
              resetForm()
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save FAQ'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FAQ Manager</Text>
        <Text style={styles.subtitle}>
          Manage frequently asked questions for the marketing website
        </Text>
      </View>

      {viewMode === 'list' ? renderListView() : renderForm()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  header: {
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  filterContainer: {
    marginBottom: ds.spacing[4],
  },
  filterLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: ds.colors.background.secondary,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.full,
    marginRight: ds.spacing[2],
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  filterChipActive: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  filterChipText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: ds.typography.fontWeight.medium,
  },
  toggleDeletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    marginBottom: ds.spacing[4],
  },
  toggleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: ds.borderRadius.sm,
    borderWidth: 2,
    borderColor: ds.colors.neutral[400],
    backgroundColor: ds.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheckboxActive: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  toggleDeletedLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  createButton: {
    backgroundColor: ds.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  itemsList: {
    flex: 1,
    padding: ds.spacing[6],
  },
  loadingText: {
    textAlign: 'center',
    color: ds.colors.text.secondary,
    fontSize: ds.typography.fontSize.base.size,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[8],
  },
  emptyText: {
    textAlign: 'center',
    color: ds.colors.text.secondary,
    fontSize: ds.typography.fontSize.base.size,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[8],
  },
  itemCard: {
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[4],
    ...ds.shadows.base,
  },
  itemCardActive: {
    ...ds.shadows.lg,
    opacity: 0.9,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[3],
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    flex: 1,
  },
  itemCategory: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
    textTransform: 'uppercase',
  },
  draftBadge: {
    backgroundColor: ds.colors.neutral[200],
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.sm,
  },
  draftBadgeText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  deletedBadge: {
    backgroundColor: ds.colors.error + '20',
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.sm,
  },
  deletedBadgeText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.error,
    fontFamily: ds.typography.fontFamily.base,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  itemOrder: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  itemQuestion: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  itemAnswer: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.base.lineHeight,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
  },
  itemActions: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    paddingTop: ds.spacing[3],
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
    alignItems: 'center',
  },
  orderButtons: {
    flexDirection: 'row',
    gap: ds.spacing[1],
    marginRight: ds.spacing[2],
  },
  orderButton: {
    padding: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
    backgroundColor: ds.colors.background.secondary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.background.secondary,
  },
  actionButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  deleteButton: {
    backgroundColor: ds.colors.error + '10',
  },
  deleteButtonText: {
    color: ds.colors.error,
  },
  publishButton: {
    backgroundColor: ds.colors.success + '10',
  },
  publishButtonText: {
    color: ds.colors.success,
  },
  unpublishButton: {
    backgroundColor: ds.colors.background.secondary,
  },
  unpublishButtonText: {
    color: ds.colors.text.secondary,
  },
  restoreButton: {
    backgroundColor: ds.colors.success + '10',
  },
  restoreButtonText: {
    color: ds.colors.success,
  },
  formContainer: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  formTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  closeButton: {
    padding: ds.spacing[2],
  },
  formScroll: {
    flex: 1,
    padding: ds.spacing[6],
  },
  formField: {
    marginBottom: ds.spacing[6],
  },
  formRow: {
    flexDirection: 'row',
    gap: ds.spacing[4],
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: ds.colors.background.secondary,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginRight: ds.spacing[2],
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  categoryChipActive: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  categoryChipText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: ds.typography.fontWeight.medium,
  },
  textInput: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  textAreaInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: ds.colors.neutral[300],
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: ds.colors.primary.main,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...ds.shadows.sm,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleLabel: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  formActions: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginTop: ds.spacing[4],
    marginBottom: ds.spacing[8],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  cancelButtonText: {
    color: ds.colors.text.secondary,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  saveButton: {
    flex: 1,
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    ...ds.shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
})

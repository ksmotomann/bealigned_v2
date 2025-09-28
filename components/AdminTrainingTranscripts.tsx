import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
  RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface TrainingFeedback {
  id: string
  message_id: string
  session_id: string | null
  phase_number: number
  feedback_type: string
  original_content: string
  suggested_content: string | null
  feedback_notes: string | null
  user_input: string | null
  admin_id: string
  created_at: string
  applied_to_model: boolean
  effectiveness_score: number | null
  weight: number
  priority: string
  feedback_source: string
  admin_email?: string
}

interface TrainingPattern {
  id: string
  phase_number: number
  trigger_pattern: string
  trigger_type: string
  response_template: string
  confidence_score: number
  usage_count: number
  success_rate: number | null
  is_active: boolean
  requires_review: boolean
  auto_apply: boolean
  created_at: string
  primary_source: string
}

export default function AdminTrainingTranscripts() {
  const [feedbackList, setFeedbackList] = useState<TrainingFeedback[]>([])
  const [patternsList, setPatternsList] = useState<TrainingPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'feedback' | 'patterns'>('feedback')
  const [filterPhase, setFilterPhase] = useState<number | null>(null)
  const [filterSource, setFilterSource] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<TrainingFeedback | TrainingPattern | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTrainingData()
  }, [activeTab, filterPhase, filterSource])

  const loadTrainingData = async () => {
    setLoading(true)
    
    try {
      if (activeTab === 'feedback') {
        let query = supabase
          .from('training_feedback')
          .select(`
            *,
            profiles!training_feedback_admin_id_fkey (
              email
            )
          `)
          .order('created_at', { ascending: false })

        if (filterPhase !== null) {
          query = query.eq('phase_number', filterPhase)
        }
        if (filterSource) {
          query = query.eq('feedback_source', filterSource)
        }

        const { data, error } = await query
        
        if (error) throw error
        
        const feedbackWithAdmin = data?.map(item => ({
          ...item,
          admin_email: item.profiles?.email || 'Unknown'
        })) || []
        
        setFeedbackList(feedbackWithAdmin)
      } else {
        let query = supabase
          .from('training_patterns')
          .select('*')
          .order('confidence_score', { ascending: false })

        if (filterPhase !== null) {
          query = query.eq('phase_number', filterPhase)
        }

        const { data, error } = await query
        
        if (error) throw error
        setPatternsList(data || [])
      }
    } catch (error) {
      console.error('Error loading training data:', error)
      Alert.alert('Error', 'Failed to load training data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleEdit = (item: TrainingFeedback | TrainingPattern) => {
    setEditingItem(item)
    if ('suggested_content' in item) {
      setEditedContent(item.suggested_content || item.original_content)
    } else {
      setEditedContent(item.response_template)
    }
    setShowEditModal(true)
  }

  const saveEdit = async () => {
    if (!editingItem) return

    try {
      if ('suggested_content' in editingItem) {
        // Editing feedback
        const { error } = await supabase
          .from('training_feedback')
          .update({
            suggested_content: editedContent,
            applied_to_model: false // Mark as needs reprocessing
          })
          .eq('id', editingItem.id)

        if (error) throw error
        
        Alert.alert('Success', 'Feedback updated successfully')
      } else {
        // Editing pattern
        const { error } = await supabase
          .from('training_patterns')
          .update({
            response_template: editedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)

        if (error) throw error
        
        Alert.alert('Success', 'Pattern updated successfully')
      }

      setShowEditModal(false)
      loadTrainingData()
    } catch (error) {
      console.error('Error saving edit:', error)
      Alert.alert('Error', 'Failed to save changes')
    }
  }

  const toggleApplied = async (item: TrainingFeedback) => {
    try {
      const { error } = await supabase
        .from('training_feedback')
        .update({ applied_to_model: !item.applied_to_model })
        .eq('id', item.id)

      if (error) throw error
      loadTrainingData()
    } catch (error) {
      console.error('Error toggling applied status:', error)
      Alert.alert('Error', 'Failed to update status')
    }
  }

  const togglePatternActive = async (pattern: TrainingPattern) => {
    try {
      const { error } = await supabase
        .from('training_patterns')
        .update({ is_active: !pattern.is_active })
        .eq('id', pattern.id)

      if (error) throw error
      loadTrainingData()
    } catch (error) {
      console.error('Error toggling pattern status:', error)
      Alert.alert('Error', 'Failed to update status')
    }
  }

  const deleteFeedback = async (id: string) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this training feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('training_feedback')
                .delete()
                .eq('id', id)

              if (error) throw error
              loadTrainingData()
            } catch (error) {
              console.error('Error deleting feedback:', error)
              Alert.alert('Error', 'Failed to delete feedback')
            }
          }
        }
      ]
    )
  }

  const applyAllPending = async () => {
    Alert.alert(
      'Apply All Pending',
      'This will process all unapplied feedback. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            try {
              // Call the learn_from_feedback function
              const { error } = await supabase.rpc('learn_from_feedback')
              
              if (error) throw error
              
              Alert.alert('Success', 'All pending feedback has been processed')
              loadTrainingData()
            } catch (error) {
              console.error('Error applying feedback:', error)
              Alert.alert('Error', 'Failed to apply feedback')
            }
          }
        }
      ]
    )
  }

  const renderFeedbackItem = ({ item }: { item: TrainingFeedback }) => {
    const filtered = searchQuery && (
      !item.original_content?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.suggested_content?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.user_input?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    if (filtered) return null

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.phaseLabel}>Phase {item.phase_number}</Text>
            <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(item.feedback_source) }]}>
              <Text style={styles.sourceBadgeText}>{item.feedback_source}</Text>
            </View>
            <Text style={styles.typeLabel}>{item.feedback_type}</Text>
          </View>
          <View style={styles.headerRight}>
            {item.applied_to_model ? (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            ) : (
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
            )}
          </View>
        </View>

        {item.user_input && (
          <View style={styles.contentSection}>
            <Text style={styles.contentLabel}>User Input:</Text>
            <Text style={styles.contentText}>{item.user_input}</Text>
          </View>
        )}

        <View style={styles.contentSection}>
          <Text style={styles.contentLabel}>Original:</Text>
          <Text style={styles.contentText}>{item.original_content}</Text>
        </View>

        {item.suggested_content && (
          <View style={styles.contentSection}>
            <Text style={styles.contentLabel}>Suggested:</Text>
            <Text style={[styles.contentText, styles.suggestedText]}>
              {item.suggested_content}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.metaText}>
            {format(new Date(item.created_at), 'MMM d, h:mm a')}
          </Text>
          <Text style={styles.metaText}>
            by {item.admin_email}
          </Text>
          {item.weight > 1 && (
            <Text style={styles.weightText}>Weight: {item.weight}x</Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleApplied(item)}
          >
            <Ionicons 
              name={item.applied_to_model ? "close-circle-outline" : "checkmark-circle-outline"} 
              size={18} 
              color={item.applied_to_model ? "#EF4444" : "#10B981"} 
            />
            <Text style={styles.actionButtonText}>
              {item.applied_to_model ? 'Unapply' : 'Apply'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteFeedback(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderPatternItem = ({ item }: { item: TrainingPattern }) => {
    const filtered = searchQuery && (
      !item.trigger_pattern?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.response_template?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    if (filtered) return null

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.phaseLabel}>Phase {item.phase_number}</Text>
            <View style={[styles.typeBadge, { backgroundColor: getTriggerColor(item.trigger_type) }]}>
              <Text style={styles.typeBadgeText}>{item.trigger_type}</Text>
            </View>
            {item.is_active ? (
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            ) : (
              <Ionicons name="pause-circle" size={18} color="#6B7280" />
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.confidenceText}>
              {(item.confidence_score * 100).toFixed(0)}% confidence
            </Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.contentLabel}>Trigger:</Text>
          <Text style={styles.triggerPattern}>{item.trigger_pattern}</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.contentLabel}>Response:</Text>
          <Text style={styles.contentText}>{item.response_template}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.metaText}>Used {item.usage_count} times</Text>
          {item.success_rate && (
            <Text style={styles.metaText}>
              {(item.success_rate * 100).toFixed(0)}% success
            </Text>
          )}
          <Text style={styles.metaText}>{item.primary_source}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => togglePatternActive(item)}
          >
            <Ionicons 
              name={item.is_active ? "pause-outline" : "play-outline"} 
              size={18} 
              color={item.is_active ? "#F59E0B" : "#10B981"} 
            />
            <Text style={styles.actionButtonText}>
              {item.is_active ? 'Disable' : 'Enable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'bealigned_gpt': return '#8B5CF6'
      case 'user_feedback': return '#3B82F6'
      case 'admin_review': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'exact': return '#10B981'
      case 'keyword': return '#3B82F6'
      case 'regex': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Training Transcripts</Text>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={applyAllPending}
        >
          <Ionicons name="flash" size={18} color="white" />
          <Text style={styles.applyButtonText}>Apply Pending</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feedback' && styles.activeTab]}
          onPress={() => setActiveTab('feedback')}
        >
          <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>
            Feedback ({feedbackList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'patterns' && styles.activeTab]}
          onPress={() => setActiveTab('patterns')}
        >
          <Text style={[styles.tabText, activeTab === 'patterns' && styles.activeTabText]}>
            Patterns ({patternsList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search content..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="filter" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filterPhase === null && styles.activeFilter]}
              onPress={() => setFilterPhase(null)}
            >
              <Text style={styles.filterText}>All Phases</Text>
            </TouchableOpacity>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(phase => (
              <TouchableOpacity
                key={phase}
                style={[styles.filterChip, filterPhase === phase && styles.activeFilter]}
                onPress={() => setFilterPhase(phase)}
              >
                <Text style={styles.filterText}>Phase {phase}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {activeTab === 'feedback' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !filterSource && styles.activeFilter]}
                onPress={() => setFilterSource(null)}
              >
                <Text style={styles.filterText}>All Sources</Text>
              </TouchableOpacity>
              {['bealigned_gpt', 'user_feedback', 'admin_review'].map(source => (
                <TouchableOpacity
                  key={source}
                  style={[styles.filterChip, filterSource === source && styles.activeFilter]}
                  onPress={() => setFilterSource(source)}
                >
                  <Text style={styles.filterText}>{source.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Content List */}
      <FlatList
        data={activeTab === 'feedback' ? feedbackList : patternsList}
        renderItem={activeTab === 'feedback' ? renderFeedbackItem : renderPatternItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadTrainingData()
            }}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Content</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={editedContent}
              onChangeText={setEditedContent}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 12,
    color: '#1F2937',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  typeLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  contentSection: {
    marginBottom: 12,
  },
  contentLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  contentText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  suggestedText: {
    color: '#059669',
    fontWeight: '500',
  },
  triggerPattern: {
    fontSize: 12,
    color: '#7C3AED',
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metaText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  weightText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    maxHeight: 300,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
})
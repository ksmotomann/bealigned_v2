import React, { useState, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { trainingService, FeedbackSource } from '../lib/trainingService'

interface AdminFeedbackButtonsProps {
  messageId: string
  sessionId: string
  phaseNumber: number
  messageContent: string
  userInput?: string
  isVisible?: boolean
  showInsertPrompt?: boolean
  showInsertUserPrompt?: boolean
  onInsertPrompt?: (prompt: string, isUserPrompt?: boolean) => void
}

export default function AdminFeedbackButtons({
  messageId,
  sessionId,
  phaseNumber,
  messageContent,
  userInput,
  isVisible = false,
  showInsertPrompt = false,
  showInsertUserPrompt = false,
  onInsertPrompt
}: AdminFeedbackButtonsProps) {
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'correction' | 'ideal' | 'user_prompt' | 'choose_insert'>('correction')
  const [suggestionText, setSuggestionText] = useState('')
  const [feedbackSource, setFeedbackSource] = useState<FeedbackSource>('user_feedback')
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([])
  const [suggestedPrompt, setSuggestedPrompt] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [thumbsUpCount, setThumbsUpCount] = useState(0)
  const [thumbsDownCount, setThumbsDownCount] = useState(0)
  const [hasVoted, setHasVoted] = useState<'up' | 'down' | null>(null)

  // Load voting history on mount
  useEffect(() => {
    if (isVisible && !showInsertPrompt) {
      loadVotingHistory()
    }
  }, [messageId, isVisible])

  const loadVotingHistory = async () => {
    try {
      const history = await trainingService.getFeedbackHistory(messageId, phaseNumber)
      
      // Store the full history for use in edit count and modal
      setFeedbackHistory(history)
      
      // Count thumbs up/down
      const upCount = history.filter(h => h.feedback_type === 'thumbs_up').length
      const downCount = history.filter(h => h.feedback_type === 'thumbs_down').length
      
      setThumbsUpCount(upCount)
      setThumbsDownCount(downCount)
      
      // Check if current admin has voted
      const { data: userData } = await trainingService.getCurrentUser()
      if (userData?.user) {
        const userVote = history.find(h => 
          h.admin_id === userData.user.id && 
          (h.feedback_type === 'thumbs_up' || h.feedback_type === 'thumbs_down')
        )
        if (userVote) {
          setHasVoted(userVote.feedback_type === 'thumbs_up' ? 'up' : 'down')
        }
      }
    } catch (error) {
      console.error('Failed to load voting history:', error)
    }
  }

  if (!isVisible) return null

  const handleThumbsUp = async () => {
    if (hasVoted === 'up') {
      Alert.alert('', 'You already voted 👍 for this message')
      return
    }
    
    await trainingService.queueFeedback({
      message_id: messageId,
      session_id: sessionId,
      phase_number: phaseNumber,
      feedback_type: 'thumbs_up',
      original_content: messageContent,
      user_input: userInput,
      priority: 'normal'
    })
    
    // Update local state
    setThumbsUpCount(prev => prev + 1)
    if (hasVoted === 'down') {
      setThumbsDownCount(prev => Math.max(0, prev - 1))
    }
    setHasVoted('up')
    
    Alert.alert('', '👍 Feedback recorded', [{ text: 'OK' }], { 
      cancelable: true 
    })
  }

  const handleThumbsDown = async () => {
    if (hasVoted === 'down') {
      Alert.alert('', 'You already voted 👎 for this message')
      return
    }
    
    await trainingService.queueFeedback({
      message_id: messageId,
      session_id: sessionId,
      phase_number: phaseNumber,
      feedback_type: 'thumbs_down',
      original_content: messageContent,
      user_input: userInput,
      priority: 'normal'
    })
    
    // Update local state
    setThumbsDownCount(prev => prev + 1)
    if (hasVoted === 'up') {
      setThumbsUpCount(prev => Math.max(0, prev - 1))
    }
    setHasVoted('down')
    
    Alert.alert('', '👎 Feedback recorded', [{ text: 'OK' }], { 
      cancelable: true 
    })
  }

  const loadFeedbackHistory = async () => {
    console.log('Loading feedback history for message:', messageId, 'phase:', phaseNumber)
    
    // Use existing history if already loaded
    const history = feedbackHistory.length > 0 ? feedbackHistory : 
      await trainingService.getFeedbackHistory(messageId, phaseNumber)
    
    console.log('Loaded history:', history)
    
    if (history.length > 0 && !feedbackHistory.length) {
      setFeedbackHistory(history)
    }
    
    // Filter for alternative responses and missing prompts
    const relevantFeedback = history.filter(h => 
      h.feedback_type === 'alternative_response' || 
      h.feedback_type === 'correction' ||
      h.feedback_type === 'missing_prompt'
    )
    
    console.log('Relevant feedback:', relevantFeedback)
    
    // Generate a suggested prompt based on history
    if (relevantFeedback.length > 0) {
      // Prioritize BeAligned GPT feedback, then admin review, then user feedback
      const bestSuggestion = 
        relevantFeedback.find(h => h.suggested_content && h.feedback_source === 'bealigned_gpt')?.suggested_content ||
        relevantFeedback.find(h => h.suggested_content && h.feedback_source === 'admin_review')?.suggested_content ||
        relevantFeedback.find(h => h.suggested_content && h.feedback_source === 'user_feedback')?.suggested_content ||
        ''
      
      console.log('Best suggestion:', bestSuggestion)
      setSuggestedPrompt(bestSuggestion)
    }
  }

  const handleAlternativeResponse = async () => {
    setModalType('correction')
    setShowModal(true)
    await loadFeedbackHistory()
  }

  const handleAddIdealPrompt = async () => {
    setModalType('ideal')
    setShowModal(true)
    await loadFeedbackHistory()
  }

  const handleAddUserPrompt = async () => {
    setModalType('user_prompt')
    setShowModal(true)
    await loadFeedbackHistory()
  }

  const handleChooseInsertType = () => {
    setModalType('choose_insert')
    setShowModal(true)
  }

  const submitFeedback = async () => {
    if (!suggestionText.trim()) {
      Alert.alert('Error', 'Please provide a suggestion')
      return
    }

    const feedbackType = modalType === 'correction' 
      ? 'alternative_response' 
      : modalType === 'user_prompt'
      ? 'missing_user_prompt'
      : 'missing_prompt'

    await trainingService.queueFeedback({
      message_id: messageId,
      session_id: sessionId,
      phase_number: phaseNumber,
      feedback_type: feedbackType,
      original_content: messageContent,
      suggested_content: suggestionText,
      user_input: userInput,
      priority: 'normal',
      feedback_source: feedbackSource
    })

    // Call the callback if this was an insert prompt
    if ((modalType === 'ideal' || modalType === 'user_prompt') && onInsertPrompt) {
      onInsertPrompt(suggestionText, modalType === 'user_prompt')
    }

    setShowModal(false)
    setSuggestionText('')
    
    Alert.alert('', '✓ Feedback saved', [{ text: 'OK' }], { 
      cancelable: true 
    })
  }

  return (
    <>
      {showInsertPrompt ? (
        // Show a single plus button that asks for type
        <TouchableOpacity 
          style={styles.insertPromptButton} 
          onPress={handleChooseInsertType}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add" size={18} color="#60A5FA" />
        </TouchableOpacity>
      ) : (
        // Only show thumbs/edit buttons for actual messages
        <View style={styles.container}>
          <TouchableOpacity 
            style={[styles.button, hasVoted === 'up' && styles.buttonVoted]} 
            onPress={handleThumbsUp}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={hasVoted === 'up' ? "thumbs-up" : "thumbs-up-outline"} 
              size={16} 
              color="#10B981" 
            />
            {thumbsUpCount > 0 && (
              <Text style={styles.voteCount}>{thumbsUpCount}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, hasVoted === 'down' && styles.buttonVoted]} 
            onPress={handleThumbsDown}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={hasVoted === 'down' ? "thumbs-down" : "thumbs-down-outline"} 
              size={16} 
              color="#EF4444" 
            />
            {thumbsDownCount > 0 && (
              <Text style={styles.voteCountNegative}>{thumbsDownCount}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAlternativeResponse}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="create-outline" 
              size={16} 
              color={feedbackHistory.filter(h => h.feedback_type === 'alternative_response' || h.feedback_type === 'correction').length > 0 ? "#3B82F6" : "#6B7280"} 
            />
            {feedbackHistory.filter(h => h.feedback_type === 'alternative_response' || h.feedback_type === 'correction').length > 0 && (
              <Text style={styles.editCount}>
                {feedbackHistory.filter(h => h.feedback_type === 'alternative_response' || h.feedback_type === 'correction').length}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowModal(false)
          setSuggestionText('')
          setSuggestedPrompt('')
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === 'choose_insert' ? (
              // Show type selection
              <>
                <Text style={styles.modalTitle}>What would you like to add?</Text>
                <View style={styles.chooseButtonContainer}>
                  <TouchableOpacity
                    style={styles.chooseButton}
                    onPress={() => {
                      setModalType('ideal')
                      loadFeedbackHistory()
                    }}
                  >
                    <Ionicons name="chatbubbles" size={24} color="#60A5FA" />
                    <Text style={styles.chooseButtonText}>AI Prompt</Text>
                    <Text style={styles.chooseButtonSubtext}>Add a prompt the AI should ask</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.chooseButton, styles.chooseButtonUser]}
                    onPress={() => {
                      setModalType('user_prompt')
                      loadFeedbackHistory()
                    }}
                  >
                    <Ionicons name="person" size={24} color="#E9967A" />
                    <Text style={styles.chooseButtonText}>User Response</Text>
                    <Text style={styles.chooseButtonSubtext}>Prompt for additional user input</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowModal(false)
                    setModalType('correction')
                  }}
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Show the actual form
              <>
                <Text style={styles.modalTitle}>
                  {modalType === 'correction' 
                    ? 'Suggest Alternative Response' 
                    : modalType === 'user_prompt'
                    ? 'Add User Response Prompt'
                    : 'Suggest Alternative Prompt'}
                </Text>
            
            {/* Show suggested prompt if available */}
            {suggestedPrompt && (
              <View style={styles.suggestionBox}>
                <Text style={styles.suggestionLabel}>AI Suggested (based on history):</Text>
                <Text style={styles.suggestionText}>{suggestedPrompt}</Text>
                <TouchableOpacity
                  style={styles.useSuggestionButton}
                  onPress={() => setSuggestionText(suggestedPrompt)}
                >
                  <Text style={styles.useSuggestionButtonText}>Use This Suggestion</Text>
                </TouchableOpacity>
              </View>
            )}
            
                {/* Show feedback history if available */}
                {feedbackHistory.filter(h => h.feedback_type === 'alternative_response' || h.feedback_type === 'correction' || h.feedback_type === 'missing_prompt').length > 0 && (
                  <View style={styles.historyBox}>
                    <Text style={styles.historyLabel}>
                      Previous Edits ({feedbackHistory.filter(h => h.suggested_content).length}):
                    </Text>
                    <ScrollView style={styles.historyScroll}>
                      {feedbackHistory
                        .filter(h => h.suggested_content && (h.feedback_type === 'alternative_response' || h.feedback_type === 'correction' || h.feedback_type === 'missing_prompt'))
                        .slice(0, 3)
                        .map((item, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.historyItem}
                            onPress={() => setSuggestionText(item.suggested_content)}
                          >
                            <Text style={styles.historySource}>
                              {(item.feedback_source || 'user_feedback').replace(/_/g, ' ').toUpperCase()}
                            </Text>
                            <Text style={styles.historyContent} numberOfLines={2}>
                              {item.suggested_content}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                )}
                
                <TextInput
                  style={styles.modalInput}
                  placeholder={
                    modalType === 'correction'
                      ? 'What should the AI have said instead?'
                      : modalType === 'user_prompt'
                      ? 'What additional user input is needed here?'
                      : 'What prompt should have been asked here?'
                  }
                  value={suggestionText}
                  onChangeText={setSuggestionText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                
                {/* Source selector */}
                <View style={styles.sourceContainer}>
              <Text style={styles.sourceLabel}>Feedback Source:</Text>
              <View style={styles.sourceButtons}>
                <TouchableOpacity
                  style={[
                    styles.sourceButton,
                    feedbackSource === 'user_feedback' && styles.sourceButtonActive
                  ]}
                  onPress={() => setFeedbackSource('user_feedback')}
                >
                  <Text style={[
                    styles.sourceButtonText,
                    feedbackSource === 'user_feedback' && styles.sourceButtonTextActive
                  ]}>
                    User Feedback
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sourceButton,
                    feedbackSource === 'bealigned_gpt' && styles.sourceButtonActive
                  ]}
                  onPress={() => setFeedbackSource('bealigned_gpt')}
                >
                  <Text style={[
                    styles.sourceButtonText,
                    feedbackSource === 'bealigned_gpt' && styles.sourceButtonTextActive
                  ]}>
                    BeAligned GPT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sourceButton,
                    feedbackSource === 'admin_review' && styles.sourceButtonActive
                  ]}
                  onPress={() => setFeedbackSource('admin_review')}
                >
                  <Text style={[
                    styles.sourceButtonText,
                    feedbackSource === 'admin_review' && styles.sourceButtonTextActive
                  ]}>
                    Admin Review
                  </Text>
                </TouchableOpacity>
              </View>
                </View>
                
                <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false)
                  setSuggestionText('')
                  setSuggestedPrompt('')
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={suggestionText.trim() ? submitFeedback : () => {
                  setShowModal(false)
                  setSuggestionText('')
                  setSuggestedPrompt('')
                }}
              >
                <Text style={styles.submitText}>
                  {suggestionText.trim() ? 'Submit' : 'Close'}
                </Text>
              </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    opacity: 0.6
  },
  button: {
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  buttonVoted: {
    opacity: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 4
  },
  voteCount: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600'
  },
  voteCountNegative: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600'
  },
  editCount: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600'
  },
  insertPromptButton: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    marginTop: 2,
    marginBottom: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    opacity: 0.7
  },
  insertPromptText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16
  },
  chooseButtonContainer: {
    gap: 12,
    marginBottom: 16
  },
  chooseButton: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12
  },
  chooseButtonUser: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FED7C3'
  },
  chooseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8
  },
  chooseButtonSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center'
  },
  modalCloseButton: {
    padding: 12,
    alignItems: 'center'
  },
  modalCloseButtonText: {
    fontSize: 14,
    color: '#6B7280'
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12
  },
  notesInput: {
    marginBottom: 20
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#F3F4F6'
  },
  submitButton: {
    backgroundColor: '#3B82F6'
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '600'
  },
  submitText: {
    color: 'white',
    fontWeight: '600'
  },
  sourceContainer: {
    marginBottom: 16
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  sourceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  sourceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white'
  },
  sourceButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  sourceButtonText: {
    fontSize: 12,
    color: '#6B7280'
  },
  sourceButtonTextActive: {
    color: 'white'
  },
  suggestionBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4
  },
  suggestionText: {
    fontSize: 13,
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 18
  },
  useSuggestionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  useSuggestionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  historyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8
  },
  historyScroll: {
    maxHeight: 120
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  historySource: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2
  },
  historyContent: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16
  }
})
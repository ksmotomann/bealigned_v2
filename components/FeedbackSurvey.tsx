import React, { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, Alert, Modal, Pressable, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface FeedbackSurveyProps {
  visible: boolean
  onSubmit: () => void
  onSkip?: () => void
  reflectionId?: string | null
}

type ClarityLevel = 'yes' | 'somewhat' | 'no' | null

export default function FeedbackSurvey({ visible, onSubmit, onSkip, reflectionId }: FeedbackSurveyProps) {
  const [helpfulnessRating, setHelpfulnessRating] = useState<number | null>(null)
  const [clarityLevel, setClarityLevel] = useState<ClarityLevel>(null)
  const [feelingWord, setFeelingWord] = useState('')
  const [additionalFeedback, setAdditionalFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setHelpfulnessRating(null)
    setClarityLevel(null)
    setFeelingWord('')
    setAdditionalFeedback('')
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    if (onSkip) {
      onSkip()
    }
  }

  const handleSubmit = async () => {
    if (helpfulnessRating === null || clarityLevel === null) {
      Alert.alert('Incomplete Survey', 'Please rate the helpfulness and clarity before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsSubmitting(false)
        Alert.alert('Error', 'Please log in to submit feedback.')
        return
      }

      const { error } = await supabase
        .from('feedback_surveys')
        .insert({
          user_id: user.id,
          reflection_id: reflectionId,
          helpfulness_rating: helpfulnessRating,
          clarity_level: clarityLevel,
          feeling_word: feelingWord.trim() || null,
          additional_feedback: additionalFeedback.trim() || null,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error submitting feedback:', error)
        setIsSubmitting(false)
        Alert.alert('Error', 'Failed to submit feedback. Please try again.')
        return
      }

      // Reset form
      resetForm()

      // Close modal first
      onSubmit()

      // Then show success message
      setTimeout(() => {
        Alert.alert(
          'Thank You!',
          'Your feedback helps us make BeAligned™ clearer, stronger and more supportive for families like yours.',
          [{ text: 'Continue' }]
        )
      }, 100)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setIsSubmitting(false)
      Alert.alert('Error', 'Failed to submit feedback. Please try again.')
    }
  }

  const renderDropletRating = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.questionText}>How helpful was this session for you?</Text>
        <View style={styles.dropletsContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => setHelpfulnessRating(rating)}
              style={styles.dropletButton}
            >
              <Ionicons
                name="water"
                size={32}
                color={
                  helpfulnessRating && rating <= helpfulnessRating
                    ? ds.colors.primary.main
                    : ds.colors.neutral[300]
                }
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabel}>Not at all helpful</Text>
          <Text style={styles.ratingLabel}>Extremely helpful</Text>
        </View>
      </View>
    )
  }

  const renderClarityButtons = () => {
    return (
      <View style={styles.clarityContainer}>
        <Text style={styles.questionText}>Are you clearer on your next step?</Text>
        <View style={styles.clarityButtons}>
          {[
            { key: 'yes', label: 'Yes', icon: 'checkmark' },
            { key: 'somewhat', label: 'Somewhat', icon: 'remove' },
            { key: 'no', label: 'No', icon: 'close' }
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setClarityLevel(option.key as ClarityLevel)}
              style={[
                styles.clarityButton,
                clarityLevel === option.key && styles.clarityButtonSelected
              ]}
            >
              <Ionicons
                name={option.icon as any}
                size={16}
                color={clarityLevel === option.key ? ds.colors.primary.main : ds.colors.neutral[500]}
              />
              <Text style={[
                styles.clarityButtonText,
                clarityLevel === option.key && styles.clarityButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button - Outside ScrollView to remain stationary */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color={ds.colors.text.secondary} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Icon */}
            <View style={styles.headerIcon}>
              <Ionicons name="water" size={28} color={ds.colors.primary.main} />
            </View>

            {/* Title and Subtitle */}
            <Text style={styles.title}>Your Feedback Shapes BeAligned™</Text>
            <Text style={styles.subtitle}>
              Each feedback survey matters. By sharing after every reflection, you help us make BeAligned™ clearer,
              stronger and more supportive for families like yours.
            </Text>

            {/* Helpfulness Rating */}
            {renderDropletRating()}

            {/* Clarity Question */}
            {renderClarityButtons()}

            {/* Feeling Word Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.questionText}>One word that best describes how you feel now.</Text>
              <TextInput
                style={styles.textInput}
                value={feelingWord}
                onChangeText={setFeelingWord}
                placeholder="e.g., hopeful, calmer, focused..."
                placeholderTextColor={ds.colors.neutral[400]}
                maxLength={50}
              />
            </View>

            {/* Additional Feedback */}
            <View style={styles.inputContainer}>
              <Text style={styles.questionText}>Any ripples of feedback you'd like to add?</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={additionalFeedback}
                onChangeText={setAdditionalFeedback}
                placeholder="Your insights help us improve..."
                placeholderTextColor={ds.colors.neutral[400]}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Bottom padding to account for fixed buttons */}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* Fixed Bottom Buttons */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Ionicons name="water" size={20} color="#FFFFFF" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerIcon: {
    alignItems: 'center' as const,
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    fontSize: ds.typography.fontSize.xl.size,
    lineHeight: ds.typography.fontSize.xl.lineHeight,
    fontWeight: ds.typography.fontWeight.bold as any,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    lineHeight: 20,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium as any,
    color: ds.colors.text.primary,
    marginBottom: 12,
  },
  dropletsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  dropletButton: {
    padding: 8,
    marginHorizontal: 6,
  },
  ratingLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
  },
  ratingLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
  },
  clarityContainer: {
    marginBottom: 20,
  },
  clarityButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  clarityButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: ds.colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    gap: 6,
  },
  clarityButtonSelected: {
    backgroundColor: ds.colors.primary.lightest,
    borderColor: ds.colors.primary.main,
  },
  clarityButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.neutral[500],
    fontWeight: ds.typography.fontWeight.medium as any,
  },
  clarityButtonTextSelected: {
    color: ds.colors.primary.main,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    borderRadius: 8,
    padding: 10,
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    backgroundColor: ds.colors.background.primary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top' as const,
  },
  bottomButtons: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 20,
    backgroundColor: ds.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
  },
  submitButton: {
    flex: 1,
    backgroundColor: ds.colors.primary.main,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    borderRadius: ds.borderRadius.lg,
  },
  submitButtonDisabled: {
    backgroundColor: ds.colors.neutral[300],
    opacity: 0.6,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold as any,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
    paddingVertical: 12,
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cancelButtonText: {
    color: ds.colors.text.primary,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold as any,
  },
}
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface FeedbackSurveyProps {
  onSubmit: () => void
  onSkip?: () => void
  reflectionId?: string
}

type ClarityLevel = 'yes' | 'somewhat' | 'no' | null

export default function FeedbackSurvey({ onSubmit, onSkip, reflectionId }: FeedbackSurveyProps) {
  const [helpfulnessRating, setHelpfulnessRating] = useState<number | null>(null)
  const [clarityLevel, setClarityLevel] = useState<ClarityLevel>(null)
  const [feelingWord, setFeelingWord] = useState('')
  const [additionalFeedback, setAdditionalFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (helpfulnessRating === null || clarityLevel === null) {
      Alert.alert('Incomplete Survey', 'Please rate the helpfulness and clarity before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
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
        Alert.alert('Error', 'Failed to submit feedback. Please try again.')
        return
      }

      // Show success message
      Alert.alert(
        'Thank You!',
        'Your feedback helps us make BeAligned™ clearer, stronger and more supportive for families like yours.',
        [{ text: 'Continue', onPress: onSubmit }]
      )
    } catch (error) {
      console.error('Error submitting feedback:', error)
      Alert.alert('Error', 'Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
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
    <View style={styles.container}>
      {/* Header Icon */}
      <View style={styles.headerIcon}>
        <Ionicons name="water" size={24} color={ds.colors.primary.main} />
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

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.submitIcon} />
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback Survey'}
        </Text>
      </TouchableOpacity>

      {/* Skip Option */}
      {onSkip && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = {
  container: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerIcon: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    lineHeight: ds.typography.fontSize['2xl'].lineHeight,
    fontWeight: ds.typography.fontWeight.bold as any,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    lineHeight: ds.typography.fontSize.base.lineHeight,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  ratingContainer: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium as any,
    color: ds.colors.text.primary,
    marginBottom: 16,
  },
  dropletsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  dropletButton: {
    padding: 8,
    marginHorizontal: 4,
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
    marginBottom: 32,
  },
  clarityButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  clarityButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: ds.colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    gap: 8,
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
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    borderRadius: 8,
    padding: 12,
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    backgroundColor: ds.colors.background.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  submitButton: {
    backgroundColor: ds.colors.primary.main,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: ds.colors.neutral[300],
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold as any,
  },
  skipButton: {
    alignItems: 'center' as const,
    paddingVertical: 12,
    marginTop: 8,
  },
  skipButtonText: {
    color: ds.colors.text.secondary,
    fontSize: ds.typography.fontSize.sm.size,
    textDecorationLine: 'underline' as const,
  },
}
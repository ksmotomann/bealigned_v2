/**
 * Admin Real-Time Feedback Panel
 * Inspired by Jacob Gregory Mann (6/24/2011 - 10/30/2024) and his courage (Joshua 1:9)
 * - helping families be strong and courageous through difficult moments
 */

import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { processAdminFeedback } from '../lib/feedbackLearningService'

interface AdminFeedbackPanelProps {
  sessionId: string
  sessionContext: any
  messageContext?: {
    phase: number
    messageType: 'ai_response' | 'phase_header' | 'welcome' | 'closing'
    userInput?: string
    aiResponse?: string
  }
  isVisible: boolean
  onClose: () => void
}

export function AdminFeedbackPanel({ 
  sessionId, 
  sessionContext, 
  messageContext, 
  isVisible, 
  onClose 
}: AdminFeedbackPanelProps) {
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackType, setFeedbackType] = useState<'missing_closing_type' | 'wrong_closing' | 'content_improvement' | 'new_closing_needed'>('content_improvement')
  const [suggestedClosingType, setSuggestedClosingType] = useState('')
  const [suggestedContent, setSuggestedContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please provide feedback description')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('🎯 Submitting admin feedback:', {
        type: feedbackType,
        session: sessionId,
        phase: messageContext?.phase
      })

      const result = await supabase.functions.invoke('process-admin-feedback', {
        body: {
          sessionId,
          feedbackType,
          feedbackContent: feedbackText,
          suggestedClosingType: suggestedClosingType || undefined,
          suggestedContent: suggestedContent || undefined,
          sessionContext,
          messageContext,
          priorityLevel: 'high' // Admin feedback gets high priority
        }
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      Alert.alert(
        'Feedback Processed ✅', 
        `Feedback submitted and processed in real-time.\n\n${result.data.message}`,
        [
          {
            text: 'View Actions',
            onPress: () => {
              Alert.alert(
                'Actions Executed',
                `• ${result.data.immediateActions?.join('\n• ') || 'No immediate actions'}\n\nFuture suggestions: ${result.data.futureSuggestions?.suggestedTriggers?.join(', ') || 'None'}`
              )
            }
          },
          { text: 'Close', onPress: onClose }
        ]
      )

      // Clear form
      setFeedbackText('')
      setSuggestedClosingType('')
      setSuggestedContent('')
      
    } catch (error) {
      console.error('❌ Error submitting admin feedback:', error)
      Alert.alert('Error', 'Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) return null

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Admin Real-Time Feedback</Text>
          <Text style={styles.context}>
            Phase {messageContext?.phase} • {messageContext?.messageType}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Feedback Type:</Text>
          <View style={styles.typeButtons}>
            {[
              { key: 'content_improvement', label: 'Content Improvement' },
              { key: 'missing_closing_type', label: 'Missing Closing Type' },
              { key: 'new_closing_needed', label: 'New Closing Needed' },
              { key: 'wrong_closing', label: 'Wrong Closing Selected' }
            ].map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  feedbackType === type.key && styles.typeButtonSelected
                ]}
                onPress={() => setFeedbackType(type.key as any)}
              >
                <Text style={[
                  styles.typeButtonText,
                  feedbackType === type.key && styles.typeButtonTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Feedback Description:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={3}
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="e.g., 'I would have liked to have had a message to the spouse' or 'This response doesn't match the user's emotional state'"
            placeholderTextColor="#666"
          />
        </View>

        {(feedbackType === 'new_closing_needed' || feedbackType === 'missing_closing_type') && (
          <View style={styles.section}>
            <Text style={styles.label}>Suggested Closing Type Name:</Text>
            <TextInput
              style={styles.textInput}
              value={suggestedClosingType}
              onChangeText={setSuggestedClosingType}
              placeholder="e.g., 'message_to_coparent', 'child_conversation_script'"
              placeholderTextColor="#666"
            />
          </View>
        )}

        {suggestedClosingType && (
          <View style={styles.section}>
            <Text style={styles.label}>Suggested Content (Optional):</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={suggestedContent}
              onChangeText={setSuggestedContent}
              placeholder="Provide the actual content/template for this closing type..."
              placeholderTextColor="#666"
            />
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitFeedback}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Processing...' : 'Submit & Process Real-Time'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 This feedback will immediately update the AI system and be applied to future sessions with similar contexts.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 500,
    width: '90%',
    maxHeight: '90%',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  context: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  typeButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
  },
  footer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
})
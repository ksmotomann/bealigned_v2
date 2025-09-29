import React, { useState, useRef } from 'react'
import { Modal, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import TermsAndConditions from './TermsAndConditions'
import PrivacyPolicy from './PrivacyPolicy'
import ds from '../styles/design-system'

interface LegalAcknowledgmentModalProps {
  visible: boolean
  onComplete: () => void
  userId: string
}

type DocumentStep = 'terms' | 'privacy' | 'confirmation'

export default function LegalAcknowledgmentModal({ visible, onComplete, userId }: LegalAcknowledgmentModalProps) {
  const [currentStep, setCurrentStep] = useState<DocumentStep>('terms')
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false)
  const [privacyScrolledToBottom, setPrivacyScrolledToBottom] = useState(false)
  const [termsAcknowledged, setTermsAcknowledged] = useState(false)
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20

    if (currentStep === 'terms' && isScrolledToBottom) {
      setTermsScrolledToBottom(true)
    } else if (currentStep === 'privacy' && isScrolledToBottom) {
      setPrivacyScrolledToBottom(true)
    }
  }

  const handleTermsNext = () => {
    if (!termsScrolledToBottom) {
      Alert.alert('Please scroll to the bottom', 'You must read the complete Terms and Conditions before proceeding.')
      return
    }
    setCurrentStep('privacy')
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
  }

  const handlePrivacyNext = () => {
    if (!privacyScrolledToBottom) {
      Alert.alert('Please scroll to the bottom', 'You must read the complete Privacy Policy before proceeding.')
      return
    }
    setCurrentStep('confirmation')
  }

  const handleBack = () => {
    if (currentStep === 'privacy') {
      setCurrentStep('terms')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('privacy')
    }
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
  }

  const handleSubmitAcknowledgments = async () => {
    if (!termsAcknowledged || !privacyAcknowledged) {
      Alert.alert('Acknowledgment Required', 'You must acknowledge both the Terms and Conditions and Privacy Policy to continue.')
      return
    }

    setIsLoading(true)
    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('profiles')
        .update({
          terms_acknowledged_at: now,
          privacy_acknowledged_at: now,
          requires_legal_acknowledgment: false
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      onComplete()
    } catch (error) {
      console.error('Error updating legal acknowledgments:', error)
      Alert.alert('Error', 'Failed to save acknowledgments. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'terms': return 'Terms and Conditions'
      case 'privacy': return 'Privacy Policy'
      case 'confirmation': return 'Confirm Acknowledgments'
    }
  }

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 'terms': return 'Please read and scroll to the bottom'
      case 'privacy': return 'Please read and scroll to the bottom'
      case 'confirmation': return 'Please confirm your agreement'
    }
  }

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, currentStep === 'terms' && styles.activeStep]}>
        <Text style={[styles.stepText, currentStep === 'terms' && styles.activeStepText]}>1</Text>
      </View>
      <View style={styles.stepConnector} />
      <View style={[styles.step, currentStep === 'privacy' && styles.activeStep]}>
        <Text style={[styles.stepText, currentStep === 'privacy' && styles.activeStepText]}>2</Text>
      </View>
      <View style={styles.stepConnector} />
      <View style={[styles.step, currentStep === 'confirmation' && styles.activeStep]}>
        <Text style={[styles.stepText, currentStep === 'confirmation' && styles.activeStepText]}>3</Text>
      </View>
    </View>
  )

  const renderConfirmationStep = () => (
    <View style={styles.confirmationContainer}>
      <Text style={styles.confirmationTitle}>Legal Acknowledgments</Text>
      <Text style={styles.confirmationSubtitle}>
        Please confirm that you have read and agree to the following documents:
      </Text>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setTermsAcknowledged(!termsAcknowledged)}
      >
        <View style={[styles.checkbox, termsAcknowledged && styles.checkedCheckbox]}>
          {termsAcknowledged && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I have read and agree to the Terms and Conditions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setPrivacyAcknowledged(!privacyAcknowledged)}
      >
        <View style={[styles.checkbox, privacyAcknowledged && styles.checkedCheckbox]}>
          {privacyAcknowledged && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I have read and agree to the Privacy Policy
        </Text>
      </TouchableOpacity>

      <Text style={styles.disclaimerText}>
        By proceeding, you acknowledge that you have read, understood, and agree to be bound by these legal documents.
      </Text>
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{getStepTitle()}</Text>
            <Text style={styles.headerSubtitle}>{getStepSubtitle()}</Text>
          </View>
          {renderStepIndicator()}
        </View>

        <View style={styles.content}>
          {currentStep === 'terms' && (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollContainer}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={true}
            >
              <TermsAndConditions />
            </ScrollView>
          )}

          {currentStep === 'privacy' && (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollContainer}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={true}
            >
              <PrivacyPolicy />
            </ScrollView>
          )}

          {currentStep === 'confirmation' && renderConfirmationStep()}
        </View>

        <View style={styles.footer}>
          {currentStep !== 'terms' && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />

          {currentStep === 'terms' && (
            <TouchableOpacity
              style={[styles.nextButton, !termsScrolledToBottom && styles.disabledButton]}
              onPress={handleTermsNext}
              disabled={!termsScrolledToBottom}
            >
              <Text style={[styles.nextButtonText, !termsScrolledToBottom && styles.disabledButtonText]}>
                Continue to Privacy Policy
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 'privacy' && (
            <TouchableOpacity
              style={[styles.nextButton, !privacyScrolledToBottom && styles.disabledButton]}
              onPress={handlePrivacyNext}
              disabled={!privacyScrolledToBottom}
            >
              <Text style={[styles.nextButtonText, !privacyScrolledToBottom && styles.disabledButtonText]}>
                Continue to Confirmation
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 'confirmation' && (
            <TouchableOpacity
              style={[styles.submitButton, (!termsAcknowledged || !privacyAcknowledged || isLoading) && styles.disabledButton]}
              onPress={handleSubmitAcknowledgments}
              disabled={!termsAcknowledged || !privacyAcknowledged || isLoading}
            >
              <Text style={[styles.submitButtonText, (!termsAcknowledged || !privacyAcknowledged || isLoading) && styles.disabledButtonText]}>
                {isLoading ? 'Saving...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: ds.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: ds.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  step: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.background.tertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  activeStep: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: ds.colors.text.secondary,
  },
  activeStepText: {
    color: ds.colors.text.inverse,
  },
  stepConnector: {
    width: 20,
    height: 1,
    backgroundColor: ds.colors.neutral[200],
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  confirmationContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center' as const,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 32,
    lineHeight: 24,
  },
  checkboxContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    borderRadius: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  checkedCheckbox: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  checkmark: {
    color: ds.colors.text.inverse,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    color: ds.colors.text.primary,
    lineHeight: 22,
  },
  disclaimerText: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: ds.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: ds.colors.primary.main,
    fontWeight: '600' as const,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: ds.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: ds.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  disabledButton: {
    backgroundColor: ds.colors.background.tertiary,
  },
  disabledButtonText: {
    color: ds.colors.text.secondary,
  },
}
import React, { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, SafeAreaView } from 'react-native'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface AppTourModalProps {
  visible: boolean
  onComplete: () => void
  userId: string
}

type TourStep = 'welcome' | 'process' | 'clarity' | 'ready'

export default function AppTourModal({ visible, onComplete, userId }: AppTourModalProps) {
  const [currentStep, setCurrentStep] = useState<TourStep>('welcome')
  const [isLoading, setIsLoading] = useState(false)

  const handleNext = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('process')
        break
      case 'process':
        setCurrentStep('clarity')
        break
      case 'clarity':
        setCurrentStep('ready')
        break
      case 'ready':
        handleComplete()
        break
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('profiles')
        .update({
          tour_completed_at: now
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating tour completion:', error)
      }

      onComplete()
    } catch (error) {
      console.error('Error completing tour:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.welcomeIcon}>
          <View style={styles.welcomeIconInner} />
        </View>
      </View>

      <Text style={styles.title}>Welcome to BeAligned™</Text>
      <Text style={styles.subtitle}>
        Your space to pause, reflect, and realign.
      </Text>

      <View style={styles.featuresContainer}>
        <View style={styles.featureRow}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🛡️</Text>
            </View>
            <Text style={styles.featureText}>Private</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>⏰</Text>
            </View>
            <Text style={styles.featureText}>10-15 min</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>✈️</Text>
            </View>
            <Text style={styles.featureText}>Guided</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>💝</Text>
            </View>
            <Text style={styles.featureText}>Child-centered</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Get Started →</Text>
      </TouchableOpacity>
    </View>
  )

  const renderProcessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.processFlowContainer}>
        <View style={styles.processStep}>
          <Text style={styles.processStepText}>1</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.processStep}>
          <Text style={styles.processStepText}>2</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.processStep}>
          <Text style={styles.processStepText}>7</Text>
        </View>
      </View>

      <Text style={styles.title}>One issue. One reflection.</Text>
      <Text style={styles.description}>
        Seven guided steps: Issue → Feelings → Why → Perspectives → Options → Choose → Message.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  )

  const renderClarityStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.clarityIcon}>
          <Text style={styles.clarityIconText}>👥💝</Text>
        </View>
      </View>

      <Text style={styles.title}>Clarity before communication.</Text>
      <Text style={styles.description}>
        Shift out of reaction and into alignment. For you, peace of mind. For your child, stability.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  )

  const renderReadyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.readyIcon}>
          <Text style={styles.readyIconText}>⭐</Text>
        </View>
      </View>

      <Text style={styles.title}>Ready for your first reflection?</Text>
      <Text style={styles.description}>
        It only takes a few minutes.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleNext}
        disabled={isLoading}
      >
        <Text style={[styles.primaryButtonText, isLoading && styles.disabledButtonText]}>
          {isLoading ? 'Starting...' : '▶ Start Reflection'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep()
      case 'process':
        return renderProcessStep()
      case 'clarity':
        return renderClarityStep()
      case 'ready':
        return renderReadyStep()
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {renderCurrentStep()}
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
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  stepContainer: {
    alignItems: 'center' as const,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 32,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    backgroundColor: ds.colors.primary.main,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  welcomeIconInner: {
    width: 40,
    height: 40,
    backgroundColor: ds.colors.primary.light,
    borderRadius: 20,
  },
  clarityIcon: {
    width: 80,
    height: 80,
    backgroundColor: ds.colors.primary.light,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clarityIconText: {
    fontSize: 24,
  },
  readyIcon: {
    width: 80,
    height: 80,
    backgroundColor: ds.colors.primary.main,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  readyIconText: {
    fontSize: 32,
    color: ds.colors.text.inverse,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 40,
    lineHeight: 26,
  },
  description: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 48,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    marginBottom: 48,
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 24,
  },
  feature: {
    alignItems: 'center' as const,
    flex: 1,
  },
  featureIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
  },
  processFlowContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 40,
  },
  processStep: {
    width: 50,
    height: 50,
    backgroundColor: ds.colors.primary.main,
    borderRadius: 25,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  processStepText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: ds.colors.text.inverse,
  },
  arrow: {
    fontSize: 20,
    color: ds.colors.text.secondary,
    marginHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: ds.colors.text.inverse,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  disabledButton: {
    backgroundColor: ds.colors.background.tertiary,
  },
  disabledButtonText: {
    color: ds.colors.text.secondary,
  },
}
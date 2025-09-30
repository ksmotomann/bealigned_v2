import React, { useState, useEffect, useRef } from 'react'
import { Modal, View, Text, TouchableOpacity, SafeAreaView, Image, Animated } from 'react-native'
import { Shield, Navigation, Clock, Heart, Users } from 'lucide-react-native'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'
import WaveCircle from './WaveCircle'

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

  const handleBack = () => {
    switch (currentStep) {
      case 'process':
        setCurrentStep('welcome')
        break
      case 'clarity':
        setCurrentStep('process')
        break
      case 'ready':
        setCurrentStep('clarity')
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
      <View style={styles.welcomeCard}>
        <View style={styles.iconContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/be_logo.png')}
              style={styles.beLogoImage}
              resizeMode="contain"
            />
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
                <Shield size={16} color={ds.colors.primary.main} />
              </View>
              <Text style={styles.featureText}>Private</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Clock size={16} color={ds.colors.primary.main} />
              </View>
              <Text style={styles.featureText}>10-15 min</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Navigation size={16} color={ds.colors.primary.main} />
              </View>
              <Text style={styles.featureText}>Guided</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Heart size={16} color={ds.colors.primary.main} />
              </View>
              <Text style={styles.featureText}>Child-centered</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Get Started →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderProcessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeCard}>
        <View style={styles.iconContainer}>
          <WaveCircle
            size={80}
            color={ds.colors.primary.main}
            waveColor={`${ds.colors.primary.main}30`}
            waveCount={3}
            duration={2500}
          >
            <Text style={{ fontSize: 24, color: ds.colors.text.inverse, fontWeight: '600' }}>
              ◉
            </Text>
          </WaveCircle>
        </View>

        <Text style={styles.title}>One issue. One reflection.</Text>
        <Text style={styles.description}>
          Seven guided steps: Issue → Feelings → Why → Perspectives → Options → Choose → Message.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderClarityStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeCard}>
        <View style={styles.iconContainer}>
          <WaveCircle
            size={80}
            color={`${ds.colors.primary.main}20`}
            waveColor={`${ds.colors.primary.main}20`}
            waveCount={3}
            duration={3000}
          >
            <View style={styles.clarityIconsRow}>
              <Users size={20} color={ds.colors.primary.main} />
              <Heart size={20} color={ds.colors.primary.main} />
            </View>
          </WaveCircle>
        </View>

        <Text style={styles.title}>Clarity before communication.</Text>
        <Text style={styles.description}>
          Shift out of reaction and into alignment. For you, peace of mind. For your child, stability.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderReadyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeCard}>
        <View style={styles.iconContainer}>
          <WaveCircle
            size={64}
            color={ds.colors.primary.main}
            waveColor={`${ds.colors.primary.main}30`}
            waveCount={3}
            duration={2500}
          >
            <Image
              source={require('../assets/reflection_balls.png')}
              style={styles.reflectionBallsImage}
              resizeMode="contain"
            />
          </WaveCircle>
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

  const renderNavigation = () => (
    <View style={styles.navigationContainer}>
      {/* Back Navigation */}
      {currentStep !== 'welcome' && (
        <TouchableOpacity style={styles.navButton} onPress={handleBack}>
          <Text style={styles.navText}>← Back</Text>
        </TouchableOpacity>
      )}

      {/* Next Navigation */}
      {currentStep !== 'ready' && (
        <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext}>
          <Text style={styles.navText}>Next →</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {renderCurrentStep()}
          {renderNavigation()}
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
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: 'center' as const,
    width: '100%',
    maxWidth: 360,
  },
  iconContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  beLogoImage: {
    width: 60,
    height: 60,
  },
  welcomeCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius['2xl'],
    padding: ds.spacing[6],
    width: '100%',
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
  clarityIconsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  readyIcon: {
    width: 64,
    height: 64,
    backgroundColor: ds.colors.primary.main,
    borderRadius: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  readyIconText: {
    fontSize: 28,
    color: ds.colors.text.inverse,
  },
  reflectionBallsImage: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 12,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  featuresContainer: {
    marginBottom: 32,
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: 16,
  },
  feature: {
    alignItems: 'center' as const,
    flex: 1,
  },
  featureIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  featureIconText: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 12,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
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
  navigationContainer: {
    position: 'absolute' as const,
    bottom: 32,
    left: 32,
    right: 32,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nextButton: {
    marginLeft: 'auto' as const,
  },
  navText: {
    color: ds.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
}
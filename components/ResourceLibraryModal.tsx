import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import StandardModal from './StandardModal'
import FeelingsNeedsBankModal from './FeelingsNeedsBankModal'
import GuardrailsModal from './GuardrailsModal'
import ds from '../styles/design-system'

interface ResourceLibraryModalProps {
  visible: boolean
  onClose: () => void
}

interface Resource {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  type: 'modal' | 'url'
  target?: string
}

const resources: Resource[] = [
  {
    id: 'feelings-needs-bank',
    title: 'Feelings & Needs Bank',
    description: 'Explore emotional vocabulary',
    icon: 'chatbox-outline',
    type: 'modal',
  },
  {
    id: 'guardrails',
    title: 'Guardrails',
    description: 'Healthy boundaries guide',
    icon: 'shield-outline',
    type: 'modal',
  },
]

export default function ResourceLibraryModal({ visible, onClose }: ResourceLibraryModalProps) {
  const [showFeelingsNeedsBank, setShowFeelingsNeedsBank] = useState(false)
  const [showGuardrails, setShowGuardrails] = useState(false)

  const handleResourcePress = async (resource: Resource) => {
    if (resource.type === 'modal') {
      if (resource.id === 'feelings-needs-bank') {
        setShowFeelingsNeedsBank(true)
      } else if (resource.id === 'guardrails') {
        setShowGuardrails(true)
      }
    } else if (resource.type === 'url' && resource.target) {
      try {
        const supported = await Linking.canOpenURL(resource.target)
        if (supported) {
          await Linking.openURL(resource.target)
        } else {
          Alert.alert('Error', `Cannot open URL: ${resource.target}`)
        }
      } catch (error) {
        console.error('Error opening resource:', error)
        Alert.alert('Error', 'Failed to open resource')
      }
    }
  }

  return (
    <>
      <StandardModal
        visible={visible}
        onClose={onClose}
        title="Resource Library"
        subtitle="Essential tools for your co-parenting journey"
        maxWidth={600}
      >
        <View style={styles.resourceList}>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.resourceCard}
              onPress={() => handleResourcePress(resource)}
              activeOpacity={0.7}
            >
              <View style={styles.resourceContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={resource.icon}
                    size={28}
                    color={ds.colors.primary.main}
                  />
                </View>
                <View style={styles.resourceText}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceDescription}>{resource.description}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={ds.colors.text.tertiary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </StandardModal>

      {/* Feelings & Needs Bank Modal */}
      <FeelingsNeedsBankModal
        visible={showFeelingsNeedsBank}
        onClose={() => setShowFeelingsNeedsBank(false)}
      />

      {/* Guardrails Modal */}
      <GuardrailsModal
        visible={showGuardrails}
        onClose={() => setShowGuardrails(false)}
      />
    </>
  )
}

const styles = {
  resourceList: {
    gap: 16,
  },
  resourceCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resourceContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ds.colors.primary.lightest,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  resourceText: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold as any,
    color: ds.colors.text.primary,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: 18,
  },
}

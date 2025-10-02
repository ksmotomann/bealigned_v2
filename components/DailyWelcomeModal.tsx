import React from 'react'
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import ds from '../styles/design-system'

interface DailyWelcomeModalProps {
  visible: boolean
  onClose: () => void
}

export default function DailyWelcomeModal({ visible, onClose }: DailyWelcomeModalProps) {
  const router = useRouter()

  const handleShareFeedback = () => {
    onClose()
    // Navigate to feedback or community page
    router.push('/community')
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={ds.colors.neutral[400]} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Thank you for being here.</Text>

            <Text style={styles.message}>
              BeAligned™ is a living system. We're practicing transparency — life is mastery, not perfection. Your reflections help us grow.
            </Text>

            <TouchableOpacity style={styles.feedbackButton} onPress={handleShareFeedback}>
              <Text style={styles.feedbackButtonText}>Share Feedback</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[4],
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius['2xl'],
    width: '100%',
    maxWidth: 500,
    padding: ds.spacing[8],
    position: 'relative',
    ...ds.shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: ds.spacing[4],
    right: ds.spacing[4],
    padding: ds.spacing[2],
    zIndex: 1,
  },
  content: {
    alignItems: 'stretch',
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[6],
    textAlign: 'left',
  },
  message: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: 32,
    marginBottom: ds.spacing[8],
    textAlign: 'left',
  },
  feedbackButton: {
    backgroundColor: '#F4A582',
    borderRadius: ds.borderRadius.full,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackButtonText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
})

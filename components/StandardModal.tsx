import React, { ReactNode } from 'react'
import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ds from '../styles/design-system'

interface StandardModalButton {
  text: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  loading?: boolean
  icon?: keyof typeof Ionicons.glyphMap
}

interface StandardModalProps {
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  headerIcon?: keyof typeof Ionicons.glyphMap
  children: ReactNode
  buttons?: StandardModalButton[]
  maxWidth?: number
  maxHeight?: string
}

export default function StandardModal({
  visible,
  onClose,
  title,
  subtitle,
  headerIcon,
  children,
  buttons = [],
  maxWidth = 600,
  maxHeight = '90%',
}: StandardModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth, maxHeight }]}>
          {/* Close Button - Stationary at top-right */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={ds.colors.text.secondary} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Icon (optional) */}
            {headerIcon && (
              <View style={styles.headerIcon}>
                <Ionicons name={headerIcon} size={28} color={ds.colors.primary.main} />
              </View>
            )}

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Subtitle (optional) */}
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}

            {/* Content */}
            <View style={styles.content}>
              {children}
            </View>

            {/* Bottom padding to account for fixed buttons */}
            {buttons.length > 0 && <View style={{ height: 80 }} />}
          </ScrollView>

          {/* Fixed Bottom Buttons */}
          {buttons.length > 0 && (
            <View style={styles.bottomButtons}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
                    button.disabled && styles.buttonDisabled,
                  ]}
                  onPress={button.onPress}
                  disabled={button.disabled || button.loading}
                >
                  {button.loading ? (
                    <ActivityIndicator color={button.variant === 'primary' ? '#FFFFFF' : ds.colors.text.primary} />
                  ) : (
                    <>
                      {button.icon && (
                        <Ionicons
                          name={button.icon}
                          size={20}
                          color={button.variant === 'primary' ? '#FFFFFF' : ds.colors.text.primary}
                          style={styles.buttonIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.buttonText,
                          button.variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'visible' as const,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
    overflow: 'visible' as const,
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
  content: {
    // Content styling handled by children
    overflow: 'visible' as const,
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
  button: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    borderRadius: ds.borderRadius.lg,
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold as any,
  },
  primaryButtonText: {
    color: ds.colors.text.inverse,
  },
  secondaryButtonText: {
    color: ds.colors.text.primary,
  },
}

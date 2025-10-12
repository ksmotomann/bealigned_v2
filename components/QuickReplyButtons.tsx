import { View, Text, Pressable, StyleSheet } from 'react-native'
import ds from '../styles/design-system'

interface QuickReplyButton {
  label: string
  value: string
  style?: 'primary' | 'secondary'
}

interface QuickReplyButtonsProps {
  buttons: QuickReplyButton[]
  onPress: (value: string) => void
  disabled?: boolean
}

export function QuickReplyButtons({ buttons, onPress, disabled = false }: QuickReplyButtonsProps) {
  return (
    <View style={styles.container}>
      {buttons.map((button, index) => (
        <Pressable
          key={index}
          style={({ pressed }) => [
            styles.button,
            button.style === 'primary' ? styles.primaryButton : styles.secondaryButton,
            pressed && styles.buttonPressed,
            disabled && styles.buttonDisabled
          ]}
          onPress={() => !disabled && onPress(button.value)}
          disabled={disabled}
        >
          <Text style={[
            styles.buttonText,
            button.style === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
          ]}>
            {button.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[2],
    marginTop: ds.spacing[3],
  },
  button: {
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.full,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: ds.colors.background.primary,
    borderColor: ds.colors.neutral[300],
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  primaryButtonText: {
    color: ds.colors.text.inverse,
  },
  secondaryButtonText: {
    color: ds.colors.text.primary,
  },
})

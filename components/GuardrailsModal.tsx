import React from 'react'
import { View, Text } from 'react-native'
import StandardModal from './StandardModal'
import ds from '../styles/design-system'

interface GuardrailsModalProps {
  visible: boolean
  onClose: () => void
}

export default function GuardrailsModal({ visible, onClose }: GuardrailsModalProps) {
  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Guardrails"
      subtitle="Essential boundaries and safety protocols to keep your communication child-centered and constructive."
      maxWidth={700}
      maxHeight="95%"
    >
      <View style={styles.container}>
        {/* Logo and tagline */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>
            <Text style={styles.logoBe}>Be</Text>
            <Text style={styles.logoAligned}>Aligned</Text>
            <Text style={styles.logoTM}>™</Text>
          </Text>
          <Text style={styles.tagline}>
            Every message should safeguard childhoods.{'\n'}
            These rules keep you aligned.
          </Text>
        </View>

        {/* Guardrails Content */}
        <View style={styles.guardrailsContainer}>
          {/* Tone Must Be */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tone Must Be:</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Calm</Text> — avoid hot language.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Respectful</Text> — no accusations, labels, or absolutes.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Alignment-Focused</Text> — point toward shared goals, not control.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Child-Centered</Text> — emphasize your child's needs, not grievances.</Text>
          </View>

          {/* Formula to Try */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Formula to Try:</Text>
            <Text style={styles.formula}>
              I feel [feeling word] when [situation] because [shared why/child-centered outcome].
            </Text>
            <Text style={styles.optional}>Optional: Do you have any ideas how we might...</Text>
          </View>

          {/* Good Example */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Good Example:</Text>
            <Text style={styles.example}>
              "I feel anxious when transitions run late, because I want Emma to feel secure moving between our two homes. What's one way we could reduce stress around exchange times?"
            </Text>
          </View>

          {/* Not Helpful Example */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not Helpful Example:</Text>
            <Text style={styles.example}>
              "You're always late and it's not okay."
            </Text>
          </View>

          {/* Bottom message */}
          <View style={styles.bottomMessageContainer}>
            <Text style={styles.bottomMessage}>
              Shame, blame, and judgment invite a fight. Calm, clear language invites collaboration
            </Text>
          </View>
        </View>

        {/* Final tagline */}
        <Text style={styles.finalTagline}>
          BeAligned™ keeps the focus where it belongs —{'\n'}
          safeguarding childhoods.
        </Text>
      </View>
    </StandardModal>
  )
}

const styles = {
  container: {
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
    marginTop: 8,
  },
  logoText: {
    fontSize: 32,
    marginBottom: 16,
  },
  logoBe: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.bold as any,
  },
  logoAligned: {
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.bold as any,
  },
  logoTM: {
    fontSize: 16,
    color: ds.colors.text.primary,
  },
  tagline: {
    fontSize: ds.typography.fontSize.sm.size,
    color: '#FF8C69',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    lineHeight: 20,
  },
  guardrailsContainer: {
    backgroundColor: ds.colors.neutral[100],
    borderRadius: ds.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.bold as any,
    color: ds.colors.text.primary,
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  bulletPoint: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    lineHeight: 22,
    marginBottom: 4,
    fontStyle: 'italic' as const,
  },
  bold: {
    fontWeight: ds.typography.fontWeight.bold as any,
  },
  formula: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    lineHeight: 22,
    fontStyle: 'italic' as const,
    marginBottom: 4,
  },
  optional: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  example: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  bottomMessageContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[300],
  },
  bottomMessage: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    fontWeight: ds.typography.fontWeight.bold as any,
    lineHeight: 20,
  },
  finalTagline: {
    fontSize: ds.typography.fontSize.sm.size,
    color: '#FF8C69',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    lineHeight: 20,
  },
}

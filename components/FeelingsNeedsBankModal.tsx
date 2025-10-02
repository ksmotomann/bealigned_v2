import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import StandardModal from './StandardModal'
import ds from '../styles/design-system'

interface FeelingsNeedsBankModalProps {
  visible: boolean
  onClose: () => void
}

export default function FeelingsNeedsBankModal({ visible, onClose }: FeelingsNeedsBankModalProps) {
  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Feelings & Needs Bank"
      subtitle="Quick reference guide to help you identify and name your feelings and underlying needs during reflection."
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
            Use this as a quick reference when you're reflecting.{'\n'}
            These aren't prescriptions — they're invitations to help you{'\n'}
            name what's true for you.
          </Text>
        </View>

        {/* Feelings & Needs Bank Content */}
        <View style={styles.bankContainer}>
          <Text style={styles.bankTitle}>Feelings/ Needs Bank</Text>

          {/* Surface (Hot) Feelings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Surface (Hot) Feelings</Text>
            <Text style={styles.sectionContent}>
              angry · frustrated · irritated · furious · stressed · overwhelmed
            </Text>
          </View>

          {/* Vulnerable Feelings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vulnerable Feelings</Text>
            <Text style={styles.sectionContent}>
              sad · hurt · disappointed · grief · loss · shame · guilt · fear
            </Text>
          </View>

          {/* Nuanced Feelings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nuanced Feelings</Text>
            <Text style={styles.sectionContent}>
              confused · discouraged · lonely · disconnected · uncomfortable · resentful · anxious
            </Text>
          </View>

          {/* Strength & Hopeful Feelings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strength & Hopeful Feelings</Text>
            <Text style={styles.sectionContent}>
              calm · grateful · joyful · hopeful · peaceful · confident
            </Text>
          </View>

          {/* Core Needs & Values - Security & Stability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Needs & Values (The Deeper Why) Security & Stability</Text>
            <Text style={styles.sectionContent}>
              safety · trust · reliability · consistency
            </Text>
          </View>

          {/* Connection & Belonging */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection & Belonging</Text>
            <Text style={styles.sectionContent}>
              love · care · inclusion · being seen · belonging
            </Text>
          </View>

          {/* Growth & Purpose */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growth & Purpose</Text>
            <Text style={styles.sectionContent}>
              learning · independence · contribution · purpose
            </Text>
          </View>

          {/* Respect & Dignity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Respect & Dignity</Text>
            <Text style={styles.sectionContent}>
              fairness · respect · authenticity · to matter
            </Text>
          </View>

          {/* Harmony & Peace */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Harmony & Peace</Text>
            <Text style={styles.sectionContent}>
              calm · harmony · understanding · acceptance
            </Text>
          </View>
        </View>

        {/* Bottom message */}
        <Text style={styles.bottomMessage}>
          These words are tools, not labels. Choose what resonates{'\n'}
          and leave the rest. Your Why is yours to discover.
        </Text>

        {/* Copyright */}
        <Text style={styles.copyright}>© The Layne Project 2025</Text>
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
  bankContainer: {
    backgroundColor: ds.colors.neutral[100],
    borderRadius: ds.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
  },
  bankTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold as any,
    color: ds.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 20,
    fontStyle: 'italic' as const,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.bold as any,
    color: ds.colors.text.primary,
    marginBottom: 6,
    fontStyle: 'italic' as const,
  },
  sectionContent: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  bottomMessage: {
    fontSize: ds.typography.fontSize.sm.size,
    color: '#FF8C69',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    lineHeight: 20,
    marginBottom: 16,
  },
  copyright: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
  },
}

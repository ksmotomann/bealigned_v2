import React, { useState, useEffect } from 'react'
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'
import debug from '../lib/debugLogger'

interface ProofOfReflectionModalProps {
  visible: boolean
  onClose: () => void
  userId: string
}

type TimePeriod = '7days' | '30days' | '90days' | 'all'

interface ReflectionStats {
  totalReflections: number
  totalTimeSpent: number
  averageSessionTime: number
  completionRate: number
}

export default function ProofOfReflectionModal({ visible, onClose, userId }: ProofOfReflectionModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7days')
  const [showDropdown, setShowDropdown] = useState(false)
  const [stats, setStats] = useState<ReflectionStats>({
    totalReflections: 0,
    totalTimeSpent: 0,
    averageSessionTime: 0,
    completionRate: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      loadStats()
    }
  }, [visible, selectedPeriod])

  const loadStats = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let startDate = new Date()

      switch (selectedPeriod) {
        case '7days':
          startDate.setDate(now.getDate() - 7)
          break
        case '30days':
          startDate.setDate(now.getDate() - 30)
          break
        case '90days':
          startDate.setDate(now.getDate() - 90)
          break
        case 'all':
          startDate = new Date(0) // Beginning of time
          break
      }

      const { data: reflections, error } = await supabase
        .from('reflection_sessions')
        .select('id, created_at, completed_at, status')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const completed = reflections?.filter(r => r.status === 'completed') || []
      const totalReflections = completed.length

      // Calculate total time spent (in minutes)
      const totalTimeSpent = completed.reduce((acc, r) => {
        if (r.completed_at && r.created_at) {
          const start = new Date(r.created_at).getTime()
          const end = new Date(r.completed_at).getTime()
          return acc + (end - start) / 1000 / 60 // Convert to minutes
        }
        return acc
      }, 0)

      const averageSessionTime = totalReflections > 0 ? totalTimeSpent / totalReflections : 0
      const completionRate = reflections && reflections.length > 0
        ? (completed.length / reflections.length) * 100
        : 0

      setStats({
        totalReflections,
        totalTimeSpent,
        averageSessionTime,
        completionRate,
      })
    } catch (error) {
      console.error('Error loading reflection stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCertificate = async () => {
    // TODO: Implement certificate generation
    debug.log('Generate certificate for period:', selectedPeriod)
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case '7days': return 'Last 7 Days'
      case '30days': return 'Last 30 Days'
      case '90days': return 'Last 90 Days'
      case 'all': return 'All Time'
    }
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Proof of Reflection</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={ds.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={styles.description}>
              Show accountability without sharing your private words. Generate a certificate that summarizes your engagement over time.
            </Text>

            {/* Certificate Preview */}
            <View style={styles.certificatePreview}>
              <Text style={styles.previewLabel}>Certificate Preview:</Text>
              <View style={styles.certificateImageContainer}>
                <View style={styles.certificateMockup}>
                  <Text style={styles.certificateMockupTitle}>Be</Text>
                  <Text style={styles.certificateMockupSubtitle}>Proof of Reflection Certificate</Text>

                  <View style={styles.certificateStats}>
                    <Text style={styles.certificateStat}>Participant Name</Text>
                    <Text style={styles.certificateStat}>Certificate Date</Text>
                    <Text style={styles.certificateStat}>Time Period: {getPeriodLabel()}</Text>
                    <Text style={styles.certificateStat}>Total Reflections Completed: {stats.totalReflections}</Text>
                    <Text style={styles.certificateStat}>Total Time Spent on Reflection: {formatTime(stats.totalTimeSpent)}</Text>
                    <Text style={styles.certificateStat}>Average Session Length: {formatTime(stats.averageSessionTime)}</Text>
                  </View>

                  <Text style={styles.certificateDisclaimer}>
                    Disclaimer: This certificate verifies participation in BeAligned™ reflection sessions. Content of reflections remains private. BeAligned™ does not provide therapy, legal advice, or substitute for professional help. Specific user completion data may vary based on user's reflection cadence.
                  </Text>

                  <Text style={styles.certificateFooter}>Authenticated by: BeAligned™ System Verification</Text>

                  <Text style={styles.certificateLogo}>BeAligned</Text>
                  <Text style={styles.certificateUrl}>© The LaunchPad 2025</Text>
                </View>
                <Text style={styles.certificateClickText}>Click to view full size</Text>
              </View>
            </View>

            {/* Time Period Selector */}
            <View style={styles.periodSelector}>
              <Text style={styles.periodLabel}>Select Time Period:</Text>
              <View style={styles.periodDropdown}>
                <TouchableOpacity
                  style={styles.periodButton}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={styles.periodButtonText}>{getPeriodLabel()}</Text>
                  <Ionicons
                    name={showDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={ds.colors.text.primary}
                  />
                </TouchableOpacity>

                {/* Dropdown options */}
                {showDropdown && (
                  <View style={styles.periodOptions}>
                    <TouchableOpacity
                      style={[styles.periodOption, selectedPeriod === '7days' && styles.periodOptionActive]}
                      onPress={() => {
                        setSelectedPeriod('7days')
                        setShowDropdown(false)
                      }}
                    >
                      <Text style={styles.periodOptionText}>Last 7 Days</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.periodOption, selectedPeriod === '30days' && styles.periodOptionActive]}
                      onPress={() => {
                        setSelectedPeriod('30days')
                        setShowDropdown(false)
                      }}
                    >
                      <Text style={styles.periodOptionText}>Last 30 Days</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.periodOption, selectedPeriod === '90days' && styles.periodOptionActive]}
                      onPress={() => {
                        setSelectedPeriod('90days')
                        setShowDropdown(false)
                      }}
                    >
                      <Text style={styles.periodOptionText}>Last 90 Days</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.periodOption, selectedPeriod === 'all' && styles.periodOptionActive]}
                      onPress={() => {
                        setSelectedPeriod('all')
                        setShowDropdown(false)
                      }}
                    >
                      <Text style={styles.periodOptionText}>All Time</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateCertificate}
              disabled={loading || stats.totalReflections === 0}
            >
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Certificate</Text>
            </TouchableOpacity>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              Certificate shows reflections completed, time spent, and engagement summary — never your private words.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing[4],
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.xl,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  modalTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
  },
  closeButton: {
    padding: ds.spacing[2],
  },
  modalContent: {
    padding: ds.spacing[6],
  },
  description: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    lineHeight: 24,
    marginBottom: ds.spacing[6],
  },
  certificatePreview: {
    marginBottom: ds.spacing[6],
  },
  previewLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[4],
  },
  certificateImageContainer: {
    alignItems: 'center',
  },
  certificateMockup: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[6],
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    width: '100%',
    alignItems: 'center',
    gap: ds.spacing[3],
  },
  certificateMockupTitle: {
    fontSize: 24,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
  },
  certificateMockupSubtitle: {
    fontSize: 16,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.secondary,
    textAlign: 'center',
  },
  certificateStats: {
    width: '100%',
    gap: ds.spacing[2],
    marginVertical: ds.spacing[4],
  },
  certificateStat: {
    fontSize: 11,
    color: ds.colors.text.secondary,
    textAlign: 'center',
  },
  certificateDisclaimer: {
    fontSize: 9,
    color: ds.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 12,
    marginTop: ds.spacing[2],
  },
  certificateFooter: {
    fontSize: 10,
    color: ds.colors.text.secondary,
    textAlign: 'center',
  },
  certificateLogo: {
    fontSize: 18,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    marginTop: ds.spacing[3],
  },
  certificateUrl: {
    fontSize: 9,
    color: ds.colors.text.tertiary,
  },
  certificateClickText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginTop: ds.spacing[3],
    fontStyle: 'italic',
  },
  periodSelector: {
    marginBottom: ds.spacing[6],
  },
  periodLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[3],
  },
  periodDropdown: {
    gap: ds.spacing[2],
  },
  periodButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  periodButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
  },
  periodOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    overflow: 'hidden',
  },
  periodOption: {
    padding: ds.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  periodOptionActive: {
    backgroundColor: ds.colors.primary.lightest,
  },
  periodOptionText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.full,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
    marginBottom: ds.spacing[4],
  },
  generateButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { trainingService } from '../lib/trainingService'
import AdminTrainingTranscripts from './AdminTrainingTranscripts'

export default function AdminSettings() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTuning, setIsTuning] = useState(false)
  const [showTranscripts, setShowTranscripts] = useState(false)
  const [metrics, setMetrics] = useState({
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    patternsLearned: 0,
    avgConfidence: 0
  })

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    const adminStatus = await trainingService.isAdmin()
    setIsAdmin(adminStatus)
    if (adminStatus) {
      await loadMetrics()
    }
    setIsLoading(false)
  }

  const loadMetrics = async () => {
    const data = await trainingService.getTrainingMetrics()
    setMetrics(data)
  }

  const handleAutoTune = async () => {
    Alert.alert(
      'Auto-Tune Chat AI',
      'This will process all pending feedback and update the AI response patterns. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Tune',
          onPress: async () => {
            setIsTuning(true)
            const result = await trainingService.autoTune()
            setIsTuning(false)
            
            if (result.success) {
              Alert.alert(
                'Auto-Tune Complete',
                `Processed ${result.feedbackProcessed} feedback items and learned ${result.patternsLearned} new patterns.`
              )
              await loadMetrics()
            } else {
              Alert.alert('Error', 'Auto-tune failed. Please try again.')
            }
          }
        }
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={24} color="#1F2937" />
        <Text style={styles.headerText}>Admin Training Settings</Text>
      </View>

      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Training Metrics</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Feedback:</Text>
          <Text style={styles.metricValue}>{metrics.totalFeedback}</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Positive:</Text>
          <Text style={[styles.metricValue, styles.positive]}>
            {metrics.positiveFeedback}
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Negative:</Text>
          <Text style={[styles.metricValue, styles.negative]}>
            {metrics.negativeFeedback}
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Patterns Learned:</Text>
          <Text style={styles.metricValue}>{metrics.patternsLearned}</Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg Confidence:</Text>
          <Text style={styles.metricValue}>
            {(metrics.avgConfidence * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.autoTuneButton, isTuning && styles.buttonDisabled]}
        onPress={handleAutoTune}
        disabled={isTuning}
      >
        {isTuning ? (
          <>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.autoTuneText}>Tuning...</Text>
          </>
        ) : (
          <>
            <Ionicons name="flash-outline" size={20} color="white" />
            <Text style={styles.autoTuneText}>Auto-Tune AI</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
        <Text style={styles.infoText}>
          Auto-Tune processes all feedback from admin sessions and updates the AI's response patterns. This runs in the background and won't affect active chat sessions.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8
  },
  metricsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280'
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937'
  },
  positive: {
    color: '#10B981'
  },
  negative: {
    color: '#EF4444'
  },
  autoTuneButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  autoTuneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  infoCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18
  },
  transcriptsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  transcriptsButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 12
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  closeButton: {
    padding: 8
  }
})
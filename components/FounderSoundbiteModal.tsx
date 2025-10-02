import React, { useState } from 'react'
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import StandardModal from './StandardModal'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface FounderSoundbiteModalProps {
  visible: boolean
  onClose: () => void
}

type PriorityLevel = 'low' | 'medium' | 'high'

interface PriorityOption {
  value: PriorityLevel
  label: string
}

const priorityOptions: PriorityOption[] = [
  { value: 'low', label: 'Low - General guidance welcome' },
  { value: 'medium', label: 'Medium - Would appreciate timely response' },
  { value: 'high', label: 'High - Urgent situation needing support' },
]

export default function FounderSoundbiteModal({ visible, onClose }: FounderSoundbiteModalProps) {
  const [situation, setSituation] = useState('')
  const [priority, setPriority] = useState<PriorityLevel>('low')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false)

  const resetForm = () => {
    setSituation('')
    setPriority('low')
    setIsSubmitting(false)
    setIsPriorityDropdownOpen(false)
  }

  const getSelectedPriorityLabel = () => {
    return priorityOptions.find(opt => opt.value === priority)?.label || ''
  }

  const handlePrioritySelect = (value: PriorityLevel) => {
    setPriority(value)
    setIsPriorityDropdownOpen(false)
  }

  const handleSubmit = async () => {
    if (!situation.trim()) {
      Alert.alert('Missing Information', 'Please describe the situation you need guidance on.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsSubmitting(false)
        Alert.alert('Error', 'Please log in to submit a request.')
        return
      }

      // Get user's name for the message thread
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'User'

      // Insert into founder_soundbite_requests table
      const { data: requestData, error: requestError } = await supabase
        .from('founder_soundbite_requests')
        .insert({
          user_id: user.id,
          situation: situation.trim(),
          priority_level: priority,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Create message thread for the request
      const priorityLabel = priorityOptions.find(opt => opt.value === priority)?.label || 'Low Priority'
      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          thread_type: 'support_request',
          subject: `Founder Soundbite Request - ${priorityLabel}`,
          reference_type: 'founder_soundbite_request',
          reference_id: requestData.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (threadError) throw threadError

      // Get all admins (this will include Robert if he's set as admin/super_admin)
      const { data: admins, error: adminsError } = await supabase
        .rpc('get_admin_ids')

      if (adminsError) {
        console.error('Error fetching admins:', adminsError)
        // Fallback: just continue without admin participants
      }

      const adminIds = admins || []

      // Build participants list, avoiding duplicates if user is also an admin
      const participants = [
        { thread_id: threadData.id, user_id: user.id, role: 'participant' },
        ...adminIds
          .filter((adminId: string) => adminId !== user.id) // Exclude current user if they're an admin
          .map((adminId: string) => ({
            thread_id: threadData.id,
            user_id: adminId,
            role: 'admin',
          })),
      ]

      const { error: participantsError } = await supabase
        .from('message_thread_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      // Create initial message in the thread
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: threadData.id,
          sender_id: user.id,
          message_type: 'text',
          content: situation.trim(),
        })

      if (messageError) throw messageError

      // Note: No separate notifications needed - message thread appears in Messages tab
      // with unread indicator, and bell icon shows unread message count

      // Reset form and close modal
      resetForm()
      onClose()

      // Show success message
      setTimeout(() => {
        Alert.alert(
          'Request Submitted!',
          'Your founder soundbite request has been submitted. You will receive a personalized audio message from Trina within 2-5 business days. Priority requests may receive faster responses.',
          [{ text: 'OK' }]
        )
      }, 100)
    } catch (error) {
      console.error('Error submitting founder soundbite request:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      setIsSubmitting(false)
      Alert.alert('Error', `Failed to submit request: ${(error as any)?.message || 'Please try again.'}`)
    }
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Request Founder Soundbite"
      maxWidth={600}
      buttons={[
        { text: 'Cancel', onPress: handleCancel, variant: 'secondary' },
        { text: 'Submit Request', onPress: handleSubmit, variant: 'primary', loading: isSubmitting, icon: 'mic' },
      ]}
    >
      <View style={styles.container}>
        {/* Header with icon */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mic" size={28} color={ds.colors.primary.main} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Personalized Guidance</Text>
            <Text style={styles.headerSubtitle}>Get a personal message from Trina</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Request a personalized audio message from our founder addressing your specific co-parenting situation.
        </Text>

        {/* Situation Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>What situation would you like guidance on?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Briefly describe the co-parenting challenge you're facing..."
            placeholderTextColor={ds.colors.text.tertiary}
            multiline
            numberOfLines={6}
            value={situation}
            onChangeText={setSituation}
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* Priority Level Dropdown */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Priority Level</Text>
          <View style={styles.dropdownContainer}>
            {/* Dropdown Trigger */}
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownTriggerText}>{getSelectedPriorityLabel()}</Text>
              <Ionicons
                name={isPriorityDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={ds.colors.text.secondary}
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {isPriorityDropdownOpen && (
              <View style={styles.dropdownOptions}>
                {priorityOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      index === priorityOptions.length - 1 && styles.dropdownOptionLast,
                    ]}
                    onPress={() => handlePrioritySelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxContainer}>
                      {priority === option.value && (
                        <Ionicons name="checkmark" size={18} color={ds.colors.text.primary} />
                      )}
                    </View>
                    <Text style={styles.priorityLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Response Time Notice */}
        <Text style={styles.notice}>
          Response time: 2-5 business days. Priority requests may receive faster responses.
        </Text>
      </View>
    </StandardModal>
  )
}

const styles = {
  container: {
    gap: 20,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    backgroundColor: ds.colors.primary.lightest,
    padding: 16,
    borderRadius: ds.borderRadius.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ds.colors.background.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold as any,
    color: ds.colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
  },
  description: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    lineHeight: 20,
  },
  inputSection: {
    gap: 8,
  },
  label: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold as any,
    color: ds.colors.text.primary,
  },
  textArea: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: 12,
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  dropdownContainer: {
    zIndex: 1000,
  },
  dropdownTrigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    marginTop: 4,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    backgroundColor: '#FFFFFF',
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  checkboxContainer: {
    width: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  priorityLabel: {
    flex: 1,
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
  },
  notice: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
}

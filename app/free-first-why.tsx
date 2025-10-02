import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import InAppNavigationHeader from '../components/InAppNavigationHeader'
import ds from '../styles/design-system'

type ContactMethod = 'email' | 'text' | 'phone'
type CoparentingSituation = 'divorced' | 'never_married' | 'remarried'
type CoparentingArrangement = 'two_households' | 'transitions_new' | 'long_term' | 'blended_family' | 'other'
type ChildrenAges = '0-5' | '6-12' | '13-18' | 'over_18'

// US Timezones
const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
]

// International Timezones (common ones)
const INTERNATIONAL_TIMEZONES = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' },
]

export default function FreeFirstWhyPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [timeZone, setTimeZone] = useState('')
  const [showTimeZoneDropdown, setShowTimeZoneDropdown] = useState(false)
  const [timezones, setTimezones] = useState<typeof US_TIMEZONES>([])
  const [coparentingSituation, setCoparentingSituation] = useState<CoparentingSituation | ''>('')
  const [coparentingArrangement, setCoparentingArrangement] = useState<CoparentingArrangement | ''>('')
  const [showArrangementDropdown, setShowArrangementDropdown] = useState(false)
  const [childrenAges, setChildrenAges] = useState<ChildrenAges[]>([])
  const [primaryFocus, setPrimaryFocus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Detect user's timezone and determine if they're in the US
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const isUS = userTimezone.startsWith('America/') || userTimezone.startsWith('Pacific/Honolulu')

    if (isUS) {
      setTimezones(US_TIMEZONES)
    } else {
      setTimezones([...US_TIMEZONES, ...INTERNATIONAL_TIMEZONES])
    }

    // Auto-select user's current timezone if it's in the list
    const matchingTimezone = [...US_TIMEZONES, ...INTERNATIONAL_TIMEZONES].find(tz => tz.value === userTimezone)
    if (matchingTimezone) {
      setTimeZone(matchingTimezone.value)
    }
  }, [])

  const getArrangementLabel = (arrangement: CoparentingArrangement | ''): string => {
    switch (arrangement) {
      case 'two_households': return 'Living in two households'
      case 'transitions_new': return 'Transitions are new / recent'
      case 'long_term': return 'Long-term arrangement'
      case 'blended_family': return 'Blended family'
      case 'other': return 'Other / prefer not to say'
      default: return 'Select arrangement'
    }
  }

  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '')

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text)
    setPhoneNumber(formatted)
  }

  const toggleChildrenAge = (age: ChildrenAges) => {
    if (childrenAges.includes(age)) {
      setChildrenAges(childrenAges.filter(a => a !== age))
    } else {
      setChildrenAges([...childrenAges, age])
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first name.')
      return
    }
    if (contactMethod === 'email' && !email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.')
      return
    }
    if ((contactMethod === 'text' || contactMethod === 'phone') && !phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number.')
      return
    }
    if (childrenAges.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one age range for your children.')
      return
    }
    if (!primaryFocus) {
      Alert.alert('Missing Information', 'Please select your primary focus area.')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'Please log in to request a coaching session.')
        setSubmitting(false)
        return
      }

      // Get user's profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'User'

      // Auto-detect timezone if not already set
      const detectedTimezone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

      // Insert coaching request
      const { data: requestData, error: requestError } = await supabase
        .from('coaching_session_requests')
        .insert({
          user_id: user.id,
          first_name: firstName.trim(),
          contact_method: contactMethod,
          contact_email: contactMethod === 'email' ? email.trim() : null,
          contact_phone: (contactMethod === 'text' || contactMethod === 'phone') ? phoneNumber.trim() : null,
          time_zone: detectedTimezone,
          coparenting_situation: null, // Optional field
          coparenting_arrangement: coparentingArrangement || null,
          children_ages: childrenAges,
          primary_focus: primaryFocus,
          status: 'pending',
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Create message thread for the request
      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          thread_type: 'support_request',
          subject: `Free First Win Session Request - ${contactMethod}`,
          reference_type: 'coaching_session_request',
          reference_id: requestData.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (threadError) throw threadError

      // Get all admins
      const { data: admins, error: adminsError } = await supabase
        .rpc('get_admin_ids')

      if (adminsError) {
        console.error('Error fetching admins:', adminsError)
      }

      const adminIds = admins || []

      // Build participants list
      const participants = [
        { thread_id: threadData.id, user_id: user.id, role: 'participant' },
        ...adminIds
          .filter((adminId: string) => adminId !== user.id)
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

      // Create initial message in the thread with all details
      const contactInfo = contactMethod === 'email' ? email.trim() : phoneNumber.trim()
      const detailsMessage = `New Free First Win Session Request

Name: ${firstName}
Contact Method: ${contactMethod}
Contact Info: ${contactInfo}
Time Zone: ${detectedTimezone}
Children's Ages: ${childrenAges.join(', ')}
Primary Focus: ${primaryFocus}`

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: threadData.id,
          sender_id: user.id,
          message_type: 'text',
          content: detailsMessage,
        })

      if (messageError) throw messageError

      Alert.alert(
        'Request Submitted!',
        'Thank you for your interest in a FREE First Win Session. A BeH2O® certified coach will contact you within 24 hours to schedule your personalized 15-minute session.',
        [{ text: 'OK', onPress: () => router.push('/dashboard') }]
      )
    } catch (error) {
      console.error('Error submitting coaching request:', error)
      Alert.alert('Error', 'Failed to submit your request. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />

      {/* Fixed Back Button */}
      <View style={styles.fixedBackButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={ds.colors.primary.main} />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>

          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar-outline" size={32} color={ds.colors.primary.main} />
            </View>
            <Text style={styles.headerTitle}>Book Your FREE First Win Session</Text>
            <Text style={styles.headerSubtitle}>
              Connect with a BeH2O® certified coach for personalized guidance on your co-parenting journey.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.formSection}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Jordan"
                placeholderTextColor={ds.colors.text.tertiary}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Contact Method */}
            <View style={styles.formSection}>
              <Text style={styles.label}>How should we reach you?</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.optionButton, contactMethod === 'email' && styles.optionButtonActive]}
                  onPress={() => setContactMethod('email')}
                >
                  <Text style={[styles.optionButtonText, contactMethod === 'email' && styles.optionButtonTextActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, contactMethod === 'text' && styles.optionButtonActive]}
                  onPress={() => setContactMethod('text')}
                >
                  <Text style={[styles.optionButtonText, contactMethod === 'text' && styles.optionButtonTextActive]}>
                    Text
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, contactMethod === 'phone' && styles.optionButtonActive]}
                  onPress={() => setContactMethod('phone')}
                >
                  <Text style={[styles.optionButtonText, contactMethod === 'phone' && styles.optionButtonTextActive]}>
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Contact Information Input */}
              {contactMethod === 'email' && (
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={ds.colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              {(contactMethod === 'text' || contactMethod === 'phone') && (
                <TextInput
                  style={styles.input}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={ds.colors.text.tertiary}
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  keyboardType="phone-pad"
                  maxLength={14} // (XXX) XXX-XXXX = 14 characters
                />
              )}
            </View>

            {/* Children's Ages */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Children's ages (check all that apply)</Text>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => toggleChildrenAge('0-5')}
              >
                <View style={styles.checkbox}>
                  {childrenAges.includes('0-5') && <Ionicons name="checkmark" size={16} color={ds.colors.primary.main} />}
                </View>
                <Text style={styles.checkboxLabel}>0-5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => toggleChildrenAge('6-12')}
              >
                <View style={styles.checkbox}>
                  {childrenAges.includes('6-12') && <Ionicons name="checkmark" size={16} color={ds.colors.primary.main} />}
                </View>
                <Text style={styles.checkboxLabel}>6-12</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => toggleChildrenAge('13-18')}
              >
                <View style={styles.checkbox}>
                  {childrenAges.includes('13-18') && <Ionicons name="checkmark" size={16} color={ds.colors.primary.main} />}
                </View>
                <Text style={styles.checkboxLabel}>13-18</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => toggleChildrenAge('over_18')}
              >
                <View style={styles.checkbox}>
                  {childrenAges.includes('over_18') && <Ionicons name="checkmark" size={16} color={ds.colors.primary.main} />}
                </View>
                <Text style={styles.checkboxLabel}>Over 18</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Focus */}
            <View style={styles.formSection}>
              <Text style={styles.label}>What feels most important right now?</Text>
              <View style={styles.selectContainer}>
                <TextInput
                  style={styles.select}
                  placeholder="Select your primary focus area"
                  placeholderTextColor={ds.colors.text.tertiary}
                  value={primaryFocus}
                  onChangeText={setPrimaryFocus}
                />
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="heart-outline" size={20} color={ds.colors.primary.main} />
              <View style={styles.infoBoxText}>
                <Text style={styles.infoBoxTitle}>Your First Win Session is completely FREE</Text>
                <Text style={styles.infoBoxDescription}>
                  A BeH2O® certified coach will contact you within 24 hours to schedule your personalized 15-minute session. No commitment required.
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Ionicons name="calendar" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Request My Free Session'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustSection}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark-outline" size={24} color={ds.colors.primary.main} />
              <Text style={styles.trustBadgeTitle}>Private & Confidential</Text>
              <Text style={styles.trustBadgeDescription}>
                Your information is kept completely private and will only be used to connect you with a certified coach.
              </Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="people-outline" size={24} color={ds.colors.primary.main} />
              <Text style={styles.trustBadgeTitle}>Expert Guidance</Text>
              <Text style={styles.trustBadgeDescription}>
                Our coaches are trained in the same evidence-based BeH2O® principles that power BeAligned™.
              </Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="warning-outline" size={16} color={ds.colors.warning.main} />
            <Text style={styles.disclaimerText}>
              BeAligned does not offer legal advice or therapy
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  fixedBackButtonContainer: {
    position: 'absolute',
    top: 60, // Below the header
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: ds.colors.background.primary,
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
    marginTop: 50, // Space for fixed back button
  },
  scrollContent: {
    paddingBottom: ds.spacing[8],
  },
  content: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: ds.spacing[6],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[2],
  },
  backButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
  },
  headerCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[8],
    alignItems: 'center',
    marginBottom: ds.spacing[6],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ds.colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[4],
  },
  headerTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
  },
  headerSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    gap: ds.spacing[6],
  },
  formSection: {
    gap: ds.spacing[2],
  },
  label: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
  },
  input: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: ds.spacing[2],
  },
  optionButton: {
    flex: 1,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  optionButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.medium,
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
  },
  dropdownPlaceholder: {
    color: ds.colors.text.tertiary,
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    backgroundColor: '#FFFFFF',
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
  },
  selectContainer: {
    position: 'relative',
  },
  select: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[2],
  },
  radioOptionSelected: {
    // No extra styling needed
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ds.colors.primary.main,
  },
  radioLabel: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
  },
  infoBox: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    padding: ds.spacing[4],
    backgroundColor: ds.colors.primary.lightest,
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.primary.light,
  },
  infoBoxText: {
    flex: 1,
    gap: ds.spacing[1],
  },
  infoBoxTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
  },
  infoBoxDescription: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.full,
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[6],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  trustSection: {
    flexDirection: 'row',
    gap: ds.spacing[4],
    marginTop: ds.spacing[6],
  },
  trustBadge: {
    flex: 1,
    padding: ds.spacing[4],
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  trustBadgeTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    textAlign: 'center',
  },
  trustBadgeDescription: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    marginTop: ds.spacing[6],
  },
  disclaimerText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    fontStyle: 'italic',
  },
})

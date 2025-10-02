import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import InAppNavigationHeader from '../components/InAppNavigationHeader'
import ds from '../styles/design-system'

type ContactMethod = 'email' | 'text' | 'phone'
type CoparentingSituation = 'divorced' | 'never_married' | 'remarried'
type ChildrenAges = '0-5' | '6-12' | '13-18' | 'over_18'

export default function FreeFirstWhyPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [timeZone, setTimeZone] = useState('')
  const [coparentingSituation, setCoparentingSituation] = useState<CoparentingSituation | ''>('')
  const [childrenAges, setChildrenAges] = useState<ChildrenAges[]>([])
  const [primaryFocus, setPrimaryFocus] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    if (!timeZone) {
      Alert.alert('Missing Information', 'Please select your time zone.')
      return
    }
    if (!coparentingSituation) {
      Alert.alert('Missing Information', 'Please select your co-parenting situation.')
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

      // Insert coaching request
      const { error } = await supabase
        .from('coaching_session_requests')
        .insert({
          user_id: user.id,
          first_name: firstName.trim(),
          contact_method: contactMethod,
          time_zone: timeZone,
          coparenting_situation: coparentingSituation,
          children_ages: childrenAges,
          primary_focus: primaryFocus,
          status: 'pending',
        })

      if (error) throw error

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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={ds.colors.primary.main} />
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>

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
            </View>

            {/* Time Zone */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Time Zone</Text>
              <View style={styles.selectContainer}>
                <TextInput
                  style={styles.select}
                  placeholder="Select your time zone"
                  placeholderTextColor={ds.colors.text.tertiary}
                  value={timeZone}
                  onChangeText={setTimeZone}
                />
              </View>
            </View>

            {/* Co-parenting Situation */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Which best describes your co-parenting situation?</Text>
              <TouchableOpacity
                style={[styles.radioOption, coparentingSituation === 'divorced' && styles.radioOptionSelected]}
                onPress={() => setCoparentingSituation('divorced')}
              >
                <View style={styles.radio}>
                  {coparentingSituation === 'divorced' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Divorced</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioOption, coparentingSituation === 'never_married' && styles.radioOptionSelected]}
                onPress={() => setCoparentingSituation('never_married')}
              >
                <View style={styles.radio}>
                  {coparentingSituation === 'never_married' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Never Married</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioOption, coparentingSituation === 'remarried' && styles.radioOptionSelected]}
                onPress={() => setCoparentingSituation('remarried')}
              >
                <View style={styles.radio}>
                  {coparentingSituation === 'remarried' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Remarried</Text>
              </TouchableOpacity>
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
  scrollView: {
    flex: 1,
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
    paddingVertical: ds.spacing[4],
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

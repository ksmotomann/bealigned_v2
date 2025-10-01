import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'

interface AlignmentCode {
  id: string
  code: string
  user_type: string
  description: string
  max_uses: number | null
  used_count: number
  is_active: boolean
  created_at: string
}

export default function AlignmentCodesPanel() {
  const [alignmentCodes, setAlignmentCodes] = useState<AlignmentCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newTier, setNewTier] = useState('user')
  const [newDescription, setNewDescription] = useState('')
  const [newMaxUses, setNewMaxUses] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadAlignmentCodes()
  }, [])

  const loadAlignmentCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('alignment_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlignmentCodes(data || [])
    } catch (error) {
      console.error('Error loading alignment codes:', error)
      Alert.alert('Error', 'Failed to load alignment codes')
    } finally {
      setLoading(false)
    }
  }

  const createAlignmentCode = async () => {
    if (!newCode.trim() || !newDescription.trim()) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        Alert.alert('Error', 'Not authenticated')
        return
      }

      const { error } = await supabase
        .from('alignment_codes')
        .insert({
          code: newCode.trim().toUpperCase(),
          user_type: newTier,
          description: newDescription.trim(),
          max_uses: newMaxUses ? parseInt(newMaxUses) : null,
          created_by: userData.user?.id
        })

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Error', 'This alignment code already exists')
        } else {
          Alert.alert('Error', error.message)
        }
        return
      }

      Alert.alert('Success', 'Alignment code created successfully!')
      setNewCode('')
      setNewDescription('')
      setNewMaxUses('')
      setNewTier('user')
      setShowCreateForm(false)
      loadAlignmentCodes()
    } catch (err) {
      Alert.alert('Error', 'Failed to create alignment code')
    } finally {
      setCreating(false)
    }
  }

  const deactivateAlignmentCode = async (codeId: string) => {
    Alert.alert(
      'Deactivate Code',
      'Are you sure you want to deactivate this alignment code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('alignment_codes')
                .update({ is_active: false })
                .eq('id', codeId)

              if (error) throw error
              Alert.alert('Success', 'Alignment code deactivated')
              loadAlignmentCodes()
            } catch (err) {
              Alert.alert('Error', 'Failed to deactivate code')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ds.colors.primary.main} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Alignment Codes Management</Text>
      <Text style={styles.subtitle}>
        Create and manage alignment codes for user tiers (admin, expert, user)
      </Text>

      {/* Create New Code Button */}
      <Pressable
        style={styles.createButton}
        onPress={() => setShowCreateForm(!showCreateForm)}
      >
        <Ionicons name={showCreateForm ? "close" : "add"} size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>
          {showCreateForm ? 'Cancel' : 'Create New Code'}
        </Text>
      </Pressable>

      {/* Create Form */}
      {showCreateForm && (
        <View style={styles.createForm}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Code</Text>
            <TextInput
              style={styles.input}
              value={newCode}
              onChangeText={setNewCode}
              placeholder="Enter unique code (e.g., ADMIN2024)"
              autoCapitalize="characters"
              editable={!creating}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>User Tier</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'admin', label: 'Admin', description: 'Full access to all features' },
                { value: 'expert', label: 'Expert', description: 'Advanced features and content' },
                { value: 'user', label: 'User', description: 'Standard user access' },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.radioOption,
                    newTier === option.value && styles.radioOptionActive
                  ]}
                  onPress={() => setNewTier(option.value)}
                  disabled={creating}
                >
                  <View style={styles.radioButton}>
                    {newTier === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.radioContent}>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                    <Text style={styles.radioDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Describe this alignment code's purpose"
              multiline
              numberOfLines={3}
              editable={!creating}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Max Uses (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newMaxUses}
              onChangeText={setNewMaxUses}
              placeholder="Leave empty for unlimited uses"
              keyboardType="numeric"
              editable={!creating}
            />
          </View>

          <Pressable
            style={[styles.submitButton, creating && styles.buttonDisabled]}
            onPress={createAlignmentCode}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Create Code</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Existing Codes */}
      <Text style={styles.sectionTitle}>Existing Codes</Text>

      {alignmentCodes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No alignment codes created yet. Create your first code above.
          </Text>
        </View>
      ) : (
        <View style={styles.codesList}>
          {alignmentCodes.map((code) => (
            <View key={code.id} style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeText}>{code.code}</Text>
                <View style={[styles.tierBadge, {
                  backgroundColor:
                    code.user_type === 'admin' ? '#EF4444' :
                    code.user_type === 'expert' ? '#F59E0B' :
                    '#10B981'
                }]}>
                  <Text style={styles.tierText}>{code.user_type.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.codeDescription}>{code.description}</Text>

              <View style={styles.codeStats}>
                <Text style={styles.codeStat}>
                  Uses: {code.used_count || 0}
                  {code.max_uses ? ` / ${code.max_uses}` : ' (unlimited)'}
                </Text>
                <Text style={styles.codeStat}>
                  Status: {code.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              {code.is_active && (
                <Pressable
                  style={styles.deactivateButton}
                  onPress={() => deactivateAlignmentCode(code.id)}
                >
                  <Text style={styles.deactivateButtonText}>Deactivate</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    ...ds.shadows.lg,
  },
  loadingContainer: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadows.lg,
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[6],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[4],
  },
  createButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  createForm: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[5],
    marginBottom: ds.spacing[6],
    gap: ds.spacing[4],
  },
  formGroup: {
    gap: ds.spacing[2],
  },
  label: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  input: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    gap: ds.spacing[2],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
    backgroundColor: ds.colors.background.primary,
    borderWidth: 2,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
  },
  radioOptionActive: {
    borderColor: ds.colors.primary.main,
    backgroundColor: ds.colors.primary.lightest,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ds.colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ds.colors.primary.main,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  radioDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginTop: ds.spacing[1],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    backgroundColor: ds.colors.primary.main,
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
  },
  submitButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginTop: ds.spacing[4],
    marginBottom: ds.spacing[4],
  },
  emptyState: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
  },
  codesList: {
    gap: ds.spacing[4],
  },
  codeCard: {
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[5],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[3],
  },
  codeText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  tierBadge: {
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.full,
  },
  tierText: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
  codeDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[3],
    lineHeight: ds.typography.fontSize.base.lineHeight * 1.5,
  },
  codeStats: {
    flexDirection: 'row',
    gap: ds.spacing[4],
    marginBottom: ds.spacing[3],
  },
  codeStat: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  deactivateButton: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    alignSelf: 'flex-start',
  },
  deactivateButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#EF4444',
    fontFamily: ds.typography.fontFamily.base,
  },
})

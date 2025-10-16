import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import ds from '../styles/design-system'

interface ChatVersion {
  version: number
  display_name: string
  default_model: string
  default_temperature: number
  default_max_tokens: number
  temperature_min: number
  temperature_max: number
  max_tokens_cap: number
  is_admin_only: boolean
}

interface Props {
  sessionId: string | null
  currentVersion: number
  onVersionChange: (version: number, config: any) => void
}

export function ChatVersionSelector({ sessionId, currentVersion, onVersionChange }: Props) {
  const [versions, setVersions] = useState<ChatVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number>(currentVersion)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [temperature, setTemperature] = useState<number>(0.7)
  const [maxTokens, setMaxTokens] = useState<number>(1500)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  const availableModels = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  ]

  // Load available versions
  useEffect(() => {
    loadVersions()
  }, [])

  // Update when currentVersion prop changes
  useEffect(() => {
    setSelectedVersion(currentVersion)
    const version = versions.find(v => v.version === currentVersion)
    if (version) {
      setSelectedModel(version.default_model)
      setTemperature(version.default_temperature)
      setMaxTokens(version.default_max_tokens)
    }
  }, [currentVersion, versions])

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_versions')
        .select('*')
        .order('version')

      if (!error && data) {
        setVersions(data)
        const current = data.find(v => v.version === currentVersion)
        if (current) {
          setSelectedModel(current.default_model)
          setTemperature(current.default_temperature)
          setMaxTokens(current.default_max_tokens)
        }
      }
    } catch (err) {
      console.error('Failed to load chat versions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVersionChange = (version: number) => {
    const versionConfig = versions.find(v => v.version === version)
    if (!versionConfig) return

    setSelectedVersion(version)
    setSelectedModel(versionConfig.default_model)
    setTemperature(versionConfig.default_temperature)
    setMaxTokens(versionConfig.default_max_tokens)

    // Notify parent component
    onVersionChange(version, {
      model: versionConfig.default_model,
      temperature: versionConfig.default_temperature,
      max_tokens: versionConfig.default_max_tokens,
    })
  }

  const handleConfigChange = () => {
    const versionConfig = versions.find(v => v.version === selectedVersion)
    if (!versionConfig) return

    // Clamp values to version limits
    const clampedTemperature = Math.max(
      versionConfig.temperature_min,
      Math.min(versionConfig.temperature_max, temperature)
    )
    const clampedTokens = Math.min(versionConfig.max_tokens_cap, maxTokens)

    onVersionChange(selectedVersion, {
      model: selectedModel,
      temperature: clampedTemperature,
      max_tokens: clampedTokens,
    })
  }

  if (loading) return null

  return (
    <View style={styles.container}>
      {/* Collapse/Expand Toggle */}
      <Pressable
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.toggleContent}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={ds.colors.primary.main}
          />
          <Text style={styles.toggleText}>
            {isExpanded ? 'Hide' : 'Show'} Version Controls
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v{selectedVersion}</Text>
          </View>
        </View>
      </Pressable>

      {isExpanded && (
        <View style={styles.controls}>
          {/* Version Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Chat Version</Text>
            <View style={styles.versionButtons}>
              {versions.map((v) => (
                <Pressable
                  key={v.version}
                  style={[
                    styles.versionButton,
                    selectedVersion === v.version && styles.versionButtonActive,
                  ]}
                  onPress={() => handleVersionChange(v.version)}
                >
                  <Text
                    style={[
                      styles.versionButtonText,
                      selectedVersion === v.version && styles.versionButtonTextActive,
                    ]}
                  >
                    v{v.version}
                  </Text>
                  {v.is_admin_only && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            <Text style={styles.helperText}>
              {versions.find(v => v.version === selectedVersion)?.display_name}
            </Text>
          </View>

          {/* Model Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>AI Model</Text>
            <View style={styles.modelButtons}>
              {availableModels.map((model) => (
                <Pressable
                  key={model.value}
                  style={[
                    styles.modelButton,
                    selectedModel === model.value && styles.modelButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedModel(model.value)
                    handleConfigChange()
                  }}
                >
                  <Text
                    style={[
                      styles.modelButtonText,
                      selectedModel === model.value && styles.modelButtonTextActive,
                    ]}
                  >
                    {model.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Temperature Slider */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Temperature</Text>
              <Text style={styles.valueText}>{temperature.toFixed(2)}</Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>0.0</Text>
              <input
                type="range"
                min={versions.find(v => v.version === selectedVersion)?.temperature_min || 0}
                max={versions.find(v => v.version === selectedVersion)?.temperature_max || 1.2}
                step={0.1}
                value={temperature}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setTemperature(val)
                }}
                onMouseUp={handleConfigChange}
                onTouchEnd={handleConfigChange}
                style={{ flex: 1, margin: '0 12px' }}
              />
              <Text style={styles.sliderLabel}>
                {versions.find(v => v.version === selectedVersion)?.temperature_max.toFixed(1) || '1.2'}
              </Text>
            </View>
            <Text style={styles.helperText}>
              Lower = more focused, Higher = more creative
            </Text>
          </View>

          {/* Max Tokens */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Max Tokens</Text>
              <TextInput
                style={styles.tokenInput}
                value={maxTokens.toString()}
                onChangeText={(text) => {
                  const val = parseInt(text) || 0
                  setMaxTokens(val)
                }}
                onBlur={handleConfigChange}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <Text style={styles.helperText}>
              Cap: {versions.find(v => v.version === selectedVersion)?.max_tokens_cap || 2000} tokens
            </Text>
          </View>

          {/* Warning for Version Change */}
          {sessionId && selectedVersion !== currentVersion && (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Changing version will create a new session
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  toggleButton: {
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  toggleText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.primary.main,
    flex: 1,
  },
  versionBadge: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.sm,
  },
  versionBadgeText: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  controls: {
    paddingHorizontal: ds.spacing[4],
    paddingBottom: ds.spacing[4],
    gap: ds.spacing[4],
  },
  section: {
    gap: ds.spacing[2],
  },
  label: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
  },
  helperText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
  },
  versionButtons: {
    flexDirection: 'row',
    gap: ds.spacing[2],
  },
  versionButton: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.neutral[100],
    borderWidth: 2,
    borderColor: ds.colors.neutral[200],
    alignItems: 'center',
  },
  versionButtonActive: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  versionButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
  },
  versionButtonTextActive: {
    color: '#FFFFFF',
  },
  adminBadge: {
    marginTop: ds.spacing[1],
    paddingHorizontal: ds.spacing[1],
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: ds.borderRadius.sm,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: ds.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  modelButtons: {
    gap: ds.spacing[2],
  },
  modelButton: {
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.neutral[100],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  modelButtonActive: {
    backgroundColor: ds.colors.primary.lightest,
    borderColor: ds.colors.primary.main,
  },
  modelButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
  },
  modelButtonTextActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  sliderLabel: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    minWidth: 32,
    textAlign: 'center',
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.sm,
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    minWidth: 80,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    padding: ds.spacing[3],
    backgroundColor: '#FEF3C7',
    borderRadius: ds.borderRadius.md,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: ds.typography.fontSize.sm.size,
    color: '#92400E',
    fontWeight: ds.typography.fontWeight.medium,
  },
})

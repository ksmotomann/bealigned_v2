import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useSEO } from '../../context/SEOContext'
import { generateSitemap } from '../../utils/sitemap'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import ds from '../../styles/design-system'
import { MODEL_INFO, AIModel, DEFAULT_AI_CONFIG } from '../../lib/aiConfig'
import { supabase } from '../../lib/supabase'
import AdminTrainingTranscripts from '../../components/AdminTrainingTranscripts'
import AdminSettings from '../../components/AdminSettings'

export default function AdminPanel() {
  const { seoData: contextSeoData, updateSEOData } = useSEO()
  const [activeSection, setActiveSection] = useState('seo')
  const [localSeoData, setLocalSeoData] = useState(contextSeoData)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [appConfig, setAppConfig] = useState({
    maintenanceMode: false,
    signupEnabled: true,
    analyticsEnabled: true,
    chatbotEnabled: true,
    reflectionLimit: 10,
  })

  const [chatConfig, setChatConfig] = useState({
    // AI Model Settings
    aiModel: DEFAULT_AI_CONFIG.model as AIModel,
    temperature: DEFAULT_AI_CONFIG.temperature,
    maxTokens: DEFAULT_AI_CONFIG.maxTokens,

    // Original Settings (renamed for clarity)
    responseStyle: 'balanced', // creative, balanced, focused
    responseLength: 'normal', // brief, normal, detailed
    empathyLevel: 'high', // low, medium, high
    guidanceStrength: 'supportive', // minimal, supportive, directive
    sessionTimeLimit: 0, // 0 = no limit, or minutes
    autoSaveReflections: true,
    showStepIndicators: true,
    allowVoiceInput: false,
  })

  // Alignment codes state
  const [alignmentCodes, setAlignmentCodes] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newTier, setNewTier] = useState('user')
  const [newDescription, setNewDescription] = useState('')
  const [newMaxUses, setNewMaxUses] = useState('')
  const [creating, setCreating] = useState(false)
  const [migrating, setMigrating] = useState(false)

  // User management state
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userAlignmentCodes, setUserAlignmentCodes] = useState([])
  const [updatingUser, setUpdatingUser] = useState(false)

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState([])
  const [topPerformingCodes, setTopPerformingCodes] = useState([])
  const [recentUsage, setRecentUsage] = useState([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [analyticsTab, setAnalyticsTab] = useState('overview')

  const adminSections = [
    { id: 'seo', title: 'SEO Management', icon: 'search-outline' },
    { id: 'content', title: 'Content Management', icon: 'document-text-outline' },
    { id: 'config', title: 'App Configuration', icon: 'settings-outline' },
    { id: 'alignment-codes', title: 'Alignment Codes', icon: 'key-outline' },
    { id: 'ai', title: 'AI Configuration', icon: 'bulb-outline' },
    { id: 'chat', title: 'Chat Settings', icon: 'chatbubbles-outline' },
    { id: 'training', title: 'Training Management', icon: 'school-outline' },
    { id: 'analytics', title: 'Analytics', icon: 'analytics-outline' },
    { id: 'users', title: 'User Management', icon: 'people-outline' },
  ]

  // Load saved AI configuration when component mounts or section changes
  useEffect(() => {
    if (activeSection === 'ai') {
      loadAIConfig()
    } else if (activeSection === 'alignment-codes') {
      loadAlignmentCodes()
    } else if (activeSection === 'users') {
      loadUsers()
    } else if (activeSection === 'analytics') {
      loadAnalytics()
    }
  }, [activeSection])

  const loadAIConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_configuration')
        .select('*')
        .eq('enabled', true)
        .single()

      if (data && !error) {
        setChatConfig(prev => ({
          ...prev,
          aiModel: data.model as AIModel,
          temperature: parseFloat(data.temperature),
          maxTokens: data.max_tokens
}))
      }
    } catch (err) {
      console.log('No existing AI config found, using defaults')
    }
  }

  const loadAlignmentCodes = async () => {
    try {
      console.log('Loading alignment codes...')
      const { data, error } = await supabase
        .from('alignment_codes')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Alignment codes query result:', { data, error })

      if (error) {
        console.error('Alignment codes query error:', error)
        setAlignmentCodes([])
        return
      }

      if (data) {
        console.log(`Loaded ${data.length} alignment codes`)
        setAlignmentCodes(data)
      } else {
        setAlignmentCodes([])
      }
    } catch (err) {
      console.error('Error loading alignment codes:', err)
      setAlignmentCodes([])
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

      const { data, error } = await supabase
        .from('alignment_codes')
        .insert({
          code: newCode.trim().toUpperCase(),
          user_type: newTier,
          description: newDescription.trim(),
          max_uses: newMaxUses ? parseInt(newMaxUses) : null,
          created_by: userData.user?.id
        })
        .select()

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

              if (error) {
                Alert.alert('Error', error.message)
                return
              }

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

  // User management functions
  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      console.log('🔍 Starting to load users...')
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          user_type,
          alignment_code_used,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      console.log('📊 Users query result:', { data, error, count: data?.length })

      if (error) {
        console.error('❌ Error loading users:', error)
        setUsers([])
        return
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} users`)
      setUsers(data || [])
    } catch (err) {
      console.error('💥 Exception loading users:', err)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadUserAlignmentCodes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_alignment_codes')
        .select(`
          *,
          alignment_codes (
            code,
            description,
            user_type
          )
        `)
        .eq('user_id', userId)
        .order('used_at', { ascending: false })

      if (error) {
        console.error('Error loading user alignment codes:', error)
        return
      }

      setUserAlignmentCodes(data || [])
    } catch (err) {
      console.error('Error loading user alignment codes:', err)
    }
  }

  const updateUserType = async (userId: string, newUserType: string) => {
    setUpdatingUser(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newUserType })
        .eq('id', userId)

      if (error) {
        Alert.alert('Error', 'Failed to update user type')
        return
      }

      Alert.alert('Success', 'User type updated successfully!')
      loadUsers() // Refresh the user list
    } catch (err) {
      Alert.alert('Error', 'Failed to update user type')
    } finally {
      setUpdatingUser(false)
    }
  }

  // Analytics functions
  const loadAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      // Load all analytics data in parallel
      const [analyticsResult, topCodesResult, recentUsageResult] = await Promise.all([
        supabase.rpc('get_alignment_code_analytics'),
        supabase.rpc('get_top_performing_codes', { limit_count: 10 }),
        supabase.rpc('get_recent_code_usage', { days_back: 30 })
      ])

      if (analyticsResult.error) {
        console.error('Analytics error:', analyticsResult.error)
      } else {
        setAnalyticsData(analyticsResult.data || [])
      }

      if (topCodesResult.error) {
        console.error('Top codes error:', topCodesResult.error)
      } else {
        setTopPerformingCodes(topCodesResult.data || [])
      }

      if (recentUsageResult.error) {
        console.error('Recent usage error:', recentUsageResult.error)
      } else {
        setRecentUsage(recentUsageResult.data || [])
      }

    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const runManualMigration = async () => {
    setMigrating(true)
    try {
      console.log('Starting manual migration...')

      // Create the alignment_codes table
      const createTableSQL = `
        -- Create alignment codes table
        CREATE TABLE IF NOT EXISTS public.alignment_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            user_type TEXT NOT NULL,
            description TEXT,
            max_uses INTEGER,
            current_uses INTEGER DEFAULT 0,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_alignment_codes_code ON public.alignment_codes(code);
        CREATE INDEX IF NOT EXISTS idx_alignment_codes_tier ON public.alignment_codes(user_type);
        CREATE INDEX IF NOT EXISTS idx_alignment_codes_active ON public.alignment_codes(is_active);

        -- Enable RLS
        ALTER TABLE public.alignment_codes ENABLE ROW LEVEL SECURITY;
      `

      const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      if (tableError) {
        console.error('Table creation error:', tableError)
        Alert.alert('Error', 'Failed to create table: ' + tableError.message)
        return
      }

      // Create default codes
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        Alert.alert('Error', 'Not authenticated')
        return
      }

      const defaultCodes = [
        {
          code: 'ADMIN-REQUEST',
          user_type: 'admin',
          description: 'Request admin access - requires manual approval',
          max_uses: null,
          created_by: userData.user?.id
        },
        {
          code: 'EXPERT-BETA',
          user_type: 'expert',
          description: 'Expert access for beta testers',
          max_uses: 100,
          created_by: userData.user?.id
        },
        {
          code: 'PILOT-PARTNERS',
          user_type: 'expert',
          description: 'Pilot Partners - 45 days free access then $49.95/year conversion',
          max_uses: 1000,
          created_by: userData.user?.id
        },
        {
          code: 'GENERAL-ACCESS',
          user_type: 'user',
          description: 'General user access',
          max_uses: null,
          created_by: userData.user?.id
        }
      ]

      for (const code of defaultCodes) {
        const { error: insertError } = await supabase
          .from('alignment_codes')
          .insert(code)
          .select()

        if (insertError && !insertError.message.includes('duplicate key')) {
          console.error('Insert error for code', code.code, ':', insertError)
        }
      }

      Alert.alert('Success', 'Manual migration completed! Alignment codes table created and default codes added.')
      loadAlignmentCodes()

    } catch (err) {
      console.error('Manual migration error:', err)
      Alert.alert('Error', 'Migration failed: ' + err.message)
    } finally {
      setMigrating(false)
    }
  }

  // Auto-hide save message after 3 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveMessage])

  const handleSeoSave = async () => {
    try {
      await updateSEOData(localSeoData)
      Alert.alert('Success', 'SEO settings saved successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to save SEO settings. Please try again.')
    }
  }

  const generateSitemapFile = () => {
    try {
      const sitemap = generateSitemap(contextSeoData.canonicalBase)
      console.log('Generated sitemap:', sitemap)
      Alert.alert('Success', 'Sitemap generated successfully! Check console for output.')
    } catch (error) {
      Alert.alert('Error', 'Failed to generate sitemap.')
    }
  }

  const handleConfigSave = () => {
    // TODO: Save to backend/database  
    Alert.alert('Success', 'App configuration saved successfully!')
  }

  const renderSeoSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>SEO Management</Text>
      
      {/* Page Meta Tags Section */}
      <Text style={styles.subsectionTitle}>Page Meta Tags</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Home Page Title</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.homeTitle}
          onChangeText={(text) => setLocalSeoData({...localSeoData, homeTitle: text})}
          placeholder="Page title for home"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Home Page Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={localSeoData.homeDescription}
          onChangeText={(text) => setLocalSeoData({...localSeoData, homeDescription: text})}
          placeholder="Meta description for home page"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Home Page Keywords</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.homeKeywords}
          onChangeText={(text) => setLocalSeoData({...localSeoData, homeKeywords: text})}
          placeholder="Keywords separated by commas"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Our Story Page Title</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.ourStoryTitle}
          onChangeText={(text) => setLocalSeoData({...localSeoData, ourStoryTitle: text})}
          placeholder="Page title for Our Story"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Our Story Page Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={localSeoData.ourStoryDescription}
          onChangeText={(text) => setLocalSeoData({...localSeoData, ourStoryDescription: text})}
          placeholder="Meta description for Our Story page"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Social Media & Open Graph Section */}
      <Text style={styles.subsectionTitle}>Social Media & Open Graph</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Site Name</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.siteName}
          onChangeText={(text) => setLocalSeoData({...localSeoData, siteName: text})}
          placeholder="BeAligned"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Site URL</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.siteUrl}
          onChangeText={(text) => setLocalSeoData({...localSeoData, siteUrl: text})}
          placeholder="https://bealigned.app"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Open Graph Image URL</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.ogImage}
          onChangeText={(text) => setLocalSeoData({...localSeoData, ogImage: text})}
          placeholder="https://bealigned.app/og-image.png"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Twitter Handle</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.twitterHandle}
          onChangeText={(text) => setLocalSeoData({...localSeoData, twitterHandle: text})}
          placeholder="@BeAligned"
        />
      </View>

      {/* Analytics Section */}
      <Text style={styles.subsectionTitle}>Analytics & Tracking</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Google Analytics ID</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.googleAnalyticsId || ''}
          onChangeText={(text) => setLocalSeoData({...localSeoData, googleAnalyticsId: text})}
          placeholder="G-XXXXXXXXXX"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Hotjar ID</Text>
        <TextInput
          style={styles.input}
          value={localSeoData.hotjarId || ''}
          onChangeText={(text) => setLocalSeoData({...localSeoData, hotjarId: text})}
          placeholder="1234567"
        />
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Pressable style={styles.saveButton} onPress={handleSeoSave}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save SEO Settings</Text>
        </Pressable>
        
        <Pressable style={styles.secondaryButton} onPress={generateSitemapFile}>
          <Ionicons name="map" size={20} color={ds.colors.primary.main} />
          <Text style={styles.secondaryButtonText}>Generate Sitemap</Text>
        </Pressable>
      </View>
    </View>
  )

  const renderConfigSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>App Configuration</Text>
      
      <View style={styles.configItem}>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>Maintenance Mode</Text>
          <Text style={styles.configDescription}>
            Enable to show maintenance page to users
          </Text>
        </View>
        <Switch
          value={appConfig.maintenanceMode}
          onValueChange={(value) => setAppConfig({...appConfig, maintenanceMode: value})}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.configItem}>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>User Signup Enabled</Text>
          <Text style={styles.configDescription}>
            Allow new users to register accounts
          </Text>
        </View>
        <Switch
          value={appConfig.signupEnabled}
          onValueChange={(value) => setAppConfig({...appConfig, signupEnabled: value})}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.configItem}>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>Analytics Tracking</Text>
          <Text style={styles.configDescription}>
            Enable Google Analytics and user tracking
          </Text>
        </View>
        <Switch
          value={appConfig.analyticsEnabled}
          onValueChange={(value) => setAppConfig({...appConfig, analyticsEnabled: value})}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Free Tier Reflection Limit</Text>
        <TextInput
          style={styles.input}
          value={appConfig.reflectionLimit.toString()}
          onChangeText={(text) => setAppConfig({...appConfig, reflectionLimit: parseInt(text) || 0})}
          placeholder="Number of free reflections"
          keyboardType="numeric"
        />
      </View>

      <Pressable style={styles.saveButton} onPress={handleConfigSave}>
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>Save Configuration</Text>
      </Pressable>
    </View>
  )

  const renderContentSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Content Management</Text>
      <Text style={styles.comingSoon}>Coming Soon</Text>
      <Text style={styles.comingSoonDescription}>
        Manage FAQ questions, testimonials, marketing copy, and dynamic content.
      </Text>
    </View>
  )

  const renderAnalyticsSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Alignment Code Analytics</Text>
      <Text style={styles.subsectionDescription}>
        Track performance, usage patterns, and effectiveness of your alignment codes
      </Text>

      {/* Analytics Tabs */}
      <View style={styles.trainingTabs}>
        <Pressable
          style={[styles.trainingTab, analyticsTab === 'overview' && styles.trainingTabActive]}
          onPress={() => setAnalyticsTab('overview')}
        >
          <Text style={[styles.trainingTabText, analyticsTab === 'overview' && styles.trainingTabTextActive]}>
            Overview
          </Text>
        </Pressable>
        <Pressable
          style={[styles.trainingTab, analyticsTab === 'performance' && styles.trainingTabActive]}
          onPress={() => setAnalyticsTab('performance')}
        >
          <Text style={[styles.trainingTabText, analyticsTab === 'performance' && styles.trainingTabTextActive]}>
            Performance
          </Text>
        </Pressable>
        <Pressable
          style={[styles.trainingTab, analyticsTab === 'activity' && styles.trainingTabActive]}
          onPress={() => setAnalyticsTab('activity')}
        >
          <Text style={[styles.trainingTabText, analyticsTab === 'activity' && styles.trainingTabTextActive]}>
            Recent Activity
          </Text>
        </Pressable>
      </View>

      {loadingAnalytics ? (
        <Text style={styles.comingSoon}>Loading analytics...</Text>
      ) : (
        <View>
          {analyticsTab === 'overview' && (
            <View>
              <Text style={styles.subsectionTitle}>Code Performance Summary</Text>
              {analyticsData.length === 0 ? (
                <Text style={styles.comingSoonDescription}>No analytics data available yet</Text>
              ) : (
                <View style={styles.codesContainer}>
                  {analyticsData.map((code: any, index: number) => (
                    <View key={index} style={styles.codeCard}>
                      <View style={styles.codeHeader}>
                        <View>
                          <Text style={styles.codeText}>{code.code}</Text>
                          <Text style={styles.codeDescription}>{code.description}</Text>
                        </View>
                        <View style={[styles.tierBadge, {
                          backgroundColor:
                            code.user_type === 'admin' ? ds.colors.danger :
                            code.user_type === 'expert' ? ds.colors.warning :
                            ds.colors.success
                        }]}>
                          <Text style={styles.tierText}>{code.user_type.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.codeStats}>
                        <Text style={styles.codeStat}>
                          Total Users: {code.total_users}
                        </Text>
                        <Text style={styles.codeStat}>
                          Active: {code.active_users} | Trial: {code.trial_users}
                        </Text>
                        <Text style={styles.codeStat}>
                          Converted: {code.converted_users} | Expired: {code.expired_users}
                        </Text>
                        {code.conversion_rate > 0 && (
                          <Text style={[styles.codeStat, { color: ds.colors.success }]}>
                            Conversion Rate: {code.conversion_rate}%
                          </Text>
                        )}
                        {code.last_used && (
                          <Text style={styles.codeStat}>
                            Last Used: {new Date(code.last_used).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {analyticsTab === 'performance' && (
            <View>
              <Text style={styles.subsectionTitle}>Top Performing Codes</Text>
              {topPerformingCodes.length === 0 ? (
                <Text style={styles.comingSoonDescription}>No performance data available yet</Text>
              ) : (
                <View style={styles.codesContainer}>
                  {topPerformingCodes.map((code: any, index: number) => (
                    <View key={index} style={[styles.codeCard, {
                      borderLeftWidth: 4,
                      borderLeftColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : ds.colors.border
                    }]}>
                      <View style={styles.codeHeader}>
                        <View>
                          <Text style={styles.codeText}>
                            #{index + 1} {code.code}
                          </Text>
                          <Text style={styles.codeDescription}>
                            Performance Score: {Math.round(code.performance_score)}
                          </Text>
                        </View>
                        <View style={[styles.tierBadge, {
                          backgroundColor:
                            code.user_type === 'admin' ? ds.colors.danger :
                            code.user_type === 'expert' ? ds.colors.warning :
                            ds.colors.success
                        }]}>
                          <Text style={styles.tierText}>{code.user_type.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.codeStats}>
                        <Text style={styles.codeStat}>
                          Total Users: {code.total_users}
                        </Text>
                        <Text style={[styles.codeStat, { color: ds.colors.success }]}>
                          Conversion Rate: {code.conversion_rate}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {analyticsTab === 'activity' && (
            <View>
              <Text style={styles.subsectionTitle}>Recent Code Usage (Last 30 Days)</Text>
              {recentUsage.length === 0 ? (
                <Text style={styles.comingSoonDescription}>No recent activity</Text>
              ) : (
                <View style={styles.codesContainer}>
                  {recentUsage.slice(0, 10).map((usage: any, index: number) => (
                    <View key={index} style={styles.codeCard}>
                      <View style={styles.codeHeader}>
                        <View>
                          <Text style={styles.codeText}>{usage.code}</Text>
                          <Text style={styles.codeDescription}>
                            {usage.user_name} ({usage.user_email})
                          </Text>
                        </View>
                        <View style={[styles.tierBadge, {
                          backgroundColor:
                            usage.status === 'active' ? ds.colors.success :
                            usage.status === 'converted' ? ds.colors.primary :
                            usage.status === 'expired' ? ds.colors.danger :
                            ds.colors.warning
                        }]}>
                          <Text style={styles.tierText}>{usage.status.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.codeStats}>
                        <Text style={styles.codeStat}>
                          Used: {new Date(usage.used_at).toLocaleDateString()}
                        </Text>
                        {usage.trial_ends_at && (
                          <Text style={styles.codeStat}>
                            Trial Ends: {new Date(usage.trial_ends_at).toLocaleDateString()}
                            ({usage.days_in_trial} days used)
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {recentUsage.length > 10 && (
                <Text style={styles.comingSoonDescription}>
                  Showing 10 of {recentUsage.length} recent activities
                </Text>
              )}
            </View>
          )}

          <View style={styles.formGroup}>
            <Pressable
              style={styles.saveButton}
              onPress={loadAnalytics}
              disabled={loadingAnalytics}
            >
              <Text style={styles.saveButtonText}>
                {loadingAnalytics ? 'Refreshing...' : 'Refresh Analytics'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )

  const renderUsersSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>User Management</Text>
      <Text style={styles.subsectionDescription}>
        Manage user accounts, view alignment codes, and update user roles
      </Text>

      {loadingUsers ? (
        <Text style={styles.comingSoon}>Loading users...</Text>
      ) : (
        <View>
          <Text style={styles.subsectionTitle}>All Users ({users.length})</Text>

          {users.length === 0 ? (
            <Text style={styles.comingSoonDescription}>No users found</Text>
          ) : (
            <View style={styles.codesContainer}>
              {users.map((user: any) => (
                <View key={user.id} style={styles.codeCard}>
                  <View style={styles.codeHeader}>
                    <View>
                      <Text style={styles.codeText}>
                        {user.first_name} {user.last_name}
                      </Text>
                      <Text style={styles.codeDescription}>{user.email}</Text>
                    </View>
                    <View style={[styles.tierBadge, {
                      backgroundColor:
                        user.user_type === 'admin' ? ds.colors.danger :
                        user.user_type === 'expert' ? ds.colors.warning :
                        ds.colors.success
                    }]}>
                      <Text style={styles.tierText}>{(user.user_type || 'user').toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.codeStats}>
                    <Text style={styles.codeStat}>
                      Alignment Code: {user.alignment_code_used || 'None'}
                    </Text>
                    <Text style={styles.codeStat}>
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.codeActions}>
                    <Pressable
                      style={[styles.deactivateButton, { backgroundColor: '#007AFF', marginRight: 8 }]}
                      onPress={() => {
                        setSelectedUser(user)
                        loadUserAlignmentCodes(user.id)
                      }}
                    >
                      <Text style={[styles.deactivateButtonText, { color: 'white' }]}>View Details</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.deactivateButton, { backgroundColor: ds.colors.warning }]}
                      onPress={() => {
                        Alert.alert(
                          'Update User Type',
                          `Change ${user.first_name} ${user.last_name} to:`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'User', onPress: () => updateUserType(user.id, 'user') },
                            { text: 'Expert', onPress: () => updateUserType(user.id, 'expert') },
                            { text: 'Admin', onPress: () => updateUserType(user.id, 'admin') },
                          ]
                        )
                      }}
                      disabled={updatingUser}
                    >
                      <Text style={styles.deactivateButtonText}>
                        {updatingUser ? 'Updating...' : 'Change Type'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* User Details Modal/Panel */}
          {selectedUser && (
            <View style={[styles.codeCard, { marginTop: 20, backgroundColor: ds.colors.background.secondary }]}>
              <View style={styles.codeHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedUser.first_name} {selectedUser.last_name} Details
                </Text>
                <Pressable
                  style={styles.deactivateButton}
                  onPress={() => {
                    setSelectedUser(null)
                    setUserAlignmentCodes([])
                  }}
                >
                  <Text style={styles.deactivateButtonText}>Close</Text>
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email: {selectedUser.email}</Text>
                <Text style={styles.label}>User Type: {selectedUser.user_type || 'user'}</Text>
                <Text style={styles.label}>Current Code: {selectedUser.alignment_code_used || 'None'}</Text>
                <Text style={styles.label}>Joined: {new Date(selectedUser.created_at).toLocaleDateString()}</Text>
              </View>

              <Text style={styles.subsectionTitle}>Alignment Code History</Text>
              {userAlignmentCodes.length === 0 ? (
                <Text style={styles.comingSoonDescription}>No alignment codes used</Text>
              ) : (
                <View>
                  {userAlignmentCodes.map((userCode: any) => (
                    <View key={userCode.id} style={[styles.codeCard, { marginBottom: 8 }]}>
                      <Text style={styles.codeText}>{userCode.code}</Text>
                      <Text style={styles.codeDescription}>
                        Status: {userCode.status} | Used: {new Date(userCode.used_at).toLocaleDateString()}
                      </Text>
                      {userCode.trial_ends_at && (
                        <Text style={styles.codeStat}>
                          Trial Ends: {new Date(userCode.trial_ends_at).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  )

  const renderAISection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>AI Configuration</Text>
      <Text style={styles.subsectionDescription}>
        Configure the AI model and settings for the reflection assistant
      </Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>AI Model</Text>
        <Text style={styles.configDescription}>
          Choose the AI model based on quality, speed, and cost requirements
        </Text>
        <View style={styles.modelGrid}>
          {Object.entries(MODEL_INFO).map(([modelKey, info]) => {
            const isSelected = chatConfig.aiModel === modelKey
            return (
              <Pressable
                key={modelKey}
                style={[
                  styles.modelCard,
                  isSelected && styles.modelCardActive
                ]}
                onPress={() => setChatConfig({...chatConfig, aiModel: modelKey as AIModel})}
              >
                <View style={styles.modelHeader}>
                  <Text style={[styles.modelName, isSelected && styles.modelNameActive]}>
                    {info.name}
                  </Text>
                  <View style={[styles.qualityBadge, { backgroundColor: 
                    info.quality === 'highest' ? ds.colors.success :
                    info.quality === 'high' ? ds.colors.primary.main :
                    ds.colors.warning
                  }]}>
                    <Text style={styles.qualityText}>{info.quality}</Text>
                  </View>
                </View>
                <View style={styles.modelStats}>
                  <Text style={styles.modelStat}>
                    <Ionicons name="speedometer-outline" size={12} /> {info.speed}
                  </Text>
                  <Text style={styles.modelStat}>
                    <Ionicons name="cash-outline" size={12} /> ${info.cost.input}/{info.cost.output}
                  </Text>
                </View>
                <Text style={styles.modelContext}>
                  Context: {(info.contextWindow / 1000).toFixed(0)}K tokens
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Temperature (Creativity)</Text>
        <Text style={styles.configDescription}>
          {chatConfig.temperature.toFixed(1)} - {chatConfig.temperature < 0.3 ? 'Very focused' : 
           chatConfig.temperature < 0.7 ? 'Balanced' : 
           chatConfig.temperature < 1.0 ? 'Creative' : 'Very creative'}
        </Text>
        <View style={styles.sliderContainer}>
          <Text>0.0</Text>
          <View style={styles.slider}>
            <View style={[styles.sliderFill, { width: `${chatConfig.temperature * 100}%` }]} />
          </View>
          <Text>1.0</Text>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Max Response Length</Text>
        <TextInput
          style={styles.input}
          value={chatConfig.maxTokens.toString()}
          onChangeText={(text) => setChatConfig({...chatConfig, maxTokens: parseInt(text) || 300})}
          placeholder="Max tokens (e.g., 300)"
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>
          Approximately {Math.round(chatConfig.maxTokens * 0.75)} words
        </Text>
      </View>

      <Pressable style={styles.saveButton} onPress={async () => {
        try {
          // Get current user
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (userError) {
            console.error('User error:', userError)
            Alert.alert('Error', 'Not authenticated')
            return
          }
          
          // First, disable any existing configuration
          const { error: updateError } = await supabase
            .from('ai_configuration')
            .update({ enabled: false })
            .eq('enabled', true)
          
          // Update error is ok if no existing config
          if (updateError) {
            // Expected when no config exists yet
          }
          
          // Then insert new configuration
          const { data, error } = await supabase
            .from('ai_configuration')
            .insert({
              model: chatConfig.aiModel,
              temperature: chatConfig.temperature,
              max_tokens: chatConfig.maxTokens,
              enabled: true,
              created_by: userData.user?.id
            })
            .select()
          
          if (error) {
            throw error
          }
          
          Alert.alert('Success', 'AI configuration saved successfully')
          setSaveMessage({ type: 'success', text: 'AI configuration saved successfully!' })
        } catch (error) {
          console.error('Save AI config error:', error)
          Alert.alert('Error', `Failed to save: ${error.message || 'Unknown error'}`)
          setSaveMessage({ type: 'error', text: `Failed to save: ${error.message || 'Unknown error'}` })
        }
      }}>
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>Save AI Settings</Text>
      </Pressable>
    </View>
  )

  const renderChatSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Chat Configuration</Text>
      <Text style={styles.subsectionDescription}>
        Configure how the BeH2O reflection assistant responds and interacts with users
      </Text>
      
      <Text style={styles.subsectionTitle}>Response Characteristics</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Response Style</Text>
        <Text style={styles.configDescription}>
          How creative vs focused should responses be?
        </Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'creative', label: 'Creative', description: 'More varied and exploratory responses' },
            { value: 'balanced', label: 'Balanced', description: 'Mix of creativity and consistency' },
            { value: 'focused', label: 'Focused', description: 'More consistent and predictable responses' },
          ].map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.radioOption,
                chatConfig.responseStyle === option.value && styles.radioOptionActive
              ]}
              onPress={() => setChatConfig({...chatConfig, responseStyle: option.value})}
            >
              <View style={styles.radioButton}>
                {chatConfig.responseStyle === option.value && (
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
        <Text style={styles.label}>Response Length</Text>
        <Text style={styles.configDescription}>
          How detailed should the assistant's responses be?
        </Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'brief', label: 'Brief', description: 'Short, concise responses' },
            { value: 'normal', label: 'Normal', description: 'Standard response length' },
            { value: 'detailed', label: 'Detailed', description: 'Longer, more thorough responses' },
          ].map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.radioOption,
                chatConfig.responseLength === option.value && styles.radioOptionActive
              ]}
              onPress={() => setChatConfig({...chatConfig, responseLength: option.value})}
            >
              <View style={styles.radioButton}>
                {chatConfig.responseLength === option.value && (
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

      <Text style={styles.subsectionTitle}>Interaction Settings</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Empathy Level</Text>
        <Text style={styles.configDescription}>
          How much emotional understanding should the assistant show?
        </Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'low', label: 'Professional', description: 'More factual and objective' },
            { value: 'medium', label: 'Warm', description: 'Balanced emotional response' },
            { value: 'high', label: 'Compassionate', description: 'Highly empathetic and understanding' },
          ].map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.radioOption,
                chatConfig.empathyLevel === option.value && styles.radioOptionActive
              ]}
              onPress={() => setChatConfig({...chatConfig, empathyLevel: option.value})}
            >
              <View style={styles.radioButton}>
                {chatConfig.empathyLevel === option.value && (
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
        <Text style={styles.label}>Guidance Strength</Text>
        <Text style={styles.configDescription}>
          How directive should the assistant be in guiding users?
        </Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'minimal', label: 'Minimal', description: 'Let users lead the conversation' },
            { value: 'supportive', label: 'Supportive', description: 'Gentle guidance when needed' },
            { value: 'directive', label: 'Directive', description: 'Actively guide through the process' },
          ].map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.radioOption,
                chatConfig.guidanceStrength === option.value && styles.radioOptionActive
              ]}
              onPress={() => setChatConfig({...chatConfig, guidanceStrength: option.value})}
            >
              <View style={styles.radioButton}>
                {chatConfig.guidanceStrength === option.value && (
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

      <Text style={styles.subsectionTitle}>Session Settings</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Session Time Limit (minutes)</Text>
        <TextInput
          style={styles.input}
          value={chatConfig.sessionTimeLimit.toString()}
          onChangeText={(text) => setChatConfig({...chatConfig, sessionTimeLimit: parseInt(text) || 0})}
          placeholder="0 for no limit"
          keyboardType="numeric"
        />
        <Text style={styles.configDescription}>
          Set to 0 for unlimited session time
        </Text>
      </View>

      <View style={styles.configItem}>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>Auto-save Reflections</Text>
          <Text style={styles.configDescription}>
            Automatically save user reflections during sessions
          </Text>
        </View>
        <Switch
          value={chatConfig.autoSaveReflections}
          onValueChange={(value) => setChatConfig({...chatConfig, autoSaveReflections: value})}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.configItem}>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>Show Step Indicators</Text>
          <Text style={styles.configDescription}>
            Display progress through the 7-step reflection process
          </Text>
        </View>
        <Switch
          value={chatConfig.showStepIndicators}
          onValueChange={(value) => setChatConfig({...chatConfig, showStepIndicators: value})}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
        />
      </View>

      <View style={styles.configItem}>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>Allow Voice Input</Text>
          <Text style={styles.configDescription}>
            Enable voice input for user messages (coming soon)
          </Text>
        </View>
        <Switch
          value={chatConfig.allowVoiceInput}
          onValueChange={(value) => setChatConfig({...chatConfig, allowVoiceInput: value})}
          trackColor={{ false: ds.colors.neutral[300], true: ds.colors.primary.main }}
          disabled
        />
      </View>

      <Pressable 
        style={styles.saveButton} 
        onPress={() => Alert.alert('Success', 'Chat configuration saved successfully!')}
      >
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>Save Chat Configuration</Text>
      </Pressable>
    </View>
  )

  const [trainingTab, setTrainingTab] = useState<'transcripts' | 'settings'>('transcripts')

  const renderAlignmentCodesSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Alignment Codes Management</Text>
      <Text style={styles.subsectionDescription}>
        Create and manage alignment codes for user tiers (admin, expert, user)
      </Text>

      {/* Create New Code Button */}
      <Pressable
        style={styles.saveButton}
        onPress={() => setShowCreateForm(!showCreateForm)}
      >
        <Ionicons name={showCreateForm ? "close" : "add"} size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>
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
            style={[styles.saveButton, creating && styles.buttonDisabled]}
            onPress={createAlignmentCode}
            disabled={creating}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {creating ? 'Creating...' : 'Create Code'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Existing Codes */}
      <Text style={styles.subsectionTitle}>Existing Codes</Text>

      {alignmentCodes.length === 0 ? (
        <Text style={styles.comingSoonDescription}>
          No alignment codes created yet. Create your first code above.
        </Text>
      ) : (
        <View style={styles.codesList}>
          {alignmentCodes.map((code: any) => (
            <View key={code.id} style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeText}>{code.code}</Text>
                <View style={[styles.tierBadge, {
                  backgroundColor:
                    code.user_type === 'admin' ? ds.colors.danger :
                    code.user_type === 'expert' ? ds.colors.warning :
                    ds.colors.success
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
    </View>
  )

  const renderTrainingSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Training Management</Text>
      <Text style={styles.subsectionDescription}>
        Manage AI training data and improve response patterns through feedback
      </Text>

      {/* Tabs for Training sections */}
      <View style={styles.trainingTabs}>
        <Pressable
          style={[styles.trainingTab, trainingTab === 'transcripts' && styles.trainingTabActive]}
          onPress={() => setTrainingTab('transcripts')}
        >
          <Text style={[styles.trainingTabText, trainingTab === 'transcripts' && styles.trainingTabTextActive]}>
            Training Transcripts
          </Text>
        </Pressable>
        <Pressable
          style={[styles.trainingTab, trainingTab === 'settings' && styles.trainingTabActive]}
          onPress={() => setTrainingTab('settings')}
        >
          <Text style={[styles.trainingTabText, trainingTab === 'settings' && styles.trainingTabTextActive]}>
            Training Settings
          </Text>
        </Pressable>
      </View>

      {/* Content based on selected tab */}
      <View style={styles.trainingContent}>
        {trainingTab === 'transcripts' ? (
          <AdminTrainingTranscripts />
        ) : (
          <AdminSettings />
        )}
      </View>
    </View>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'seo': return renderSeoSection()
      case 'content': return renderContentSection()
      case 'config': return renderConfigSection()
      case 'alignment-codes': return renderAlignmentCodesSection()
      case 'ai': return renderAISection()
      case 'chat': return renderChatSection()
      case 'training': return renderTrainingSection()
      case 'analytics': return renderAnalyticsSection()
      case 'users': return renderUsersSection()
      default: return renderSeoSection()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader activeTab="admin" />
      
      {/* Success/Error Message Toast */}
      {saveMessage && (
        <View style={[
          styles.toast,
          saveMessage.type === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Ionicons 
            name={saveMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.toastText}>{saveMessage.text}</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color={ds.colors.primary.main} />
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <Text style={styles.headerSubtitle}>Manage your BeAligned application settings</Text>
      </View>

      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {adminSections.map((section) => (
              <Pressable
                key={section.id}
                style={[
                  styles.sidebarItem,
                  activeSection === section.id && styles.sidebarItemActive
                ]}
                onPress={() => setActiveSection(section.id)}
              >
                <Ionicons 
                  name={section.icon as any} 
                  size={20} 
                  color={activeSection === section.id ? ds.colors.primary.main : ds.colors.text.secondary} 
                />
                <Text style={[
                  styles.sidebarItemText,
                  activeSection === section.id && styles.sidebarItemTextActive
                ]}>
                  {section.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          {renderActiveSection()}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
    gap: ds.spacing[3],
  },
  headerTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  headerSubtitle: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: ds.colors.background.primary,
    borderRightWidth: 1,
    borderRightColor: ds.colors.neutral[200],
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    gap: ds.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
  },
  sidebarItemActive: {
    backgroundColor: ds.colors.primary.lightest,
    borderRightWidth: 3,
    borderRightColor: ds.colors.primary.main,
  },
  sidebarItemText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  sidebarItemTextActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
  },
  mainContent: {
    flex: 1,
  },
  sectionContent: {
    padding: ds.spacing[6],
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.heading,
  },
  formGroup: {
    marginBottom: ds.spacing[4],
  },
  label: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  input: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  configInfo: {
    flex: 1,
    marginRight: ds.spacing[4],
  },
  configLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  configDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  saveButton: {
    backgroundColor: ds.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
    marginTop: ds.spacing[6],
    gap: ds.spacing[2],
    ...ds.shadows.base,
  },
  saveButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  comingSoon: {
    fontSize: ds.typography.fontSize.xl.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginTop: ds.spacing[10],
    fontFamily: ds.typography.fontFamily.heading,
  },
  comingSoonDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.tertiary,
    textAlign: 'center',
    marginTop: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  subsectionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[8],
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[3],
    marginTop: ds.spacing[3],
  },
  modelCard: {
    flex: 1,
    minWidth: 200,
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    borderWidth: 2,
    borderColor: ds.colors.neutral[200],
    backgroundColor: ds.colors.background.secondary,
  },
  modelCardActive: {
    borderColor: ds.colors.primary.main,
    backgroundColor: ds.colors.primary.lightest,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[2],
  },
  modelName: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  modelNameActive: {
    color: ds.colors.primary.main,
  },
  qualityBadge: {
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.sm,
  },
  qualityText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  modelStats: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginBottom: ds.spacing[1],
  },
  modelStat: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  modelContext: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[3],
    marginTop: ds.spacing[3],
  },
  slider: {
    flex: 1,
    height: 6,
    backgroundColor: ds.colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: ds.colors.primary.main,
  },
  helperText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    marginTop: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  toast: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: [{ translateX: -150 }],
    width: 300,
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    zIndex: 1000,
    ...ds.shadows.base,
  },
  toastSuccess: {
    backgroundColor: ds.colors.success,
  },
  toastError: {
    backgroundColor: ds.colors.danger,
  },
  toastText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: ds.spacing[3],
    marginTop: ds.spacing[6],
  },
  secondaryButton: {
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[6],
    borderRadius: ds.borderRadius.md,
    gap: ds.spacing[2],
    flex: 1,
  },
  secondaryButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  subsectionDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  radioGroup: {
    marginTop: ds.spacing[3],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    marginBottom: ds.spacing[2],
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    borderRadius: ds.borderRadius.md,
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
    marginRight: ds.spacing[3],
    marginTop: 2,
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
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  radioDescription: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  trainingTabs: {
    flexDirection: 'row',
    backgroundColor: ds.colors.background.secondary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[1],
    marginVertical: ds.spacing[4],
  },
  trainingTab: {
    flex: 1,
    paddingVertical: ds.spacing[2],
    alignItems: 'center',
    borderRadius: ds.borderRadius.sm,
  },
  trainingTabActive: {
    backgroundColor: ds.colors.background.primary,
  },
  trainingTabText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  trainingTabTextActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  trainingContent: {
    flex: 1,
  },
  createForm: {
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    marginVertical: ds.spacing[4],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  codesList: {
    gap: ds.spacing[3],
  },
  codeCard: {
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    marginBottom: ds.spacing[3],
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[2],
  },
  codeText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  tierBadge: {
    paddingHorizontal: ds.spacing[2],
    paddingVertical: ds.spacing[1],
    borderRadius: ds.borderRadius.sm,
  },
  tierText: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  codeDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.base,
  },
  codeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ds.spacing[3],
  },
  codeStat: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  deactivateButton: {
    backgroundColor: ds.colors.danger,
    paddingVertical: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    borderRadius: ds.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  deactivateButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
})
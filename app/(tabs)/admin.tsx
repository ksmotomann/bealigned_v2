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
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSEO } from '../../context/SEOContext'
import { generateSitemap } from '../../utils/sitemap'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import ds from '../../styles/design-system'
import { MODEL_INFO, AIModel, DEFAULT_AI_CONFIG } from '../../lib/aiConfig'
import { supabase } from '../../lib/supabase'
import AdminTrainingTranscripts from '../../components/AdminTrainingTranscripts'
import AdminSettings from '../../components/AdminSettings'
import CommunityManager from '../../components/admin/CommunityManager'
import AlignmentCodesPanel from '../../components/admin/AlignmentCodesPanel'
import FAQManager from '../../components/admin/FAQManager'
import WaveCircle from '../../components/WaveCircle'
import PulsatingHighlight from '../../components/PulsatingHighlight'
import RippleBackground from '../../components/RippleBackground'

export default function AdminPanel() {
  const router = useRouter()
  const { seoData: contextSeoData, updateSEOData } = useSEO()
  const [activeSection, setActiveSection] = useState('alignment-codes')
  const [localSeoData, setLocalSeoData] = useState(contextSeoData)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [appConfig, setAppConfig] = useState({
    maintenanceMode: false,
    signupEnabled: true,
    analyticsEnabled: true,
    chatbotEnabled: true,
    reflectionLimit: 10,
    requireAlignmentCode: true,
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
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userAlignmentCodes, setUserAlignmentCodes] = useState([])
  const [updatingUser, setUpdatingUser] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showUserTypeModal, setShowUserTypeModal] = useState(false)
  const [userTypeModalData, setUserTypeModalData] = useState<{userIds: string[], userName?: string} | null>(null)
  const [userStats, setUserStats] = useState({
    total: 0,
    super_admins: 0,
    admins: 0,
    experts: 0,
    users: 0,
    activeToday: 0,
    newThisWeek: 0
  })

  const [assetsTab, setAssetsTab] = useState('components')
  const [assetsSearch, setAssetsSearch] = useState('')

  // Community posts state
  const [pendingPosts, setPendingPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  const adminSections = [
    { id: 'alignment-codes', title: 'Alignment Codes', icon: 'key-outline' },
    { id: 'seo', title: 'SEO Management', icon: 'search-outline' },
    { id: 'content', title: 'Content Management', icon: 'document-text-outline' },
    { id: 'config', title: 'App Configuration', icon: 'settings-outline' },
    { id: 'ai', title: 'AI Configuration', icon: 'bulb-outline' },
    { id: 'chat', title: 'Chat Settings', icon: 'chatbubbles-outline' },
    { id: 'training', title: 'Training Management', icon: 'school-outline' },
    { id: 'community', title: 'Community Manager', icon: 'people-circle-outline' },
    { id: 'users', title: 'User Management', icon: 'people-outline' },
    { id: 'faq', title: 'FAQ Management', icon: 'help-circle-outline' },
    { id: 'assets', title: 'Assets Catalog', icon: 'cube-outline' },
  ]

  // Load system settings
  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', 'require_alignment_code')
        .single()

      if (error) throw error

      if (data && data.setting_value) {
        setAppConfig(prev => ({
          ...prev,
          requireAlignmentCode: data.setting_value.enabled ?? true
        }))
      }
    } catch (error) {
      console.error('Error loading system settings:', error)
    }
  }

  // Save system settings
  const saveSystemSettings = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: { enabled: appConfig.requireAlignmentCode },
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('setting_key', 'require_alignment_code')

      if (error) throw error

      Alert.alert('Success', 'System settings updated successfully')
    } catch (error) {
      console.error('Error saving system settings:', error)
      Alert.alert('Error', 'Failed to save system settings')
    }
  }

  // Load saved AI configuration when component mounts or section changes
  useEffect(() => {
    if (activeSection === 'ai') {
      loadAIConfig()
    } else if (activeSection === 'app') {
      loadSystemSettings()
    } else if (activeSection === 'alignment-analytics') {
      loadSystemSettings()
      loadAlignmentCodes()
    } else if (activeSection === 'users') {
      loadUsers()
    } else if (activeSection === 'community') {
      loadPendingPosts()
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

  const loadPendingPosts = async () => {
    setLoadingPosts(true)
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingPosts(data || [])
    } catch (error) {
      console.error('Error loading pending posts:', error)
      Alert.alert('Error', 'Failed to load pending posts')
    } finally {
      setLoadingPosts(false)
    }
  }

  const approvePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('community_posts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', postId)

      if (error) throw error

      Alert.alert('Success', 'Post approved and published to community')
      loadPendingPosts()
    } catch (error) {
      console.error('Error approving post:', error)
      Alert.alert('Error', 'Failed to approve post')
    }
  }

  const rejectPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ status: 'rejected' })
        .eq('id', postId)

      if (error) throw error

      Alert.alert('Success', 'Post rejected')
      loadPendingPosts()
    } catch (error) {
      console.error('Error rejecting post:', error)
      Alert.alert('Error', 'Failed to reject post')
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

  // Enhanced search and filtering functionality
  const filterUsers = (usersData, searchQuery, typeFilter) => {
    let filtered = usersData || []

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.alignment_code_used?.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(user => (user.user_type || 'user') === typeFilter)
    }

    return filtered
  }

  // User management functions
  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      console.log('🔍 Starting to load users...')

      // Load users with additional session data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          user_type,
          role,
          alignment_code_used,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      console.log('📊 Users query result:', { data, error, count: data?.length })

      if (error) {
        console.error('❌ Error loading users:', error)
        setUsers([])
        setFilteredUsers([])
        return
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} users`)
      const usersData = data || []
      setUsers(usersData)

      // Apply current filters
      const filtered = filterUsers(usersData, userSearchQuery, userTypeFilter)
      setFilteredUsers(filtered)

      // Calculate user statistics
      const stats = {
        total: usersData.length,
        super_admins: usersData.filter(u => (u.user_type || u.role) === 'super_admin').length,
        admins: usersData.filter(u => (u.user_type || u.role) === 'admin').length,
        experts: usersData.filter(u => (u.user_type || u.role) === 'expert').length,
        users: usersData.filter(u => (u.user_type || u.role || 'user') === 'user').length,
        activeToday: 0, // last_login_at column doesn't exist yet
        newThisWeek: usersData.filter(u => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return new Date(u.created_at) > weekAgo
        }).length
      }
      setUserStats(stats)

    } catch (err) {
      console.error('💥 Exception loading users:', err)
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadUserAlignmentCodes = async (userId: string) => {
    try {
      console.log('🔍 Loading detailed data for user:', userId)

      // Load alignment codes, sessions, and community posts in parallel
      const [codesResult, sessionsResult, postsResult] = await Promise.all([
        supabase
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
          .order('used_at', { ascending: false }),

        supabase
          .from('reflection_sessions')
          .select('id, created_at, updated_at, current_phase, messages_count:messages(count)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('community_posts')
          .select('id, content, status, likes, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      if (codesResult.error) {
        console.error('❌ Error loading user alignment codes:', codesResult.error)
      }

      console.log('✅ Loaded user data:', {
        codes: codesResult.data?.length || 0,
        sessions: sessionsResult.data?.length || 0,
        posts: postsResult.data?.length || 0
      })

      setUserAlignmentCodes(codesResult.data || [])
      setSelectedUser(prev => prev ? {
        ...prev,
        sessions: sessionsResult.data || [],
        posts: postsResult.data || []
      } : null)
    } catch (err) {
      console.error('💥 Exception loading user data:', err)
      setUserAlignmentCodes([])
    }
  }

  const openUserTypeModal = (userIds: string[], userName?: string) => {
    setUserTypeModalData({ userIds, userName })
    setShowUserTypeModal(true)
  }

  const closeUserTypeModal = () => {
    setShowUserTypeModal(false)
    setUserTypeModalData(null)
  }

  const updateUserType = async (userIds: string[], newUserType: string) => {
    console.log(`🔄 Updating ${userIds.length} user(s) to type: ${newUserType}`)
    setUpdatingUser(true)
    closeUserTypeModal()

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newUserType })
        .in('id', userIds)

      if (error) {
        console.error('❌ Error updating user type:', error)
        Alert.alert('Error', 'Failed to update user type: ' + error.message)
        return
      }

      console.log('✅ User type updated successfully')
      Alert.alert('Success', `User type${userIds.length > 1 ? 's' : ''} updated successfully!`)
      setSelectedUsers([]) // Clear selection after bulk update
      loadUsers() // Refresh the user list
    } catch (err) {
      console.error('💥 Exception updating user type:', err)
      Alert.alert('Error', 'Failed to update user type')
    } finally {
      setUpdatingUser(false)
    }
  }

  // Enhanced search and filter handlers
  const handleSearch = (query: string) => {
    setUserSearchQuery(query)
    const filtered = filterUsers(users, query, userTypeFilter)
    setFilteredUsers(filtered)
  }

  const handleTypeFilter = (type: string) => {
    setUserTypeFilter(type)
    const filtered = filterUsers(users, userSearchQuery, type)
    setFilteredUsers(filtered)
  }


  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id))
  }

  const clearSelection = () => {
    setSelectedUsers([])
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
          {/* User Statistics Dashboard */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.total}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.super_admins}</Text>
              <Text style={styles.statLabel}>Super Admins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.admins}</Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.experts}</Text>
              <Text style={styles.statLabel}>Experts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.users}</Text>
              <Text style={styles.statLabel}>Regular Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.activeToday}</Text>
              <Text style={styles.statLabel}>Active Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.newThisWeek}</Text>
              <Text style={styles.statLabel}>New This Week</Text>
            </View>
          </View>

          {/* Search and Filter Controls */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={ds.colors.text.secondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={userSearchQuery}
                onChangeText={handleSearch}
                placeholder="Search by name, email, or alignment code..."
                placeholderTextColor={ds.colors.text.secondary}
              />
            </View>

            <View style={styles.filterContainer}>
              {['all', 'super_admin', 'admin', 'expert', 'user'].map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.filterButton,
                    userTypeFilter === type && styles.filterButtonActive
                  ]}
                  onPress={() => handleTypeFilter(type)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    userTypeFilter === type && styles.filterButtonTextActive
                  ]}>
                    {type === 'super_admin' ? 'Super Admin' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <View style={styles.bulkActionsContainer}>
              <Text style={styles.bulkActionsText}>
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </Text>
              <View style={styles.bulkActionsButtons}>
                <Pressable
                  style={[styles.bulkActionButton, { backgroundColor: ds.colors.warning }]}
                  onPress={() => openUserTypeModal(selectedUsers)}
                >
                  <Ionicons name="settings-outline" size={16} color="white" />
                  <Text style={styles.bulkActionButtonText}>Change Type</Text>
                </Pressable>
                <Pressable style={styles.bulkActionButton} onPress={clearSelection}>
                  <Text style={styles.bulkActionButtonText}>Clear Selection</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Users List Header */}
          <View style={styles.userListHeader}>
            <View style={styles.userListHeaderLeft}>
              <Pressable
                style={styles.selectAllButton}
                onPress={selectedUsers.length === filteredUsers.length ? clearSelection : selectAllUsers}
              >
                <Ionicons
                  name={selectedUsers.length === filteredUsers.length ? "checkbox" : "square-outline"}
                  size={20}
                  color={ds.colors.primary.main}
                />
              </Pressable>
              <Text style={styles.subsectionTitle}>
                Users ({filteredUsers.length}{filteredUsers.length !== users.length ? ` of ${users.length}` : ''})
              </Text>
            </View>
            <Pressable style={styles.refreshButton} onPress={loadUsers}>
              <Ionicons name="refresh" size={20} color={ds.colors.primary.main} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          </View>

          {filteredUsers.length === 0 ? (
            <Text style={styles.comingSoonDescription}>
              {users.length === 0 ? 'No users found' : 'No users match your search criteria'}
            </Text>
          ) : (
            <View style={styles.codesContainer}>
              {filteredUsers.map((user: any) => {
                const isExpanded = selectedUser?.id === user.id

                if (isExpanded) {
                  // Show detailed view for selected user
                  return (
                    <View key={user.id} style={[styles.codeCard, styles.expandedUserCard]}>
                      {/* Header */}
                      <Pressable
                        style={styles.codeHeader}
                        onPress={() => {
                          setSelectedUser(null)
                          setUserAlignmentCodes([])
                        }}
                      >
                        <View>
                          <Text style={styles.sectionTitle}>
                            {user.first_name} {user.last_name}
                          </Text>
                          <Text style={styles.codeDescription}>{user.email}</Text>
                        </View>
                        <Ionicons name="chevron-up" size={24} color={ds.colors.text.secondary} />
                      </Pressable>

                      {/* Activity Summary */}
                      <Text style={styles.subsectionTitle}>Activity Summary</Text>
                      <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                          <Text style={styles.statNumber}>{user.sessions?.length || 0}</Text>
                          <Text style={styles.statLabel}>Sessions</Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statNumber}>{user.posts?.length || 0}</Text>
                          <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statNumber}>{userAlignmentCodes.length}</Text>
                          <Text style={styles.statLabel}>Codes Used</Text>
                        </View>
                      </View>

                      {/* Contact Information */}
                      <Text style={styles.subsectionTitle}>User Details</Text>
                      <View style={styles.userDetailsGrid}>
                        <View style={styles.userDetailItem}>
                          <Text style={styles.userDetailLabel}>User Type</Text>
                          <Text style={styles.userDetailValue}>
                            {(user.user_type || user.role) === 'super_admin' ? 'Super Admin' :
                             ((user.user_type || user.role) || 'user').toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.userDetailItem}>
                          <Text style={styles.userDetailLabel}>Alignment Code</Text>
                          <Text style={styles.userDetailValue}>{user.alignment_code_used || 'None'}</Text>
                        </View>
                        <View style={styles.userDetailItem}>
                          <Text style={styles.userDetailLabel}>Joined</Text>
                          <Text style={styles.userDetailValue}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {/* Recent Sessions */}
                      {user.sessions && user.sessions.length > 0 && (
                        <>
                          <Text style={styles.subsectionTitle}>Recent Reflection Sessions</Text>
                          <View style={styles.codesContainer}>
                            {user.sessions.map((session: any) => (
                              <View key={session.id} style={[styles.codeCard, { marginBottom: 8, padding: ds.spacing[3] }]}>
                                <View style={styles.codeHeader}>
                                  <View>
                                    <Text style={styles.codeText}>Session #{session.id.substring(0, 8)}</Text>
                                    <Text style={styles.codeDescription}>
                                      Phase: {session.current_phase || 'N/A'}
                                    </Text>
                                  </View>
                                  <Text style={styles.codeStat}>
                                    {new Date(session.created_at).toLocaleDateString()}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {/* Community Posts */}
                      {user.posts && user.posts.length > 0 && (
                        <>
                          <Text style={styles.subsectionTitle}>Community Posts</Text>
                          <View style={styles.codesContainer}>
                            {user.posts.map((post: any) => (
                              <View key={post.id} style={[styles.codeCard, { marginBottom: 8, padding: ds.spacing[3] }]}>
                                <View style={styles.codeHeader}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.codeDescription} numberOfLines={2}>
                                      {post.content}
                                    </Text>
                                  </View>
                                  <View style={[styles.tierBadge, {
                                    backgroundColor:
                                      post.status === 'approved' ? '#10B981' :
                                      post.status === 'pending' ? '#F59E0B' :
                                      '#EF4444'
                                  }]}>
                                    <Text style={styles.tierText}>{post.status.toUpperCase()}</Text>
                                  </View>
                                </View>
                                <View style={styles.codeStats}>
                                  <Text style={styles.codeStat}>
                                    ❤️ {post.likes || 0} likes
                                  </Text>
                                  <Text style={styles.codeStat}>
                                    {new Date(post.created_at).toLocaleDateString()}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {/* Alignment Code History */}
                      <Text style={styles.subsectionTitle}>Alignment Code History</Text>
                      {userAlignmentCodes.length === 0 ? (
                        <Text style={styles.comingSoonDescription}>No alignment codes used</Text>
                      ) : (
                        <View style={styles.codesContainer}>
                          {userAlignmentCodes.map((userCode: any) => (
                            <View key={userCode.id} style={[styles.codeCard, { marginBottom: 8, padding: ds.spacing[3] }]}>
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

                      {/* Actions */}
                      <View style={styles.codeActions}>
                        <Pressable
                          style={[styles.userActionButton, { backgroundColor: ds.colors.warning }]}
                          onPress={(e) => {
                            e.stopPropagation()
                            console.log('⚙️ Change Type button pressed for user:', user.id)
                            openUserTypeModal([user.id], `${user.first_name} ${user.last_name}`)
                          }}
                          disabled={updatingUser}
                        >
                          <Ionicons name="settings-outline" size={16} color="white" />
                          <Text style={styles.userActionButtonText}>
                            {updatingUser ? 'Updating...' : 'Change Type'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )
                }

                // Show basic view for non-selected users
                return (
                  <Pressable
                    key={user.id}
                    style={[
                      styles.codeCard,
                      selectedUsers.includes(user.id) && styles.selectedUserCard
                    ]}
                    onPress={() => {
                      console.log('👤 User card clicked:', user.id)
                      setSelectedUser(user)
                      loadUserAlignmentCodes(user.id)
                    }}
                  >
                    <View style={styles.userCardHeader}>
                      <Pressable
                        style={styles.userCheckbox}
                        onPress={(e) => {
                          e.stopPropagation()
                          toggleUserSelection(user.id)
                        }}
                      >
                        <Ionicons
                          name={selectedUsers.includes(user.id) ? "checkbox" : "square-outline"}
                          size={20}
                          color={ds.colors.primary.main}
                        />
                      </Pressable>
                      <View style={styles.userInfo}>
                        <View style={styles.codeHeader}>
                          <View>
                            <Text style={styles.codeText}>
                              {user.first_name} {user.last_name}
                            </Text>
                            <Text style={styles.codeDescription}>{user.email}</Text>
                          </View>
                          <View style={[styles.tierBadge, {
                            backgroundColor:
                              (user.user_type || user.role) === 'super_admin' ? '#9333EA' :
                              (user.user_type || user.role) === 'admin' ? ds.colors.danger :
                              (user.user_type || user.role) === 'expert' ? ds.colors.warning :
                              ds.colors.success
                          }]}>
                            <Text style={styles.tierText}>
                              {(user.user_type || user.role) === 'super_admin' ? 'SUPER ADMIN' : ((user.user_type || user.role) || 'user').toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.userStats}>
                          <Text style={styles.codeStat}>
                            Code: {user.alignment_code_used || 'None'}
                          </Text>
                          <Text style={styles.codeStat}>
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )}

          {/* User Type Change Modal */}
          {showUserTypeModal && userTypeModalData && (
            <View style={styles.modalOverlay}>
              <Pressable
                style={styles.modalBackdrop}
                onPress={closeUserTypeModal}
              />
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {userTypeModalData.userName
                    ? `Change User Type for ${userTypeModalData.userName}`
                    : `Change User Type for ${userTypeModalData.userIds.length} user${userTypeModalData.userIds.length > 1 ? 's' : ''}`
                  }
                </Text>
                <Text style={styles.modalSubtitle}>
                  Select the new user type:
                </Text>

                <View style={styles.userTypeButtons}>
                  <Pressable
                    style={[styles.userTypeButton, styles.userTypeButtonUser]}
                    onPress={() => updateUserType(userTypeModalData.userIds, 'user')}
                  >
                    <Ionicons name="person" size={24} color="#FFFFFF" />
                    <Text style={styles.userTypeButtonText}>User</Text>
                    <Text style={styles.userTypeButtonDesc}>Standard user access</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.userTypeButton, styles.userTypeButtonExpert]}
                    onPress={() => updateUserType(userTypeModalData.userIds, 'expert')}
                  >
                    <Ionicons name="star" size={24} color="#FFFFFF" />
                    <Text style={styles.userTypeButtonText}>Expert</Text>
                    <Text style={styles.userTypeButtonDesc}>Advanced features</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.userTypeButton, styles.userTypeButtonAdmin]}
                    onPress={() => updateUserType(userTypeModalData.userIds, 'admin')}
                  >
                    <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                    <Text style={styles.userTypeButtonText}>Admin</Text>
                    <Text style={styles.userTypeButtonDesc}>Full system access</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.userTypeButton, styles.userTypeButtonSuperAdmin]}
                    onPress={() => updateUserType(userTypeModalData.userIds, 'super_admin')}
                  >
                    <Ionicons name="planet" size={24} color="#FFFFFF" />
                    <Text style={styles.userTypeButtonText}>Super Admin</Text>
                    <Text style={styles.userTypeButtonDesc}>Maximum privileges</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.modalCancelButton}
                  onPress={closeUserTypeModal}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
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

  const renderAlignmentCodesSection = () => <AlignmentCodesPanel />

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

  const renderAssetsSection = () => {
    const tabs = [
      { id: 'components', label: 'Components', icon: 'cube' },
      { id: 'design-tokens', label: 'Design Tokens', icon: 'color-palette' },
      { id: 'typography', label: 'Typography', icon: 'text' },
      { id: 'icons', label: 'Icons', icon: 'apps' },
      { id: 'images', label: 'Images', icon: 'image' },
    ]

    const components = [
      {
        name: 'WaveCircle',
        description: 'Animated circular wave effect for visual interest',
        file: 'components/WaveCircle.tsx',
        usedIn: ['dashboard.tsx'],
        preview: <View style={{ backgroundColor: '#1a1a2e', padding: 20, borderRadius: 8 }}><WaveCircle size={100} /></View>
      },
      {
        name: 'PulsatingHighlight',
        description: 'Pulsating glow effect for emphasis',
        file: 'components/PulsatingHighlight.tsx',
        usedIn: ['dashboard.tsx'],
        preview: <View style={{ backgroundColor: '#1a1a2e', padding: 20, borderRadius: 8 }}><PulsatingHighlight size={100} color={ds.colors.primary.main} /></View>
      },
      {
        name: 'RippleBackground',
        description: 'Animated ripple wave background',
        file: 'components/RippleBackground.tsx',
        usedIn: ['Various pages'],
        preview: <View style={{ height: 150, borderRadius: 8, overflow: 'hidden' }}><RippleBackground /></View>
      },
    ]

    const renderComponents = () => (
      <View>
        {components.map((component, index) => (
          <View key={index} style={styles.assetCard}>
            <Text style={styles.assetCardTitle}>{component.name}</Text>
            <Text style={styles.assetCardDescription}>{component.description}</Text>
            <Text style={styles.assetCardMeta}>File: {component.file}</Text>
            <Text style={styles.assetCardMeta}>Used in: {component.usedIn.join(', ')}</Text>
            <View style={{ marginTop: 16 }}>{component.preview}</View>
          </View>
        ))}
      </View>
    )

    const renderDesignTokens = () => (
      <View>
        <Text style={styles.sectionSubheading}>Colors</Text>
        <View style={styles.colorGrid}>
          {Object.entries(ds.colors.primary).map(([key, value]) => (
            <View key={key} style={styles.colorSwatch}>
              <View style={[styles.colorBox, { backgroundColor: value }]} />
              <Text style={styles.colorLabel}>{key}</Text>
              <Text style={styles.colorValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    )

    const renderTypography = () => (
      <View>
        {Object.entries(ds.typography.fontSize).map(([key, value]) => (
          <View key={key} style={styles.assetCard}>
            <Text style={[styles.assetCardTitle, { fontSize: value.size }]}>{key}</Text>
            <Text style={styles.assetCardMeta}>Size: {value.size}px, Line Height: {value.lineHeight}</Text>
          </View>
        ))}
      </View>
    )

    const renderIcons = () => {
      const commonIcons = ['home', 'person', 'settings', 'menu', 'close', 'checkmark', 'heart', 'star', 'search', 'add']
      return (
        <View style={styles.iconGrid}>
          {commonIcons.map((icon) => (
            <View key={icon} style={styles.iconCard}>
              <Ionicons name={icon as any} size={32} color={ds.colors.primary.main} />
              <Text style={styles.iconLabel}>{icon}</Text>
            </View>
          ))}
        </View>
      )
    }

    const renderImages = () => (
      <View>
        <Text style={styles.assetCardDescription}>Brand assets and grounding cards are stored in /assets directory</Text>
      </View>
    )

    const renderTabContent = () => {
      switch (assetsTab) {
        case 'components': return renderComponents()
        case 'design-tokens': return renderDesignTokens()
        case 'typography': return renderTypography()
        case 'icons': return renderIcons()
        case 'images': return renderImages()
        default: return renderComponents()
      }
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assets Catalog</Text>
        <Text style={styles.sectionDescription}>Comprehensive view of all design assets, components, and resources</Text>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets..."
          value={assetsSearch}
          onChangeText={setAssetsSearch}
        />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tab, assetsTab === tab.id && styles.tabActive]}
              onPress={() => setAssetsTab(tab.id)}
            >
              <Ionicons name={tab.icon as any} size={20} color={assetsTab === tab.id ? ds.colors.primary.main : ds.colors.text.secondary} />
              <Text style={[styles.tabText, assetsTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </View>
    )
  }

  const renderCommunitySection = () => <CommunityManager />

  const renderFaqSection = () => <FAQManager />

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'alignment-codes': return renderAlignmentCodesSection()
      case 'seo': return renderSeoSection()
      case 'content': return renderContentSection()
      case 'config': return renderConfigSection()
      case 'ai': return renderAISection()
      case 'chat': return renderChatSection()
      case 'training': return renderTrainingSection()
      case 'community': return renderCommunitySection()
      case 'users': return renderUsersSection()
      case 'faq': return renderFaqSection()
      case 'assets': return renderAssetsSection()
      default: return renderSeoSection()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />
      
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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
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
  expandedUserCard: {
    backgroundColor: ds.colors.background.secondary,
    padding: ds.spacing[6],
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
  // User Management Styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[3],
    marginBottom: ds.spacing[6],
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  statNumber: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.heading,
  },
  statLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginTop: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  searchContainer: {
    marginBottom: ds.spacing[4],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    borderRadius: ds.borderRadius.md,
    paddingHorizontal: ds.spacing[3],
    marginBottom: ds.spacing[3],
  },
  searchIcon: {
    marginRight: ds.spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: ds.spacing[2],
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
    backgroundColor: ds.colors.background.primary,
  },
  filterButtonActive: {
    backgroundColor: ds.colors.primary.main,
    borderColor: ds.colors.primary.main,
  },
  filterButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  filterButtonTextActive: {
    color: ds.colors.text.inverse,
    fontWeight: ds.typography.fontWeight.medium,
  },
  bulkActionsContainer: {
    backgroundColor: ds.colors.primary.lightest,
    padding: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkActionsText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: ds.spacing[2],
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
    backgroundColor: ds.colors.primary.main,
  },
  bulkActionButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  userListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing[3],
  },
  userListHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
  },
  selectAllButton: {
    padding: ds.spacing[1],
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  refreshButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
  },
  codesContainer: {
    gap: ds.spacing[3],
  },
  selectedUserCard: {
    borderColor: ds.colors.primary.main,
    backgroundColor: ds.colors.primary.lightest,
    borderWidth: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing[3],
  },
  userCheckbox: {
    padding: ds.spacing[1],
    marginTop: ds.spacing[1],
  },
  userInfo: {
    flex: 1,
  },
  userStats: {
    flexDirection: 'column',
    gap: ds.spacing[1],
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
    paddingHorizontal: ds.spacing[3],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
    marginRight: ds.spacing[2],
  },
  userActionButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  userDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
    marginBottom: ds.spacing[4],
  },
  userDetailItem: {
    flex: 1,
    minWidth: 200,
  },
  userDetailLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  userDetailValue: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  codeActions: {
    flexDirection: 'row',
    marginTop: ds.spacing[2],
  },
  searchInput: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[3],
    fontSize: ds.typography.fontSize.base.size,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    marginVertical: ds.spacing[4],
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: ds.spacing[2],
    marginBottom: ds.spacing[4],
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.background.primary,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  tabActive: {
    backgroundColor: ds.colors.primary.lightest,
    borderColor: ds.colors.primary.main,
  },
  tabText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
  },
  tabTextActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  assetCard: {
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[3],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  assetCardTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
  },
  assetCardDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[2],
  },
  assetCardMeta: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    marginBottom: ds.spacing[1],
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[3],
    marginTop: ds.spacing[3],
  },
  colorSwatch: {
    alignItems: 'center',
    width: 100,
  },
  colorBox: {
    width: 80,
    height: 80,
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[2],
  },
  colorLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
  },
  colorValue: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[3],
  },
  iconCard: {
    alignItems: 'center',
    padding: ds.spacing[3],
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    width: 100,
  },
  iconLabel: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    marginTop: ds.spacing[2],
  },
  // Community section styles
  postsContainer: {
    gap: ds.spacing[4],
    marginTop: ds.spacing[4],
  },
  postCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[4],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
    ...ds.shadows.md,
  },
  postCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[3],
  },
  postAuthor: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
  },
  postUserInfo: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[1],
  },
  postDate: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
  },
  postContent: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    lineHeight: ds.typography.fontSize.base.lineHeight,
    marginBottom: ds.spacing[3],
  },
  postMedia: {
    marginBottom: ds.spacing[3],
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: ds.borderRadius.md,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: ds.borderRadius.md,
    backgroundColor: ds.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    marginTop: ds.spacing[2],
  },
  postActions: {
    flexDirection: 'row',
    gap: ds.spacing[3],
  },
  postActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.md,
  },
  approveButton: {
    backgroundColor: ds.colors.success.main,
  },
  rejectButton: {
    backgroundColor: ds.colors.error.main,
  },
  postActionButtonText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: ds.spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
  },
  emptyState: {
    padding: ds.spacing[8],
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.tertiary,
    marginTop: ds.spacing[3],
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    maxWidth: 500,
    width: '90%',
    ...ds.shadows.xl,
    zIndex: 1001,
  },
  modalTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[6],
    textAlign: 'center',
  },
  userTypeButtons: {
    gap: ds.spacing[3],
    marginBottom: ds.spacing[6],
  },
  userTypeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    gap: ds.spacing[2],
  },
  userTypeButtonUser: {
    backgroundColor: '#10B981',
  },
  userTypeButtonExpert: {
    backgroundColor: '#F59E0B',
  },
  userTypeButtonAdmin: {
    backgroundColor: '#EF4444',
  },
  userTypeButtonSuperAdmin: {
    backgroundColor: '#9333EA',
  },
  userTypeButtonText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.heading,
  },
  userTypeButtonDesc: {
    fontSize: ds.typography.fontSize.sm.size,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
    opacity: 0.9,
  },
  modalCancelButton: {
    backgroundColor: ds.colors.background.secondary,
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[300],
  },
  modalCancelButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
  },
})
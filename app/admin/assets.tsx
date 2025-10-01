import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import WaveCircle from '../../components/WaveCircle'
import PulsatingHighlight from '../../components/PulsatingHighlight'
import RippleBackground from '../../components/RippleBackground'
import ds from '../../styles/design-system'

type TabType = 'components' | 'design-tokens' | 'typography' | 'icons' | 'images'

export default function AdminAssetsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('components')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'components', label: 'Components', icon: 'cube' },
    { id: 'design-tokens', label: 'Design Tokens', icon: 'color-palette' },
    { id: 'typography', label: 'Typography', icon: 'text' },
    { id: 'icons', label: 'Icons', icon: 'apps' },
    { id: 'images', label: 'Images', icon: 'image' },
  ] as const

  const renderComponentsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Visual Effect Components</Text>

      {/* WaveCircle */}
      <View style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <Text style={styles.assetName}>WaveCircle</Text>
          <Text style={styles.assetPath}>components/WaveCircle.tsx</Text>
        </View>
        <Text style={styles.assetDescription}>
          Circular wave animation component with concentric ripple effects
        </Text>
        <View style={styles.previewContainer}>
          <View style={styles.previewLabel}>
            <Text style={styles.previewLabelText}>Live Preview:</Text>
          </View>
          <WaveCircle
            size={60}
            color={ds.colors.primary.main}
            waveColor={`${ds.colors.primary.main}30`}
            waveCount={3}
            duration={2500}
          >
            <View style={styles.previewContent}>
              <Ionicons name="heart" size={24} color={ds.colors.text.inverse} />
            </View>
          </WaveCircle>
        </View>
        <View style={styles.usageSection}>
          <Text style={styles.usageTitle}>Used in:</Text>
          <Text style={styles.usageText}>• app/(tabs)/dashboard.tsx (Stats circle)</Text>
        </View>
        <View style={styles.propsSection}>
          <Text style={styles.propsTitle}>Props:</Text>
          <Text style={styles.propsText}>• size: number (60)</Text>
          <Text style={styles.propsText}>• color: string</Text>
          <Text style={styles.propsText}>• waveColor: string</Text>
          <Text style={styles.propsText}>• waveCount: number (3)</Text>
          <Text style={styles.propsText}>• duration: number (2500ms)</Text>
        </View>
      </View>

      {/* PulsatingHighlight */}
      <View style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <Text style={styles.assetName}>PulsatingHighlight</Text>
          <Text style={styles.assetPath}>components/PulsatingHighlight.tsx</Text>
        </View>
        <Text style={styles.assetDescription}>
          Pulsating ring effect that expands outward from content
        </Text>
        <View style={styles.previewContainer}>
          <View style={styles.previewLabel}>
            <Text style={styles.previewLabelText}>Live Preview:</Text>
          </View>
          <PulsatingHighlight
            color="rgba(0,150,255,0.3)"
            ringCount={3}
            scale={1.4}
            duration={6000}
          >
            <View style={styles.highlightPreview}>
              <Text style={styles.highlightText}>Your Core Value</Text>
            </View>
          </PulsatingHighlight>
        </View>
        <View style={styles.usageSection}>
          <Text style={styles.usageTitle}>Used in:</Text>
          <Text style={styles.usageText}>• app/(tabs)/dashboard.tsx (Your Core Why section)</Text>
        </View>
        <View style={styles.propsSection}>
          <Text style={styles.propsTitle}>Props:</Text>
          <Text style={styles.propsText}>• color: string (rgba)</Text>
          <Text style={styles.propsText}>• ringCount: number (3)</Text>
          <Text style={styles.propsText}>• scale: number (1.4)</Text>
          <Text style={styles.propsText}>• duration: number (6000ms)</Text>
        </View>
      </View>

      {/* RippleBackground */}
      <View style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <Text style={styles.assetName}>RippleBackground</Text>
          <Text style={styles.assetPath}>components/RippleBackground.tsx</Text>
        </View>
        <Text style={styles.assetDescription}>
          Animated ripple background with wave propagation effects
        </Text>
        <View style={styles.previewContainer}>
          <View style={styles.previewLabel}>
            <Text style={styles.previewLabelText}>Live Preview:</Text>
          </View>
          <RippleBackground
            style={styles.ripplePreview}
            backgroundColor="#F9FAFB"
            rippleColor="rgba(94, 195, 234, 0.25)"
            amplitude={4}
            wavelength={80}
            propagationSpeed={100}
            spawnInterval={2000}
            maxRipples={5}
          >
            <Text style={styles.rippleText}>BeH2O Section</Text>
          </RippleBackground>
        </View>
        <View style={styles.usageSection}>
          <Text style={styles.usageTitle}>Used in:</Text>
          <Text style={styles.usageText}>• app/(marketing)/index.tsx (BeH2O section)</Text>
        </View>
        <View style={styles.propsSection}>
          <Text style={styles.propsTitle}>Props:</Text>
          <Text style={styles.propsText}>• backgroundColor: string</Text>
          <Text style={styles.propsText}>• rippleColor: string (rgba)</Text>
          <Text style={styles.propsText}>• amplitude: number (4)</Text>
          <Text style={styles.propsText}>• wavelength: number (80)</Text>
          <Text style={styles.propsText}>• propagationSpeed: number (100)</Text>
          <Text style={styles.propsText}>• spawnInterval: number (2000ms)</Text>
          <Text style={styles.propsText}>• maxRipples: number (5)</Text>
        </View>
      </View>
    </View>
  )

  const renderDesignTokensSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Color Palette</Text>

      {/* Primary Colors */}
      <View style={styles.tokenGroup}>
        <Text style={styles.tokenGroupTitle}>Primary Colors</Text>
        <View style={styles.colorGrid}>
          {Object.entries(ds.colors.primary).map(([key, value]) => (
            <View key={key} style={styles.colorCard}>
              <View style={[styles.colorSwatch, { backgroundColor: value }]} />
              <Text style={styles.colorName}>primary.{key}</Text>
              <Text style={styles.colorValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Background Colors */}
      <View style={styles.tokenGroup}>
        <Text style={styles.tokenGroupTitle}>Background Colors</Text>
        <View style={styles.colorGrid}>
          {Object.entries(ds.colors.background).map(([key, value]) => (
            <View key={key} style={styles.colorCard}>
              <View style={[styles.colorSwatch, { backgroundColor: value }]} />
              <Text style={styles.colorName}>background.{key}</Text>
              <Text style={styles.colorValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Text Colors */}
      <View style={styles.tokenGroup}>
        <Text style={styles.tokenGroupTitle}>Text Colors</Text>
        <View style={styles.colorGrid}>
          {Object.entries(ds.colors.text).map(([key, value]) => (
            <View key={key} style={styles.colorCard}>
              <View style={[styles.colorSwatch, { backgroundColor: value }]} />
              <Text style={styles.colorName}>text.{key}</Text>
              <Text style={styles.colorValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Spacing */}
      <Text style={styles.sectionTitle}>Spacing Scale</Text>
      <View style={styles.tokenGroup}>
        <View style={styles.spacingGrid}>
          {Object.entries(ds.spacing).map(([key, value]) => (
            <View key={key} style={styles.spacingCard}>
              <View style={styles.spacingVisual}>
                <View style={[styles.spacingBox, { width: value, height: value }]} />
              </View>
              <Text style={styles.spacingLabel}>spacing[{key}]</Text>
              <Text style={styles.spacingValue}>{value}px</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Shadows */}
      <Text style={styles.sectionTitle}>Shadow Styles</Text>
      <View style={styles.tokenGroup}>
        <View style={styles.shadowGrid}>
          {Object.entries(ds.shadows).map(([key, value]) => (
            <View key={key} style={styles.shadowCard}>
              <View style={[styles.shadowPreview, value]} />
              <Text style={styles.shadowLabel}>shadows.{key}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )

  const renderTypographySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Typography System</Text>

      {/* Font Families */}
      <View style={styles.tokenGroup}>
        <Text style={styles.tokenGroupTitle}>Font Families</Text>
        <View style={styles.fontCard}>
          <Text style={[styles.fontSample, { fontFamily: ds.typography.fontFamily.base }]}>
            System Base Font
          </Text>
          <Text style={styles.fontLabel}>fontFamily.base</Text>
          <Text style={styles.fontValue}>{ds.typography.fontFamily.base}</Text>
        </View>
        <View style={styles.fontCard}>
          <Text style={[styles.fontSample, { fontFamily: ds.typography.fontFamily.heading }]}>
            System Heading Font
          </Text>
          <Text style={styles.fontLabel}>fontFamily.heading</Text>
          <Text style={styles.fontValue}>{ds.typography.fontFamily.heading}</Text>
        </View>
      </View>

      {/* Font Sizes */}
      <View style={styles.tokenGroup}>
        <Text style={styles.tokenGroupTitle}>Font Sizes</Text>
        {Object.entries(ds.typography.fontSize).map(([key, value]: [string, any]) => (
          <View key={key} style={styles.fontSizeCard}>
            <Text style={[styles.fontSizeSample, { fontSize: value.size }]}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <View style={styles.fontSizeInfo}>
              <Text style={styles.fontSizeLabel}>fontSize.{key}</Text>
              <Text style={styles.fontSizeValue}>
                {value.size}px / {value.lineHeight}px line-height
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Font Weights */}
      <View style={styles.tokenGroup}>
        <Text style={styles.tokenGroupTitle}>Font Weights</Text>
        {Object.entries(ds.typography.fontWeight).map(([key, value]) => (
          <View key={key} style={styles.fontWeightCard}>
            <Text style={[styles.fontWeightSample, { fontWeight: value as any }]}>
              Font Weight Sample Text
            </Text>
            <Text style={styles.fontWeightLabel}>fontWeight.{key}</Text>
            <Text style={styles.fontWeightValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  )

  const renderIconsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Icon Library (Ionicons)</Text>
      <Text style={styles.sectionDescription}>
        Commonly used icons throughout the application
      </Text>

      <View style={styles.iconGrid}>
        {[
          { name: 'heart', usage: 'Your Core Why, favorites' },
          { name: 'play', usage: 'Start reflection' },
          { name: 'refresh', usage: 'Continue reflection' },
          { name: 'document-text', usage: 'Reflections, proof' },
          { name: 'leaf', usage: 'Weekly grounding' },
          { name: 'checkmark-circle', usage: 'Success, completed' },
          { name: 'star', usage: 'Feedback, ratings' },
          { name: 'share-outline', usage: 'Share content' },
          { name: 'download', usage: 'Download summaries' },
          { name: 'logo-twitter', usage: 'Social media' },
          { name: 'logo-facebook', usage: 'Social media' },
          { name: 'logo-linkedin', usage: 'Social media' },
          { name: 'logo-instagram', usage: 'Social media' },
          { name: 'warning', usage: 'Disclaimers' },
          { name: 'library', usage: 'Resource library' },
          { name: 'mic', usage: 'Founder soundbites' },
          { name: 'people', usage: 'Community' },
          { name: 'eye', usage: 'View reflections' },
          { name: 'chevron-forward', usage: 'Navigation' },
          { name: 'close', usage: 'Close modals' },
        ].map((icon) => (
          <View key={icon.name} style={styles.iconCard}>
            <Ionicons name={icon.name as any} size={32} color={ds.colors.primary.main} />
            <Text style={styles.iconName}>{icon.name}</Text>
            <Text style={styles.iconUsage}>{icon.usage}</Text>
          </View>
        ))}
      </View>
    </View>
  )

  const renderImagesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Image Assets</Text>

      <View style={styles.imageGroup}>
        <Text style={styles.imageGroupTitle}>Brand Assets</Text>
        <View style={styles.imageList}>
          <View style={styles.imageItem}>
            <Text style={styles.imageName}>be_logo.png</Text>
            <Text style={styles.imagePath}>assets/be_logo.png</Text>
            <Text style={styles.imageUsage}>Logo in dashboard, navigation</Text>
          </View>
          <View style={styles.imageItem}>
            <Text style={styles.imageName}>bealigned_logo.avif</Text>
            <Text style={styles.imagePath}>assets/bealigned_logo.avif</Text>
            <Text style={styles.imageUsage}>Footer logo</Text>
          </View>
          <View style={styles.imageItem}>
            <Text style={styles.imageName}>be_h20_logo.webp</Text>
            <Text style={styles.imagePath}>assets/be_h20_logo.webp</Text>
            <Text style={styles.imageUsage}>BeH2O section in marketing</Text>
          </View>
        </View>
      </View>

      <View style={styles.imageGroup}>
        <Text style={styles.imageGroupTitle}>Weekly Grounding Cards</Text>
        <Text style={styles.imageDescription}>12 weekly grounding images (WK1-WK12)</Text>
        <View style={styles.imageList}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
            <View key={week} style={styles.imageItem}>
              <Text style={styles.imageName}>WK{week}.png</Text>
              <Text style={styles.imagePath}>assets/grounding/WK{week}.png</Text>
              <Text style={styles.imageUsage}>Week {week} grounding card in dashboard</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.imageGroup}>
        <Text style={styles.imageGroupTitle}>Public Images</Text>
        <View style={styles.imageList}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
            <View key={week} style={styles.imageItem}>
              <Text style={styles.imageName}>be_grounding_wk{week}.png</Text>
              <Text style={styles.imagePath}>public/images/be_grounding_wk{week}.png</Text>
              <Text style={styles.imageUsage}>Social media sharing, Week {week}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={ds.colors.primary.main} />
        </Pressable>
        <Text style={styles.title}>Asset Catalog</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={ds.colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={ds.colors.text.tertiary}
        />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? ds.colors.primary.main : ds.colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'components' && renderComponentsSection()}
        {activeTab === 'design-tokens' && renderDesignTokensSection()}
        {activeTab === 'typography' && renderTypographySection()}
        {activeTab === 'icons' && renderIconsSection()}
        {activeTab === 'images' && renderImagesSection()}
      </ScrollView>
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
  },
  backButton: {
    marginRight: ds.spacing[3],
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.background.primary,
    marginHorizontal: ds.spacing[6],
    marginVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    borderRadius: ds.borderRadius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: ds.spacing[2],
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
  },
  tabsContainer: {
    flexGrow: 0,
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: ds.colors.primary.main,
  },
  tabText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  tabTextActive: {
    color: ds.colors.primary.main,
  },
  content: {
    flex: 1,
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
  },
  section: {
    marginBottom: ds.spacing[8],
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  sectionDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  assetCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[4],
    ...ds.shadows.base,
  },
  assetHeader: {
    marginBottom: ds.spacing[3],
  },
  assetName: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  assetPath: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    fontFamily: 'monospace',
    marginTop: ds.spacing[1],
  },
  assetDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
    lineHeight: ds.typography.fontSize.base.lineHeight + 4,
  },
  previewContainer: {
    backgroundColor: ds.colors.neutral[50],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[4],
    alignItems: 'center',
  },
  previewLabel: {
    marginBottom: ds.spacing[3],
  },
  previewLabelText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  previewContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightPreview: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.lg,
  },
  highlightText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  ripplePreview: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ds.borderRadius.md,
  },
  rippleText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
  },
  usageSection: {
    marginBottom: ds.spacing[4],
  },
  usageTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  usageText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: ds.typography.fontSize.sm.lineHeight + 4,
  },
  propsSection: {
    backgroundColor: ds.colors.neutral[50],
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
  },
  propsTitle: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  propsText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: ds.typography.fontSize.sm.lineHeight + 4,
  },
  tokenGroup: {
    marginBottom: ds.spacing[6],
  },
  tokenGroupTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
  },
  colorCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
    alignItems: 'center',
    width: 120,
    ...ds.shadows.sm,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[2],
    borderWidth: 1,
    borderColor: ds.colors.neutral[200],
  },
  colorName: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
    fontFamily: 'monospace',
  },
  colorValue: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  spacingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
  },
  spacingCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
    alignItems: 'center',
    width: 100,
    ...ds.shadows.sm,
  },
  spacingVisual: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[2],
  },
  spacingBox: {
    backgroundColor: ds.colors.primary.main,
    borderRadius: ds.borderRadius.sm,
  },
  spacingLabel: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[1],
    fontFamily: 'monospace',
  },
  spacingValue: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  shadowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
  },
  shadowCard: {
    alignItems: 'center',
    width: 120,
  },
  shadowPreview: {
    width: 80,
    height: 80,
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[2],
  },
  shadowLabel: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: 'monospace',
  },
  fontCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[4],
    ...ds.shadows.sm,
  },
  fontSample: {
    fontSize: ds.typography.fontSize.xl.size,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
  },
  fontLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: ds.spacing[1],
  },
  fontValue: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  fontSizeCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[3],
    ...ds.shadows.sm,
  },
  fontSizeSample: {
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
  },
  fontSizeInfo: {
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral[200],
    paddingTop: ds.spacing[2],
  },
  fontSizeLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: ds.spacing[1],
  },
  fontSizeValue: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  fontWeightCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
    marginBottom: ds.spacing[3],
    ...ds.shadows.sm,
  },
  fontWeightSample: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
  },
  fontWeightLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: ds.spacing[1],
  },
  fontWeightValue: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing[4],
  },
  iconCard: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
    alignItems: 'center',
    width: 140,
    ...ds.shadows.sm,
  },
  iconName: {
    fontSize: ds.typography.fontSize.xs.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[2],
    marginBottom: ds.spacing[1],
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  iconUsage: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
  },
  imageGroup: {
    marginBottom: ds.spacing[6],
  },
  imageGroupTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  imageDescription: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  imageList: {
    gap: ds.spacing[3],
  },
  imageItem: {
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.md,
    padding: ds.spacing[4],
    ...ds.shadows.sm,
  },
  imageName: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: ds.spacing[1],
  },
  imagePath: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    fontFamily: 'monospace',
    marginBottom: ds.spacing[2],
  },
  imageUsage: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
})

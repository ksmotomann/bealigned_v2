import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { Key, TrendingUp } from 'lucide-react-native'
import AlignmentCodesPanel from './AlignmentCodesPanel'
import AnalyticsPanel from './AnalyticsPanel'
import ds from '../../styles/design-system'

type TabType = 'codes' | 'analytics'

export default function AlignmentAnalyticsManager() {
  const [activeTab, setActiveTab] = useState<TabType>('codes')

  const tabs = [
    { id: 'codes' as TabType, label: 'Codes', icon: Key },
    { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alignment Codes</Text>
        <Text style={styles.subtitle}>
          Manage alignment codes and view analytics
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                size={20}
                color={isActive ? ds.colors.primary.main : ds.colors.text.secondary}
                strokeWidth={2}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'codes' && <AlignmentCodesPanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.secondary,
  },
  header: {
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 2,
    borderBottomColor: ds.colors.neutral[200],
    paddingHorizontal: ds.spacing[6],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[4],
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: ds.colors.primary.main,
  },
  tabLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
  },
  tabLabelActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
    padding: ds.spacing[6],
  },
})

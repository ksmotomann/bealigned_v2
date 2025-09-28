import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import AdminTrainingTranscripts from '../../components/AdminTrainingTranscripts'
import AdminSettings from '../../components/AdminSettings'

export default function AdminTraining() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'transcripts' | 'settings'>('transcripts')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.title}>Training Management</Text>
        <Pressable 
          style={styles.homeButton}
          onPress={() => router.replace('/(admin)')}
        >
          <Ionicons name="home-outline" size={24} color="#1F2937" />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'transcripts' && styles.activeTab]}
          onPress={() => setActiveTab('transcripts')}
        >
          <Text style={[styles.tabText, activeTab === 'transcripts' && styles.activeTabText]}>
            Training Transcripts
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Training Settings
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {activeTab === 'transcripts' ? (
          <AdminTrainingTranscripts />
        ) : (
          <ScrollView style={styles.settingsContainer}>
            <AdminSettings />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  homeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
})
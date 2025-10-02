import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import PrivacyPolicy from '../../components/PrivacyPolicy'
import ds from '../../styles/design-system'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />
      <PrivacyPolicy />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
})
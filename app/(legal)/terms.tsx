import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import TermsAndConditions from '../../components/TermsAndConditions'
import ds from '../../styles/design-system'

export default function TermsPage() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader onLogoPress={() => router.push('/dashboard')} />
      <TermsAndConditions />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
})
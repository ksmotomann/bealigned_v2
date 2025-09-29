import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import PrivacyPolicy from '../../components/PrivacyPolicy'
import ds from '../../styles/design-system'

export default function PrivacyPage() {
  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader />
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
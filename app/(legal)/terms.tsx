import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import InAppNavigationHeader from '../../components/InAppNavigationHeader'
import TermsAndConditions from '../../components/TermsAndConditions'
import ds from '../../styles/design-system'

export default function TermsPage() {
  return (
    <SafeAreaView style={styles.container}>
      <InAppNavigationHeader />
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
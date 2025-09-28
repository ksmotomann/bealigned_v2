import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'

export default function Terms() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.date}>Last updated: {new Date().toLocaleDateString()}</Text>
          
          <Text style={styles.heading}>Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using BeAligned, you agree to be bound by these Terms of Service 
            and all applicable laws and regulations.
          </Text>
          
          <Text style={styles.heading}>Use of Service</Text>
          <Text style={styles.text}>
            BeAligned provides educational guidance for conflict resolution. It is not a substitute 
            for professional therapy, legal advice, or medical treatment.
          </Text>
          
          <Text style={styles.heading}>User Responsibilities</Text>
          <Text style={styles.text}>
            You are responsible for maintaining the confidentiality of your account and for all 
            activities that occur under your account.
          </Text>
          
          <Link href="/(marketing)" style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to Home</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 40, maxWidth: 800, alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#1F2937' },
  date: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
  heading: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1F2937' },
  text: { fontSize: 16, lineHeight: 24, color: '#4B5563', marginBottom: 16 },
  backLink: { marginTop: 32 },
  backLinkText: { color: '#7C3AED', fontSize: 16 },
})
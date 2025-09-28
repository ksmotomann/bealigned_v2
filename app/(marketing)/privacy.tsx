import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'

export default function Privacy() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.date}>Last updated: {new Date().toLocaleDateString()}</Text>
          
          <Text style={styles.heading}>Information We Collect</Text>
          <Text style={styles.text}>
            We collect information you provide directly to us, such as when you create an account, 
            use our services, or contact us for support.
          </Text>
          
          <Text style={styles.heading}>How We Use Your Information</Text>
          <Text style={styles.text}>
            We use the information we collect to provide, maintain, and improve our services, 
            and to communicate with you about your account and our services.
          </Text>
          
          <Text style={styles.heading}>Data Security</Text>
          <Text style={styles.text}>
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction.
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
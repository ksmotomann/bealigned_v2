import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Welcome() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.first_name) {
        setFirstName(user.user_metadata.first_name)
      }
    })
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="water-outline" size={48} color="#7C3AED" />
            </View>
          </View>

          <Text style={styles.greeting}>
            Welcome{firstName ? `, ${firstName}` : ''} 🌊
          </Text>
          
          <Text style={styles.title}>
            You've taken a powerful first step
          </Text>

          <Text style={styles.body}>
            BeAligned is more than an app — it's your companion in transforming conflict into clarity, 
            reaction into reflection, and tension into understanding.
          </Text>

          <View style={styles.principlesContainer}>
            <Text style={styles.sectionTitle}>Your Journey Ahead</Text>
            
            <View style={styles.principle}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#7C3AED" />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>Strength & Stability</Text>
                <Text style={styles.principleDescription}>
                  Like beryllium in water, you'll learn to communicate with grounded purpose and clarity
                </Text>
              </View>
            </View>

            <View style={styles.principle}>
              <Ionicons name="git-branch-outline" size={24} color="#7C3AED" />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>Reflection Before Reaction</Text>
                <Text style={styles.principleDescription}>
                  Our 7-step process helps you pause, explore what's beneath the surface, and respond with intention
                </Text>
              </View>
            </View>

            <View style={styles.principle}>
              <Ionicons name="heart-outline" size={24} color="#7C3AED" />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>Purpose Over Position</Text>
                <Text style={styles.principleDescription}>
                  Move beyond arguing over "what" to understanding "why" — aligning around what truly matters
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.quoteContainer}>
            <Text style={styles.quote}>
              "BeAligned is not about being perfect — it's about being intentional"
            </Text>
          </View>

          <Text style={styles.readyText}>
            Ready to begin your first reflection?
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
            <Text style={styles.primaryButtonText}>Enter BeAligned</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/dashboard')}
          >
            <Text style={styles.secondaryButtonText}>Learn More About BeH2O</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
  },
  principlesContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  principle: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  principleText: {
    flex: 1,
    marginLeft: 16,
  },
  principleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  principleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  quoteContainer: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#4B5563',
    lineHeight: 24,
    textAlign: 'center',
  },
  readyText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },
})
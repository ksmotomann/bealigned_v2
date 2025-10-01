import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Heart, Pause, Target, ArrowRight } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'
import SEOHead from '../../components/SEOHead'

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="welcome" />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/be_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to BeAligned™</Text>
        <Text style={styles.subtitle}>You've taken a powerful first step.</Text>
        <Text style={styles.description}>
          BeAligned™ is more than an app — it's your companion in turning conflict into clarity,
          reaction into reflection, and disconnection into understanding.
        </Text>

        {/* Your Journey Ahead */}
        <Text style={styles.sectionTitle}>Your Journey Ahead</Text>

        <View style={styles.cardsContainer}>
          {/* Strength & Stability Card */}
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Heart size={24} color={ds.colors.primary.main} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Strength & Stability</Text>
            <Text style={styles.cardDescription}>
              Strength isn't force. It's grounded presence — steady, intentional, and rooted in clarity.
            </Text>
          </View>

          {/* Reflection Before Reaction Card */}
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Pause size={24} color={ds.colors.primary.main} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Reflection Before Reaction</Text>
            <Text style={styles.cardDescription}>
              Our 7-step process helps you pause, look deeper, and respond with intention.
            </Text>
          </View>

          {/* Purpose Over Position Card */}
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Target size={24} color={ds.colors.primary.main} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>Purpose Over Position</Text>
            <Text style={styles.cardDescription}>
              It's not about being right — it's about getting right — staying anchored in your why.
            </Text>
          </View>
        </View>

        {/* Quote Box */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            BeAligned™ isn't about perfection. It's about intention.
          </Text>
          <Text style={styles.quoteText}>Once your values align, your next step is clear.</Text>
          <Text style={styles.quoteTagline}>Be Strong. Be Grounded. BeAligned™</Text>
        </View>

        {/* CTA Button */}
        <Pressable style={styles.ctaButton} onPress={() => router.replace('/(tabs)/dashboard')}>
          <Text style={styles.ctaButtonText}>Begin your first reflection</Text>
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Light blue background like in the design
  },
  content: {
    paddingVertical: ds.spacing[16],
    paddingHorizontal: ds.spacing[10],
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing[6],
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.base.size,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  description: {
    fontSize: ds.typography.fontSize.sm.size,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: ds.spacing[8],
    lineHeight: ds.typography.fontSize.sm.lineHeight * 1.5,
    fontFamily: ds.typography.fontFamily.base,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.heading,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: ds.spacing[4],
    marginBottom: ds.spacing[8],
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[5],
    width: '30%',
    minWidth: 160,
    alignItems: 'center',
    ...ds.shadows.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[3],
  },
  cardTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  cardDescription: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.xs.lineHeight * 1.5,
    fontFamily: ds.typography.fontFamily.base,
  },
  quoteBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: ds.borderRadius.xl,
    padding: ds.spacing[6],
    marginBottom: ds.spacing[8],
    ...ds.shadows.md,
  },
  quoteText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  quoteTagline: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.primary.main,
    textAlign: 'center',
    marginTop: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  ctaButton: {
    backgroundColor: ds.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[8],
    borderRadius: ds.borderRadius.lg,
    ...ds.shadows.lg,
  },
  ctaButtonText: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#FFFFFF',
    fontFamily: ds.typography.fontFamily.base,
  },
})
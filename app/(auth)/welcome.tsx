import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
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

      {/* Navigation Header */}
      <NavigationHeader />

      {/* Main Content with Animated Wave Background */}
      <AnimatedWaveHero style={styles.hero}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="water-outline" size={48} color={ds.colors.primary.main} />
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
              <Ionicons name="shield-checkmark-outline" size={24} color={ds.colors.text.inverse} />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>Strength & Stability</Text>
                <Text style={styles.principleDescription}>
                  Like beryllium in water, you'll learn to communicate with grounded purpose and clarity
                </Text>
              </View>
            </View>

            <View style={styles.principle}>
              <Ionicons name="git-branch-outline" size={24} color={ds.colors.text.inverse} />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>Reflection Before Reaction</Text>
                <Text style={styles.principleDescription}>
                  Our 7-step process helps you pause, explore what's beneath the surface, and respond with intention
                </Text>
              </View>
            </View>

            <View style={styles.principle}>
              <Ionicons name="heart-outline" size={24} color={ds.colors.text.inverse} />
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
            <Ionicons name="arrow-forward" size={20} color={ds.colors.text.inverse} />
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/dashboard')}
          >
            <Text style={styles.secondaryButtonText}>Learn More About BeH2O</Text>
          </Pressable>
        </View>
      </AnimatedWaveHero>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require('../../assets/bealigned_logo.avif')}
          style={styles.footerLogoImage}
          resizeMode="contain"
        />

        <View style={styles.footerLinks}>
          <Pressable onPress={() => router.push('/(marketing)')}>
            <Text style={styles.footerLink}>Home</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/our-story')}>
            <Text style={styles.footerLink}>Our Story</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/faq')}>
            <Text style={styles.footerLink}>FAQ</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/contact')}>
            <Text style={styles.footerLink}>Contact</Text>
          </Pressable>
        </View>

        <Text style={styles.footerDisclaimer}>
          © 2025 BeAligned • BeH2O® is a registered trademark{'\n'}
          BeAligned provides educational guidance and is not a substitute for professional therapy or legal advice
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  hero: {
    paddingVertical: ds.spacing[20],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
    minHeight: 600,
  },
  content: {
    paddingHorizontal: ds.spacing[6],
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing[6],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ds.colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  title: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  body: {
    fontSize: ds.typography.fontSize.lg.size,
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[8],
    opacity: 0.95,
    fontFamily: ds.typography.fontFamily.base,
  },
  principlesContainer: {
    marginBottom: ds.spacing[8],
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    marginBottom: ds.spacing[5],
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.heading,
  },
  principle: {
    flexDirection: 'row',
    marginBottom: ds.spacing[6],
    alignItems: 'flex-start',
  },
  principleText: {
    flex: 1,
    marginLeft: ds.spacing[4],
  },
  principleTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.heading,
  },
  principleDescription: {
    fontSize: ds.typography.fontSize.base.size,
    lineHeight: ds.typography.fontSize.base.lineHeight,
    color: ds.colors.text.inverse,
    opacity: 0.9,
    fontFamily: ds.typography.fontFamily.base,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: ds.spacing[5],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[6],
    borderLeftWidth: 3,
    borderLeftColor: ds.colors.text.inverse,
  },
  quote: {
    fontSize: ds.typography.fontSize.lg.size,
    fontStyle: 'italic',
    color: ds.colors.text.inverse,
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  readyText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[5],
    opacity: 0.95,
    fontFamily: ds.typography.fontFamily.base,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[8],
    borderRadius: ds.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[3],
    ...ds.shadows.lg,
  },
  primaryButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    marginRight: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButton: {
    paddingVertical: ds.spacing[3],
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    opacity: 0.9,
    fontFamily: ds.typography.fontFamily.base,
  },
  footer: {
    backgroundColor: ds.colors.neutral[800],
    paddingVertical: ds.spacing[10],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
  },
  footerLogoImage: {
    width: 120,
    height: 32,
    marginBottom: 24,
    tintColor: '#FFFFFF',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerLink: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.neutral[300],
    fontFamily: ds.typography.fontFamily.base,
  },
  footerDivider: {
    color: '#666666',
    marginHorizontal: 12,
    fontFamily: ds.typography.fontFamily.base,
  },
  footerDisclaimer: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.neutral[400],
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.xs.lineHeight + 2,
    fontFamily: ds.typography.fontFamily.base,
  },
})
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import ds from '../../../styles/design-system'
import NavigationHeader from '../../../components/NavigationHeader'
import SEOHead from '../../../components/SEOHead'

export default function GroundingWeekPage() {
  const router = useRouter()
  const { week } = useLocalSearchParams<{ week: string }>()
  const weekNumber = parseInt(week || '1', 10)
  const [imageError, setImageError] = useState(false)

  // Validate week number
  const isValidWeek = weekNumber >= 1 && weekNumber <= 12

  // Set Open Graph meta tags for web
  useEffect(() => {
    if (Platform.OS === 'web' && isValidWeek) {
      const baseUrl = window.location.origin
      const imageUrl = `${baseUrl}/images/grounding/be_grounding_wk${weekNumber}.png`
      const pageUrl = `${baseUrl}/grounding/${weekNumber}`

      // Set page title
      document.title = `Week ${weekNumber} Grounding - BeAligned™`

      // Create or update meta tags
      const setMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('property', property)
          document.head.appendChild(meta)
        }
        meta.content = content
      }

      // Open Graph tags
      setMetaTag('og:title', `Week ${weekNumber} Grounding from BeAligned™`)
      setMetaTag('og:description', 'Be grounded. Be clear. BeAligned.™ - Your weekly reflection card for mindful co-parenting.')
      setMetaTag('og:image', imageUrl)
      setMetaTag('og:image:width', '1200')
      setMetaTag('og:image:height', '630')
      setMetaTag('og:url', pageUrl)
      setMetaTag('og:type', 'website')

      // Twitter Card tags
      setMetaTag('twitter:card', 'summary_large_image')
      setMetaTag('twitter:title', `Week ${weekNumber} Grounding from BeAligned™`)
      setMetaTag('twitter:description', 'Be grounded. Be clear. BeAligned.™')
      setMetaTag('twitter:image', imageUrl)
    }
  }, [weekNumber, isValidWeek])

  if (!isValidWeek) {
    return (
      <ScrollView style={styles.container}>
        <SEOHead page="grounding" />
        <NavigationHeader activeLink="" />

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Invalid Week Number</Text>
          <Text style={styles.errorText}>
            Please select a week between 1 and 12.
          </Text>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push('/(marketing)')}
          >
            <Text style={styles.ctaButtonText}>Return Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  // Get image source
  const getImageSource = () => {
    const imageMapping: { [key: number]: any } = {
      1: require('../../../assets/grounding/WK1.png'),
      2: require('../../../assets/grounding/WK2.png'),
      3: require('../../../assets/grounding/WK3.png'),
      4: require('../../../assets/grounding/WK4.png'),
      5: require('../../../assets/grounding/WK5.png'),
      6: require('../../../assets/grounding/WK6.png'),
      7: require('../../../assets/grounding/WK7.png'),
      8: require('../../../assets/grounding/WK8.png'),
      9: require('../../../assets/grounding/WK9.png'),
      10: require('../../../assets/grounding/WK10.png'),
      11: require('../../../assets/grounding/WK11.png'),
      12: require('../../../assets/grounding/WK12.png'),
    }

    return imageMapping[weekNumber] || imageMapping[1]
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="grounding" />

      {/* Navigation Header */}
      <NavigationHeader activeLink="" />

      {/* Main Content */}
      <View style={styles.section}>
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>Weekly Grounding</Text>
        </View>

        <Text style={styles.weekTitle}>Week {weekNumber}</Text>
        <Text style={styles.subtitle}>
          Be grounded. Be clear. BeAligned.™
        </Text>

        {/* Grounding Card Image */}
        <View style={styles.imageContainer}>
          {!imageError ? (
            <Image
              source={getImageSource()}
              style={styles.groundingImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>
                Week {weekNumber} Grounding Card
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>About Weekly Grounding</Text>
          <Text style={styles.descriptionText}>
            Each week, BeAligned™ provides a grounding reflection card to help you stay centered,
            connected, and aligned with your values in co-parenting and relationships.
          </Text>
          <Text style={styles.descriptionText}>
            These cards are part of our BeH2O® framework—combining strength and fluidity
            to help you navigate difficult conversations with clarity and compassion.
          </Text>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>
            Want weekly grounding delivered to your dashboard?
          </Text>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.ctaButtonText}>Join BeAligned Free</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/(marketing)')}
          >
            <Text style={styles.secondaryButtonText}>Learn More</Text>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require('../../../assets/bealigned_logo.avif')}
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
          <Pressable onPress={() => router.push('/(marketing)/privacy')}>
            <Text style={styles.footerLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/terms')}>
            <Text style={styles.footerLink}>Terms</Text>
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
  section: {
    paddingVertical: ds.spacing[12],
    paddingHorizontal: ds.spacing[10],
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerBadge: {
    alignSelf: 'center',
    backgroundColor: ds.colors.primary.light,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.full,
    marginBottom: ds.spacing[4],
  },
  badgeText: {
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.primary.main,
    fontFamily: ds.typography.fontFamily.base,
  },
  weekTitle: {
    fontSize: ds.typography.fontSize['4xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginBottom: ds.spacing[10],
    fontFamily: ds.typography.fontFamily.base,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.9,
    marginBottom: ds.spacing[10],
    borderRadius: ds.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: ds.colors.background.secondary,
    ...ds.shadows.lg,
  },
  groundingImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral[100],
  },
  placeholderText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
  descriptionCard: {
    backgroundColor: ds.colors.background.secondary,
    padding: ds.spacing[8],
    borderRadius: ds.borderRadius.lg,
    marginBottom: ds.spacing[10],
  },
  descriptionTitle: {
    fontSize: ds.typography.fontSize.xl.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  descriptionText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: ds.spacing[10],
  },
  ctaTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[8],
    fontFamily: ds.typography.fontFamily.heading,
  },
  ctaButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[12],
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    marginBottom: ds.spacing[4],
    ...ds.shadows.md,
  },
  ctaButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButton: {
    paddingHorizontal: ds.spacing[12],
    paddingVertical: ds.spacing[4],
  },
  secondaryButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ds.spacing[20],
    paddingHorizontal: ds.spacing[10],
  },
  errorTitle: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  errorText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    marginBottom: ds.spacing[8],
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
    flexWrap: 'wrap',
    justifyContent: 'center',
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

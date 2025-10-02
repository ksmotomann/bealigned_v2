import { View, Text, Pressable, StyleSheet, Image, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ds from '../styles/design-system'

export default function MarketingFooter() {
  const router = useRouter()

  const handleExternalLink = (url: string) => {
    Linking.openURL(url)
  }

  return (
    <View>
      {/* Blue CTA Banner */}
      <View style={styles.ctaBanner}>
        <Text style={styles.ctaText}>Join families already creating healthier conversations</Text>
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Get Started Free</Text>
        </Pressable>
      </View>

      {/* Grey Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Ionicons name="warning-outline" size={20} color="#E67E22" style={styles.warningIcon} />
        <Text style={styles.disclaimerText}>BeAligned does not offer legal advice or therapy</Text>
      </View>

      {/* White Footer Section */}
      <View style={styles.footer}>
        {/* Logo and Navigation */}
        <View style={styles.footerContent}>
          <Image
            source={require('../assets/bealigned_logo.avif')}
            style={styles.footerLogo}
            resizeMode="contain"
          />

          <View style={styles.footerNav}>
            <Pressable onPress={() => router.push('/(marketing)/our-story')}>
              <Text style={styles.footerLink}>Our Story</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(marketing)/faq')}>
              <Text style={styles.footerLink}>FAQ</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(marketing)/contact')}>
              <Text style={styles.footerLink}>Contact</Text>
            </Pressable>
            <Pressable onPress={() => handleExternalLink('https://thelayneproject.com/')}>
              <Text style={styles.footerLink}>The Layne Project</Text>
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Copyright and Trademark */}
        <Text style={styles.copyright}>
          BeH2O® and BeAligned™ are registered and trademarked programs of The Layne Project.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  ctaBanner: {
    backgroundColor: '#7CB9D4',
    paddingVertical: ds.spacing[16],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
  },
  ctaText: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ds.spacing[10],
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
  },
  ctaButtonText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: '#7CB9D4',
    fontFamily: ds.typography.fontFamily.base,
  },
  disclaimerBanner: {
    backgroundColor: '#F5F5F5',
    paddingVertical: ds.spacing[3],
    paddingHorizontal: ds.spacing[10],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIcon: {
    marginRight: ds.spacing[2],
  },
  disclaimerText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: '#4A5568',
    fontFamily: ds.typography.fontFamily.base,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: ds.spacing[6],
    paddingHorizontal: ds.spacing[10],
  },
  footerContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ds.spacing[6],
  },
  footerLogo: {
    width: 150,
    height: 40,
  },
  footerNav: {
    flexDirection: 'row',
    gap: ds.spacing[8],
    flexWrap: 'wrap',
  },
  footerLink: {
    fontSize: ds.typography.fontSize.base.size,
    color: '#4A5568',
    fontFamily: ds.typography.fontFamily.base,
    fontWeight: ds.typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: ds.spacing[4],
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  copyright: {
    fontSize: ds.typography.fontSize.sm.size,
    color: '#718096',
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
})

import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'

export default function OurStory() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="our-story" />
      
      {/* Navigation Header */}
      <NavigationHeader activeLink="our-story" />

      {/* Hero Section */}
      <AnimatedWaveHero style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Our Story</Text>
          <Text style={styles.heroSubtitle}>
            From Conflict to Connection: The Journey Behind BeAligned
          </Text>
        </View>
      </AnimatedWaveHero>

      {/* Main Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Every Conflict Contains Seeds of Connection</Text>
        <Text style={styles.text}>
          BeAligned was born from a simple but powerful belief: that every conflict, no matter how challenging, 
          contains the seeds of deeper connection. Our founder's personal journey through family conflict, 
          combined with years of research in Nonviolent Communication, child development, and conflict resolution, 
          revealed a fundamental gap in how we approach difficult conversations.
        </Text>
      </View>

      {/* The Problem Section */}
      <View style={[styles.section, styles.sectionGray]}>
        <Text style={styles.sectionTitle}>The Problem We Saw</Text>
        <Text style={styles.text}>
          Traditional approaches to family and relationship conflict often escalate tensions rather than resolve them. 
          In moments of high emotion, we lose access to our wisdom and compassion, defaulting to reactive patterns 
          that push us further apart from the people we care about most.
        </Text>
        <Text style={styles.text}>
          Existing communication tools were either too academic for real-world application or too simplistic 
          to handle complex emotional dynamics. We needed something that could meet people exactly where they are—
          in the heat of the moment—and guide them toward clarity and connection.
        </Text>
      </View>

      {/* The Solution Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A New Approach Emerges</Text>
        <Text style={styles.text}>
          BeAligned isn't just another communication tool—it's a bridge between understanding and action, 
          between emotion and expression, between conflict and connection. Our evidence-based 7-step reflection 
          process helps you navigate difficult conversations with clarity and compassion.
        </Text>
        
        <View style={styles.foundationGrid}>
          <View style={styles.foundationCard}>
            <Ionicons name="school-outline" size={32} color={ds.colors.primary.main} />
            <Text style={styles.foundationTitle}>Research-Based</Text>
            <Text style={styles.foundationText}>
              Grounded in decades of research in Nonviolent Communication, 
              child development, and conflict resolution.
            </Text>
          </View>
          
          <View style={styles.foundationCard}>
            <Ionicons name="heart-outline" size={32} color={ds.colors.primary.main} />
            <Text style={styles.foundationTitle}>Compassion-Centered</Text>
            <Text style={styles.foundationText}>
              Designed to help you stay connected to your values and 
              the humanity in others, even during conflict.
            </Text>
          </View>
          
          <View style={styles.foundationCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={ds.colors.primary.main} />
            <Text style={styles.foundationTitle}>Practically Proven</Text>
            <Text style={styles.foundationText}>
              Field-tested with real families facing real challenges, 
              refined through thousands of difficult conversations.
            </Text>
          </View>
        </View>
      </View>

      {/* BeH2O Framework Section */}
      <View style={[styles.section, styles.sectionGray]}>
        <Text style={styles.sectionTitle}>The BeH2O® Framework</Text>
        <Text style={styles.text}>
          At the heart of BeAligned is our BeH2O® framework, which combines the strength of beryllium 
          with the fluidity of water. This unique approach provides the structural support you need 
          to stay grounded while maintaining the flexibility to respond rather than react.
        </Text>
        
        <View style={styles.frameworkIllustration}>
          <View style={styles.frameworkItem}>
            <Ionicons name="diamond-outline" size={28} color={ds.colors.primary.main} />
            <Text style={styles.frameworkLabel}>Strength</Text>
            <Text style={styles.frameworkDescription}>Like beryllium, providing structural integrity</Text>
          </View>
          
          <View style={styles.frameworkConnector}>
            <View style={styles.connectorLine} />
            <Text style={styles.connectorText}>+</Text>
          </View>
          
          <View style={styles.frameworkItem}>
            <Ionicons name="water-outline" size={28} color={ds.colors.primary.main} />
            <Text style={styles.frameworkLabel}>Fluidity</Text>
            <Text style={styles.frameworkDescription}>Like water, adaptable and flowing</Text>
          </View>
          
          <View style={styles.frameworkConnector}>
            <View style={styles.connectorLine} />
            <Text style={styles.connectorText}>=</Text>
          </View>
          
          <View style={styles.frameworkItem}>
            <Ionicons name="people-outline" size={28} color={ds.colors.success} />
            <Text style={styles.frameworkLabel}>Connection</Text>
            <Text style={styles.frameworkDescription}>Authentic, lasting relationships</Text>
          </View>
        </View>
      </View>

      {/* Mission Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.missionText}>
          We believe that healthy communication is a skill that can be learned, practiced, and mastered. 
          Our mission is to provide the scaffolding—not a crutch—that helps you develop confidence 
          in navigating difficult conversations.
        </Text>
        <Text style={styles.text}>
          BeAligned helps you internalize the process so you can eventually navigate conflicts with ease, 
          whether or not you're using the app. We're not just building a product; we're nurturing 
          a world where conflict becomes a doorway to deeper understanding and stronger relationships.
        </Text>
      </View>

      {/* CTA Section */}
      <AnimatedWaveHero 
        style={styles.ctaSection}
        baseColors={ds.gradients.cta}
      >
        <Text style={styles.ctaTitle}>Ready to Transform Your Relationships?</Text>
        <Text style={styles.ctaText}>
          Join us in turning conflict into connection
        </Text>
        <Pressable 
          style={styles.ctaButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Start Your Journey</Text>
        </Pressable>
      </AnimatedWaveHero>

      {/* Footer */}
      <View style={styles.footer}>
        <Image 
          source={require('../../assets/bealigned_logo.png')} 
          style={styles.footerLogoImage}
          resizeMode="contain"
        />
        
        <View style={styles.footerLinks}>
          <Pressable onPress={() => router.push('/(marketing)')}>
            <Text style={styles.footerLink}>Home</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/faq')}>
            <Text style={styles.footerLink}>FAQ</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/contact')}>
            <Text style={styles.footerLink}>Contact</Text>
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
  header: {
    backgroundColor: ds.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[100],
    position: 'relative',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[12],
    paddingVertical: ds.spacing[4],
    maxWidth: ds.containers.xl,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 40,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  navLinkActive: {
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
  },
  signInButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[6],
    paddingVertical: ds.spacing[2] + 2,
    borderRadius: ds.borderRadius.md,
  },
  signInText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  hero: {
    paddingVertical: ds.spacing[20],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
    minHeight: 300,
  },
  heroContent: {
    maxWidth: 800,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: ds.typography.fontSize['5xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  heroSubtitle: {
    fontSize: ds.typography.fontSize.xl.size,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    opacity: 0.95,
    fontFamily: ds.typography.fontFamily.base,
  },
  section: {
    paddingVertical: ds.spacing[20],
    paddingHorizontal: ds.spacing[10],
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  sectionGray: {
    backgroundColor: ds.colors.background.secondary,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize['3xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.heading,
  },
  text: {
    fontSize: ds.typography.fontSize.base.size + 1,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    marginBottom: ds.spacing[5],
    fontFamily: ds.typography.fontFamily.base,
  },
  missionText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.primary,
    lineHeight: ds.typography.fontSize.xl.lineHeight,
    marginBottom: ds.spacing[5],
    fontWeight: ds.typography.fontWeight.medium,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  foundationGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: ds.spacing[10],
    flexWrap: 'wrap',
  },
  foundationCard: {
    alignItems: 'center',
    width: 260,
    padding: ds.spacing[6],
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    ...ds.shadows.base,
  },
  foundationTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[3],
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  foundationText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.base.lineHeight,
    fontFamily: ds.typography.fontFamily.base,
  },
  frameworkIllustration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ds.spacing[10],
    gap: 20,
    flexWrap: 'wrap',
  },
  frameworkItem: {
    alignItems: 'center',
    width: 120,
  },
  frameworkLabel: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[2],
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  frameworkDescription: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  frameworkConnector: {
    alignItems: 'center',
    paddingHorizontal: ds.spacing[2],
  },
  connectorLine: {
    width: 40,
    height: 1,
    backgroundColor: ds.colors.neutral[300],
    marginBottom: ds.spacing[1],
  },
  connectorText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.primary.main,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  ctaSection: {
    paddingVertical: ds.spacing[20],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: ds.typography.fontSize['4xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  ctaText: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[8],
    opacity: 0.95,
    fontFamily: ds.typography.fontFamily.base,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ds.spacing[12],
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    ...ds.shadows.lg,
  },
  ctaButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
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
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Platform, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import RippleBackground from '../../components/RippleBackground'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'
import { createShadow, createTextShadow } from '../../utils/platformStyles'

export default function LandingPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const isMobile = width < 480
  const [reflectionCount, setReflectionCount] = useState(0)

  useEffect(() => {
    const fetchReflectionCount = async () => {
      const { data, error } = await supabase
        .rpc('get_public_reflection_count')

      if (!error && data !== null) {
        setReflectionCount(data)
      }
    }

    fetchReflectionCount()
  }, [])

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="home" />

      {/* Navigation Header */}
      <NavigationHeader activeLink="home" />

      {/* Temporary Promotional Banner */}
      <View style={styles.promoBanner}>
        <View style={styles.promoBannerContent}>
          <View style={styles.promoBannerLeft}>
            <Text style={styles.promoBannerTitle}>
              Join the BeAligned™ Community — free for 7 days with code <Text style={styles.promoBannerCode}>BeBetaUser</Text>
            </Text>
            <Text style={styles.promoBannerSubtitle}>
              No credit card. No strings. Just choice. Together we're learning, growing, and safeguarding childhoods.
            </Text>
            <Pressable
              style={styles.promoBannerButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.promoBannerButtonText}>Start Free Trial</Text>
            </Pressable>
          </View>
          <View style={styles.promoBannerRight}>
            <Text style={styles.communityLabel}>🔴 COMMUNITY REFLECTIONS</Text>
            <Text style={styles.communityCount}>{reflectionCount.toLocaleString()}</Text>
            <Text style={styles.communitySubtext}>and growing...</Text>
          </View>
        </View>
      </View>

      {/* Hero Section with Animated Wave Background */}
      <AnimatedWaveHero style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.logoHeroContainer}>
            <Image
              source={require('../../assets/be_logo.png')}
              style={styles.logoHero}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.heroQuote}>
            "Some days it just feels like{'\n'}too much"
          </Text>
          
          <Text style={styles.heroDescription}>
            Let us help you turn conflict into meaningful connections with our{'\n'}
            research-backed framework for compassionate communication.
          </Text>
          
          <View style={[styles.ctaButtons, isMobile && styles.ctaButtonsMobile]}>
            <Pressable 
              style={styles.primaryButton} 
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.primaryButtonText}>Start Using BeAligned™</Text>
            </Pressable>
            
            <Pressable 
              style={styles.secondaryButton}
              onPress={() => router.push('/(marketing)/our-story')}
            >
              <Text style={styles.secondaryButtonText}>Hear the Why</Text>
            </Pressable>
          </View>
        </View>
      </AnimatedWaveHero>

      {/* BeAligned™ Breakthrough Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BeAligned™ Breakthrough</Text>
        <Text style={styles.sectionSubtitle}>Conflict to Connection</Text>
        <Text style={styles.sectionText}>
          Our evidence-based 7-step reflection process helps you navigate difficult conversations{'\n'}
          with clarity and compassion. Transform reactive moments into opportunities for deeper{'\n'}
          understanding and stronger relationships.
        </Text>
      </View>

      {/* BeH2O Section */}
      <RippleBackground 
        style={[styles.section, styles.sectionGray]}
        backgroundColor="#F9FAFB"
        rippleColor="rgba(94, 195, 234, 0.25)"
        amplitude={4}
        wavelength={80}
        propagationSpeed={100}
        spawnInterval={2000}
        maxRipples={5}
      >
        <View style={styles.beh2oLogo}>
          <Image 
            source={require('../../assets/be_h20_logo.webp')} 
            style={styles.beh2oLogoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.sectionTitle}>Built on What Works</Text>
        <Text style={styles.sectionText}>
          BeH2O® combines the strength of beryllium with the fluidity of water—creating a framework{'\n'}
          for communication that is both strong and flexible.
        </Text>
        <Text style={styles.sectionText}>
          Grounded in decades of research in Nonviolent Communication, child development,{'\n'}
          and conflict resolution, BeAligned provides evidence-based guidance when you need it most.
        </Text>
        
        <View style={[styles.principlesRow, isMobile && styles.principlesRowMobile]}>
          <View style={styles.principle}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#4A90E2" />
            <Text style={styles.principleTitle}>Strength</Text>
            <Text style={styles.principleText}>Clear, grounded communication</Text>
          </View>
          
          <View style={styles.principle}>
            <Ionicons name="analytics-outline" size={32} color="#4A90E2" />
            <Text style={styles.principleTitle}>Stability</Text>
            <Text style={styles.principleText}>Anchored in shared goals</Text>
          </View>
          
          <View style={styles.principle}>
            <Ionicons name="water-outline" size={32} color="#4A90E2" />
            <Text style={styles.principleTitle}>Flow</Text>
            <Text style={styles.principleText}>Responsive, not reactive</Text>
          </View>
        </View>
        
        <Pressable style={styles.learnMoreButton}>
          <Text style={styles.learnMoreText}>Learn More About BeH2O</Text>
        </Pressable>
      </RippleBackground>

      {/* Scaffolding Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scaffolding, Not a Crutch</Text>
        <Text style={styles.sectionText}>
          BeAligned helps you develop your own skills in compassionate communication.{'\n'}
          Use it as much or as little as you need while building confidence in navigating difficult conversations.
        </Text>
        <Text style={styles.sectionText}>
          Our goal is to help you internalize the process so you can eventually navigate conflicts{'\n'}
          with ease, whether or not you're using the app.
        </Text>
      </View>

      {/* Safe & Confidential Section */}
      <View style={[styles.section, styles.sectionGray]}>
        <Text style={styles.sectionTitle}>Safe & Confidential</Text>
        <Text style={styles.sectionText}>
          Your reflections are completely private and secure. We use industry-standard encryption{'\n'}
          and never share your data with third parties.
        </Text>
        <Text style={styles.sectionText}>
          BeAligned is a judgment-free space for personal growth and self-reflection.{'\n'}
          Feel safe to explore your thoughts and feelings without fear of criticism.
        </Text>
        
        <View style={styles.securityFeatures}>
          <View style={styles.securityItem}>
            <Ionicons name="lock-closed" size={20} color="#4A90E2" />
            <Text style={styles.securityText}>End-to-end encryption</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="shield" size={20} color="#4A90E2" />
            <Text style={styles.securityText}>HIPAA compliant</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="eye-off" size={20} color="#4A90E2" />
            <Text style={styles.securityText}>Zero data sharing</Text>
          </View>
        </View>
      </View>

      {/* How BeAligned™ Works Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How BeAligned™ Works</Text>
        
        <View style={styles.stepsContainer}>
          {[
            { num: 1, label: 'Pause' },
            { num: 2, label: 'Reflect' },
            { num: 3, label: 'Feel' },
            { num: 4, label: 'Need' },
            { num: 5, label: 'Request' },
            { num: 6, label: 'Craft' },
            { num: 7, label: 'Connect' }
          ].map(step => (
            <View key={step.num} style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{step.num}</Text>
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.sectionText}>
          Start with what's on your mind and work through our guided 7-step reflection process.{'\n'}
          Each step helps you gain clarity and craft a message that truly expresses your needs.
        </Text>
        
        <Pressable style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Your First Reflection</Text>
        </Pressable>
      </View>

      {/* Testimonials Section */}
      <View style={[styles.section, styles.sectionGray]}>
        <Text style={styles.sectionTitle}>What Our Users Say</Text>
        
        <View style={[styles.testimonialsGrid, isMobile && styles.testimonialsGridMobile]}>
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialQuote}>
              "BeAligned helped me navigate a difficult conversation with my teenager. Instead of escalating, we actually heard each other."
            </Text>
            <Text style={styles.testimonialAuthor}>— Sarah M., Parent</Text>
          </View>
          
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialQuote}>
              "The 7-step process gave me clarity when I was too emotional to think straight. It's like having a wise friend guide you."
            </Text>
            <Text style={styles.testimonialAuthor}>— David K., Partner</Text>
          </View>
          
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialQuote}>
              "I use BeAligned before important work conversations. It helps me communicate my needs without being confrontational."
            </Text>
            <Text style={styles.testimonialAuthor}>— Maria L., Manager</Text>
          </View>
        </View>
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.faqContainer}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is BeAligned a replacement for therapy?</Text>
            <Text style={styles.faqAnswer}>
              No, BeAligned is an educational tool that helps you practice communication skills. It's not a substitute for professional therapy or counseling.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How private are my reflections?</Text>
            <Text style={styles.faqAnswer}>
              Your reflections are completely private and encrypted. We never share your data with third parties, and you have full control over your information.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I use BeAligned with my partner?</Text>
            <Text style={styles.faqAnswer}>
              Currently, BeAligned is designed for individual reflection. BeAligned Couples is coming soon and will allow shared reflection spaces.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How much does it cost?</Text>
            <Text style={styles.faqAnswer}>
              BeAligned offers a free tier with core features. Premium plans with advanced features and unlimited reflections are available.
            </Text>
          </View>
        </View>
        
        <Pressable style={styles.moreQuestionsButton} onPress={() => router.push('/(marketing)/faq')}>
          <Text style={styles.moreQuestionsText}>View All FAQs →</Text>
        </Pressable>
      </View>

      {/* Coming Soon Section */}
      <View style={[styles.section, styles.sectionBlue]}>
        <Text style={styles.comingSoonTitle}>Coming Soon to BeAligned™</Text>
        
        <View style={[styles.comingSoonGrid, isMobile && styles.comingSoonGridMobile]}>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonLabel}>BeAligned™ Couples</Text>
            <Text style={styles.comingSoonText}>
              Shared reflection spaces for partners{'\n'}
              to work through conflicts together
            </Text>
            <Pressable style={styles.waitlistButton}>
              <Text style={styles.waitlistButtonText}>Join Waitlist</Text>
            </Pressable>
          </View>
          
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonLabel}>BeAligned™ Parents</Text>
            <Text style={styles.comingSoonText}>
              Tools for navigating co-parenting{'\n'}
              challenges with grace and clarity
            </Text>
            <Pressable style={styles.waitlistButton}>
              <Text style={styles.waitlistButtonText}>Join Waitlist</Text>
            </Pressable>
          </View>
        </View>
        
        <Text style={styles.newsletterText}>
          Be the first to know when new features launch
        </Text>
      </View>

      {/* Ready to Find Your Alignment CTA */}
      <AnimatedWaveHero 
        style={styles.finalCTA}
        baseColors={ds.gradients.cta}
      >
        <Text style={styles.finalCTATitle}>Ready to Find Your Alignment?</Text>
        <Text style={styles.finalCTAText}>
          Join thousands who are transforming conflict into connection with BeAligned
        </Text>
        <Pressable 
          style={styles.finalCTAButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.finalCTAButtonText}>Get Started Free</Text>
        </Pressable>
      </AnimatedWaveHero>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require('../../assets/bealigned_logo.avif')}
          style={styles.footerLogoImage}
          resizeMode="contain"
        />
        
        <View style={styles.footerLinks}>
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
  promoBanner: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  promoBannerContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 32,
  },
  promoBannerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  promoBannerRight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 8,
      elevation: 3,
    }),
  },
  communityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  communityCount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  communitySubtext: {
    fontSize: 14,
    color: '#0EA5E9',
    fontStyle: 'italic',
  },
  promoBannerTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: '#0EA5E9',
    marginBottom: 12,
    lineHeight: 32,
  },
  promoBannerCode: {
    fontWeight: '700',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promoBannerSubtitle: {
    fontSize: 16,
    color: '#0C4A6E',
    marginBottom: 20,
    lineHeight: 24,
  },
  promoBannerButton: {
    backgroundColor: '#F4A582',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  promoBannerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hero: {
    paddingVertical: ds.spacing[12],
    paddingHorizontal: ds.spacing[10],
    alignItems: 'center',
    minHeight: 400,
  },
  heroContent: {
    maxWidth: 800,
    alignItems: 'center',
    zIndex: 2,
  },
  logoHeroContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 8,
      elevation: 4,
    }),
  },
  logoHero: {
    width: 54,
    height: 54,
  },
  heroQuote: {
    fontSize: 43,  // Reduced from 48px (5xl) by ~10%
    fontStyle: 'normal',
    color: ds.colors.text.inverse,
    textAlign: 'center',
    marginBottom: ds.spacing[3],
    fontWeight: ds.typography.fontWeight.bold,
    fontFamily: ds.typography.fontFamily.heading,
    ...createTextShadow({
      color: 'rgba(0, 0, 0, 0.1)',
      offset: { width: 0, height: 1 },
      radius: 2,
    }),
  },
  heroDescription: {
    fontSize: ds.typography.fontSize.lg.size,
    color: ds.colors.text.inverse,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    marginBottom: ds.spacing[8],
    opacity: 0.95,
    fontFamily: ds.typography.fontFamily.base,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#5FA8D3',
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 3 },
      opacity: 0.2,
      radius: 6,
      elevation: 3,
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButton: {
    backgroundColor: '#FF9B7D',
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.15,
      radius: 4,
      elevation: 2,
    }),
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: ds.typography.fontWeight.semibold,
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
  sectionBlue: {
    backgroundColor: ds.colors.primary.lightest,
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize['4xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    textAlign: 'center',
    marginBottom: ds.spacing[3],
    fontFamily: ds.typography.fontFamily.heading,
  },
  sectionSubtitle: {
    fontSize: ds.typography.fontSize.xl.size,
    color: ds.colors.primary.main,
    textAlign: 'center',
    marginBottom: ds.spacing[8],
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  sectionText: {
    fontSize: ds.typography.fontSize.base.size + 1,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    marginBottom: ds.spacing[5],
    fontFamily: ds.typography.fontFamily.base,
  },
  beh2oLogo: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  beh2oLogoImage: {
    width: 260,
    height: 104,
  },
  principlesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    marginTop: 40,
    marginBottom: 32,
  },
  principle: {
    alignItems: 'center',
    width: 140,
  },
  principleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: ds.typography.fontFamily.base,
  },
  principleText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  learnMoreButton: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 4,
  },
  learnMoreText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: ds.typography.fontFamily.base,
  },
  securityFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 32,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: ds.typography.fontFamily.base,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
    marginTop: 40,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ds.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing[2],
    ...ds.shadows.base,
  },
  stepNumber: {
    color: ds.colors.text.inverse,
    fontSize: 22,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  stepLabel: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.secondary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  startButton: {
    alignSelf: 'center',
    backgroundColor: '#5EC3EA',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 6,
    marginTop: 32,
    elevation: 3,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.15,
      radius: 8,
      elevation: 3,
    }),
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: ds.typography.fontFamily.base,
  },
  comingSoonTitle: {
    fontSize: 36,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 48,
    fontFamily: ds.typography.fontFamily.heading,
  },
  comingSoonGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 12,
    width: 340,
    alignItems: 'center',
    elevation: 3,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.12,
      radius: 8,
      elevation: 3,
    }),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comingSoonLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    fontFamily: ds.typography.fontFamily.base,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: ds.typography.fontFamily.base,
  },
  waitlistButton: {
    borderWidth: 1,
    borderColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  waitlistButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: ds.typography.fontFamily.base,
  },
  newsletterText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: ds.typography.fontFamily.base,
  },
  finalCTA: {
    paddingVertical: 100,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: ds.typography.fontFamily.heading,
  },
  finalCTAText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.95,
    fontFamily: ds.typography.fontFamily.base,
  },
  finalCTAButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 8,
    elevation: 4,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.15,
      radius: 12,
      elevation: 4,
    }),
  },
  finalCTAButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: '600',
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
  testimonialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    marginTop: 32,
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 8,
    width: 320,
    elevation: 1,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.05,
      radius: 2,
      elevation: 1,
    }),
  },
  testimonialQuote: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 16,
    fontFamily: ds.typography.fontFamily.base,
  },
  testimonialAuthor: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
    fontFamily: ds.typography.fontFamily.base,
  },
  faqContainer: {
    marginTop: 32,
  },
  faqItem: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  faqQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    fontFamily: ds.typography.fontFamily.base,
  },
  faqAnswer: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    fontFamily: ds.typography.fontFamily.base,
  },
  moreQuestionsButton: {
    alignSelf: 'center',
    marginTop: 32,
  },
  moreQuestionsText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
    fontFamily: ds.typography.fontFamily.base,
  },
  ctaButtonsMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  principlesRowMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  comingSoonGridMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  testimonialsGridMobile: {
    flexDirection: 'column',
    gap: 16,
  },
})
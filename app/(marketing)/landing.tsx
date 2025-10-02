import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { createShadow } from '../../utils/platformStyles'

export default function ModernLandingPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 1024
  const isTablet = width >= 768

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Temporary Promotional Banner */}
      <View style={styles.promoBanner}>
        <View style={styles.promoBannerContent}>
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
      </View>

      {/* Navigation Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logo}>
            <View style={styles.logoCircle}>
              <Ionicons name="water" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.logoText}>BeAligned</Text>
          </View>
          
          {isDesktop ? (
            <View style={styles.navLinks}>
              <Pressable onPress={() => router.push('/(marketing)/our-story')}>
                <Text style={styles.navLink}>Our Story</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(marketing)/faq')}>
                <Text style={styles.navLink}>FAQ</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(marketing)/contact')}>
                <Text style={styles.navLink}>Contact</Text>
              </Pressable>
              <Pressable 
                style={styles.signInButton}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.signInText}>Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#1F2937" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={['#7DD3FC', '#BFDBFE', '#DBEAFE']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroQuote}>
            "Some days it just feels like{'\n'}too much"
          </Text>
          
          <Text style={styles.heroTitle}>
            Transform conflict into clarity
          </Text>
          
          <Text style={styles.heroSubtitle}>
            BeAligned's guided reflection process helps you navigate{'\n'}
            difficult conversations with confidence and compassion
          </Text>
          
          <View style={styles.heroCTA}>
            <Pressable 
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.primaryButtonText}>Start Your Journey</Text>
              <Ionicons name="arrow-forward" size={20} color="#7C3AED" />
            </Pressable>
            
            <Pressable 
              style={styles.secondaryButton}
              onPress={() => router.push('/(marketing)/our-story')}
            >
              <Text style={styles.secondaryButtonText}>Learn More</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* BeAligned Breakthrough Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>BREAKTHROUGH</Text>
          <Text style={styles.sectionTitle}>BeAligned™ Breakthrough</Text>
          <Text style={styles.sectionSubtitle}>Seven Steps to Resolution</Text>
        </View>
        
        <Text style={styles.sectionText}>
          Our unique 7-step reflection process guides you from emotional reaction 
          to purposeful response, helping you craft messages that connect rather than divide.
        </Text>
        
        <View style={styles.stepsGrid}>
          {[
            { num: 1, title: 'Situation', desc: 'Describe objectively' },
            { num: 2, title: 'Thoughts', desc: 'Initial reactions' },
            { num: 3, title: 'Feelings', desc: 'Identify emotions' },
            { num: 4, title: 'Needs', desc: 'What matters most' },
            { num: 5, title: 'Requests', desc: 'Specific actions' },
            { num: 6, title: 'Vision', desc: 'Positive outcomes' },
            { num: 7, title: 'Message', desc: 'CLEAR communication' },
          ].map((step) => (
            <View key={step.num} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.num}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* BeH2O Section */}
      <View style={[styles.section, styles.sectionAlt]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>FOUNDATION</Text>
          <Text style={styles.sectionTitle}>BeH2O®</Text>
          <Text style={styles.sectionSubtitle}>Built on What Works</Text>
        </View>
        
        <View style={styles.principlesGrid}>
          <View style={styles.principleCard}>
            <View style={styles.principleIcon}>
              <Ionicons name="shield-checkmark" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.principleTitle}>Strength</Text>
            <Text style={styles.principleText}>
              Like beryllium, communicate with clarity and grounded purpose
            </Text>
          </View>
          
          <View style={styles.principleCard}>
            <View style={styles.principleIcon}>
              <Ionicons name="git-merge" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.principleTitle}>Stability</Text>
            <Text style={styles.principleText}>
              Anchor to shared goals that protect relationships
            </Text>
          </View>
          
          <View style={styles.principleCard}>
            <View style={styles.principleIcon}>
              <Ionicons name="water" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.principleTitle}>Flow</Text>
            <Text style={styles.principleText}>
              Be responsive—not reactive—while moving forward
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>PROCESS</Text>
          <Text style={styles.sectionTitle}>How BeAligned™ Works</Text>
        </View>
        
        <View style={styles.processSteps}>
          {[
            { icon: 'create', title: 'Start Reflection', desc: 'Begin with what\'s on your mind' },
            { icon: 'compass', title: 'Follow Process', desc: 'Work through 7 guided steps' },
            { icon: 'bulb', title: 'Gain Clarity', desc: 'Understand feelings and needs' },
            { icon: 'send', title: 'Craft Message', desc: 'Create CLEAR communication' },
          ].map((step, index) => (
            <View key={index} style={styles.processStep}>
              <View style={styles.processStepNumber}>
                <Text style={styles.processStepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.processStepIcon}>
                <Ionicons name={step.icon as any} size={28} color="#7C3AED" />
              </View>
              <Text style={styles.processStepTitle}>{step.title}</Text>
              <Text style={styles.processStepText}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Features Grid */}
      <View style={[styles.section, styles.sectionAlt]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>FEATURES</Text>
          <Text style={styles.sectionTitle}>Cultivating Not a Crisis</Text>
        </View>
        
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="chatbubbles" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.featureTitle}>AI-Guided Support</Text>
            <Text style={styles.featureText}>
              Personalized guidance at each step of your reflection journey
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="heart" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.featureTitle}>Feelings & Needs</Text>
            <Text style={styles.featureText}>
              Comprehensive NVC-based feelings and needs inventories
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="document-text" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.featureTitle}>CLEAR Messages</Text>
            <Text style={styles.featureText}>
              Craft messages that are Concise, Listener-Ready, and Essential
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="analytics" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.featureTitle}>Track Progress</Text>
            <Text style={styles.featureText}>
              Monitor your growth and patterns over time
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="lock-closed" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.featureTitle}>Private & Secure</Text>
            <Text style={styles.featureText}>
              Your reflections are encrypted and completely private
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="phone-portrait" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.featureTitle}>Available Anywhere</Text>
            <Text style={styles.featureText}>
              Access on web, iOS, and Android devices
            </Text>
          </View>
        </View>
      </View>

      {/* Coming Soon Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>COMING SOON</Text>
          <Text style={styles.sectionTitle}>Expanding BeAligned™</Text>
        </View>
        
        <View style={styles.comingSoonGrid}>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonEmoji}>👥</Text>
            <Text style={styles.comingSoonTitle}>BeAligned™ Couples</Text>
            <Text style={styles.comingSoonText}>
              Shared reflection spaces for partners to work through conflicts together
            </Text>
          </View>
          
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.comingSoonTitle}>BeAligned™ Family</Text>
            <Text style={styles.comingSoonText}>
              Tools for creating harmony in family dynamics
            </Text>
          </View>
          
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonEmoji}>🏢</Text>
            <Text style={styles.comingSoonTitle}>BeAligned™ Teams</Text>
            <Text style={styles.comingSoonText}>
              Workplace conflict resolution and team communication
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={['#7DD3FC', '#BFDBFE']}
        style={styles.ctaSection}
      >
        <Text style={styles.ctaTitle}>Ready to Find Your Alignment?</Text>
        <Text style={styles.ctaText}>
          Join thousands transforming conflict into connection
        </Text>
        <Pressable 
          style={styles.ctaButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Start Free Today</Text>
        </Pressable>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerSection}>
            <Text style={styles.footerBrand}>BeAligned</Text>
            <Text style={styles.footerTagline}>
              Transforming conflict into clarity
            </Text>
          </View>
          
          <View style={styles.footerLinks}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Product</Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.footerLink}>Get Started</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(marketing)/faq')}>
                <Text style={styles.footerLink}>FAQ</Text>
              </Pressable>
            </View>
            
            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Company</Text>
              <Pressable onPress={() => router.push('/(marketing)/our-story')}>
                <Text style={styles.footerLink}>Our Story</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(marketing)/contact')}>
                <Text style={styles.footerLink}>Contact</Text>
              </Pressable>
            </View>
            
            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Legal</Text>
              <Pressable onPress={() => router.push('/(marketing)/privacy')}>
                <Text style={styles.footerLink}>Privacy</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(marketing)/terms')}>
                <Text style={styles.footerLink}>Terms</Text>
              </Pressable>
            </View>
          </View>
        </View>
        
        <View style={styles.footerBottom}>
          <Text style={styles.copyright}>
            © 2025 BeAligned. BeH2O® is a registered trademark.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    alignItems: 'flex-start',
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
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
  },
  hero: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  heroQuote: {
    fontSize: 28,
    fontStyle: 'italic',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    fontWeight: '300',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 56,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 30,
  },
  heroCTA: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 4,
      elevation: 2,
    }),
  },
  primaryButtonText: {
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  sectionAlt: {
    backgroundColor: '#F9FAFB',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
    maxWidth: 700,
    alignSelf: 'center',
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  stepCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 160,
    alignItems: 'center',
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.05,
      radius: 2,
      elevation: 1,
    }),
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  principlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'center',
  },
  principleCard: {
    width: 320,
    alignItems: 'center',
    padding: 32,
  },
  principleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  principleTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  principleText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  processSteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  processStep: {
    width: 260,
    alignItems: 'center',
    padding: 24,
  },
  processStepNumber: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processStepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  processStepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  processStepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  processStepText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'center',
  },
  featureCard: {
    width: 340,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.05,
      radius: 4,
      elevation: 2,
    }),
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  comingSoonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  comingSoonCard: {
    width: 320,
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comingSoonEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.95,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 8,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 4,
      elevation: 2,
    }),
  },
  ctaButtonText: {
    color: '#7C3AED',
    fontSize: 20,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#1F2937',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  footerContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 40,
  },
  footerSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 60,
    justifyContent: 'center',
  },
  footerColumn: {
    minWidth: 120,
  },
  footerHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerLink: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 20,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
})
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Image } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'

export default function FAQ() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "What is BeAligned?",
          answer: "BeAligned is a guided reflection tool that helps you navigate conflicts with clarity and compassion through our evidence-based 7-step process. Built on Nonviolent Communication principles, it provides scaffolding to help you develop better communication skills."
        },
        {
          question: "How does BeAligned work?",
          answer: "BeAligned guides you through seven steps: Pause, Reflect, Feel, Need, Request, Craft, and Connect. Each step helps you gain clarity about your situation and craft a message that truly expresses your needs while maintaining connection with others."
        },
        {
          question: "Who is BeAligned for?",
          answer: "BeAligned is designed for anyone who wants to improve their communication skills and navigate conflicts more effectively. Whether you're dealing with family tensions, relationship challenges, or workplace conflicts, BeAligned provides tools to help you respond rather than react."
        },
        {
          question: "Do I need any special training to use BeAligned?",
          answer: "No special training is required. BeAligned is designed to be intuitive and accessible to everyone, regardless of your background with communication tools or conflict resolution techniques."
        }
      ]
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          question: "Is my data secure and private?",
          answer: "Yes. Your reflections are completely private and secure. We use industry-standard end-to-end encryption and never share your data with third parties. You have full control over your information and can delete it at any time."
        },
        {
          question: "Can other people see my reflections?",
          answer: "No. All your reflections are private and visible only to you. BeAligned is designed as a personal reflection space where you can explore your thoughts and feelings without judgment or external visibility."
        },
        {
          question: "Is BeAligned HIPAA compliant?",
          answer: "Yes. We maintain HIPAA compliance standards to ensure your personal health information is protected, even though BeAligned is an educational tool rather than a medical device."
        },
        {
          question: "What data do you collect?",
          answer: "We collect only the information necessary to provide the service: your reflections, account information, and usage analytics (anonymized). We never sell your data or use it for advertising purposes."
        }
      ]
    },
    {
      category: "Usage & Features",
      questions: [
        {
          question: "Is BeAligned a replacement for therapy?",
          answer: "No. BeAligned is an educational tool that helps you practice communication skills. It's not a substitute for professional therapy, counseling, or medical advice. If you're dealing with serious mental health issues, please consult qualified professionals."
        },
        {
          question: "Can I use BeAligned with my partner or family?",
          answer: "Currently, BeAligned is designed for individual reflection. However, BeAligned Couples is coming soon, which will allow shared reflection spaces for partners to work through conflicts together."
        },
        {
          question: "How often should I use BeAligned?",
          answer: "Use BeAligned whenever you're facing a difficult conversation or conflict. Some people use it daily as a reflection practice, while others use it only when specific challenges arise. The goal is to help you internalize these skills over time."
        },
        {
          question: "What if I get stuck during a reflection?",
          answer: "That's completely normal! BeAligned includes helpful prompts and examples at each step. You can also take breaks and return to your reflection later. Remember, this is a learning process, and it's okay to struggle sometimes."
        }
      ]
    },
    {
      category: "Pricing & Plans",
      questions: [
        {
          question: "How much does BeAligned cost?",
          answer: "BeAligned offers a free tier with core features, allowing you to complete basic reflections. Premium plans with advanced features, unlimited reflections, and priority support are available for users who want the full experience."
        },
        {
          question: "What's included in the free tier?",
          answer: "The free tier includes access to our 7-step reflection process, basic analytics, and up to 10 reflections per month. This gives you a solid foundation to experience the benefits of structured communication reflection."
        },
        {
          question: "Can I cancel my subscription anytime?",
          answer: "Yes, you can cancel your subscription at any time. There are no long-term commitments or cancellation fees. Your data remains accessible even after cancellation."
        },
        {
          question: "Do you offer discounts for students or families?",
          answer: "Yes! We offer educational discounts for students and special family plans. Contact us directly to learn more about available discounts for your situation."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          question: "What devices and platforms does BeAligned support?",
          answer: "BeAligned works on all modern web browsers, iOS devices, and Android devices. We're constantly improving compatibility and performance across all platforms."
        },
        {
          question: "What if I'm having technical problems?",
          answer: "If you experience any technical issues, please contact our support team through the app or email us. We typically respond within 24 hours and are committed to resolving issues quickly."
        },
        {
          question: "How do I delete my account?",
          answer: "You can delete your account and all associated data from your account settings. Once deleted, your data cannot be recovered, so please make sure you've saved any reflections you want to keep."
        },
        {
          question: "Can I export my reflection data?",
          answer: "Yes, you can export your reflection data in various formats from your account settings. This allows you to keep your reflections even if you decide to stop using the service."
        }
      ]
    }
  ]

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="faq" />
      
      {/* Navigation Header */}
      <NavigationHeader activeLink="faq" />

      {/* Hero Section */}
      <AnimatedWaveHero style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Frequently Asked Questions</Text>
          <Text style={styles.heroSubtitle}>
            Everything you need to know about BeAligned
          </Text>
        </View>
      </AnimatedWaveHero>

      {/* FAQ Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Find Your Answers</Text>
        <Text style={styles.sectionText}>
          Have questions about BeAligned? We've got answers. If you don't find what you're looking for, 
          feel free to contact us directly.
        </Text>
      </View>

      {/* FAQ Sections */}
      {faqs.map((category, categoryIndex) => (
        <View key={categoryIndex} style={[styles.section, categoryIndex % 2 === 1 && styles.sectionGray]}>
          <Text style={styles.categoryTitle}>{category.category}</Text>
          
          <View style={styles.faqContainer}>
            {category.questions.map((faq, index) => {
              const globalIndex = categoryIndex * 100 + index
              const isExpanded = expandedFAQ === globalIndex
              
              return (
                <View key={index} style={styles.faqItem}>
                  <Pressable 
                    style={styles.faqQuestion}
                    onPress={() => toggleFAQ(globalIndex)}
                  >
                    <Text style={styles.questionText}>{faq.question}</Text>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color={ds.colors.primary.main} 
                    />
                  </Pressable>
                  
                  {isExpanded && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.answerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      ))}

      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Still Have Questions?</Text>
        <Text style={styles.sectionText}>
          Can't find what you're looking for? We're here to help.
        </Text>
        
        <View style={styles.contactButtons}>
          <Pressable 
            style={styles.primaryButton}
            onPress={() => router.push('/(marketing)/contact')}
          >
            <Text style={styles.primaryButtonText}>Contact Support</Text>
          </Pressable>
          
          <Pressable 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.secondaryButtonText}>Try BeAligned Free</Text>
          </Pressable>
        </View>
      </View>

      {/* CTA Section */}
      <AnimatedWaveHero 
        style={styles.ctaSection}
        baseColors={ds.gradients.cta}
      >
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaText}>
          Transform your conflicts into connections today
        </Text>
        <Pressable 
          style={styles.ctaButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Start Free Trial</Text>
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
          <Pressable onPress={() => router.push('/(marketing)')}>
            <Text style={styles.footerLink}>Home</Text>
          </Pressable>
          <Text style={styles.footerDivider}>•</Text>
          <Pressable onPress={() => router.push('/(marketing)/our-story')}>
            <Text style={styles.footerLink}>Our Story</Text>
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
    paddingVertical: ds.spacing[16],
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
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.heading,
  },
  sectionText: {
    fontSize: ds.typography.fontSize.base.size + 1,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    textAlign: 'center',
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.base,
  },
  categoryTitle: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.primary.main,
    marginBottom: ds.spacing[6],
    fontFamily: ds.typography.fontFamily.heading,
  },
  faqContainer: {
    gap: 0,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral[200],
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing[5],
    paddingHorizontal: ds.spacing[2],
  },
  questionText: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    flex: 1,
    marginRight: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  faqAnswer: {
    paddingHorizontal: ds.spacing[2],
    paddingBottom: ds.spacing[5],
  },
  answerText: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.secondary,
    lineHeight: ds.typography.fontSize.lg.lineHeight,
    fontFamily: ds.typography.fontFamily.base,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: ds.spacing[6],
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[8],
    paddingVertical: ds.spacing[4],
    borderRadius: ds.borderRadius.md,
    ...ds.shadows.base,
  },
  primaryButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[8],
    paddingVertical: ds.spacing[4] - 2,
    borderRadius: ds.borderRadius.md,
  },
  secondaryButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.base.size,
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
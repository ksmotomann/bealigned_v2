import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Image } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'
import MarketingFooter from '../../components/MarketingFooter'
import { supabase } from '../../lib/supabase'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  display_order: number
  is_published: boolean
}

interface FAQCategory {
  category: string
  questions: Array<{
    question: string
    answer: string
  }>
}

export default function FAQ() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [faqs, setFaqs] = useState<FAQCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_published', true)
        .is('deleted_at', null)
        .order('display_order')

      if (error) throw error

      // Transform flat array into category structure, preserving order
      const categorizedFAQs: FAQCategory[] = []
      const categoryMap = new Map<string, FAQCategory>()

      data?.forEach((item: FAQItem) => {
        if (!categoryMap.has(item.category)) {
          const newCategory: FAQCategory = {
            category: item.category,
            questions: []
          }
          categoryMap.set(item.category, newCategory)
          categorizedFAQs.push(newCategory)
        }

        categoryMap.get(item.category)?.questions.push({
          question: item.question,
          answer: item.answer
        })
      })

      setFaqs(categorizedFAQs)
    } catch (error) {
      console.error('Error loading FAQs:', error)
      // Set empty array on error so page still renders
      setFaqs([])
    } finally {
      setLoading(false)
    }
  }

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
      {loading ? (
        <View style={styles.section}>
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      ) : faqs.length === 0 ? (
        <View style={styles.section}>
          <Text style={styles.emptyText}>No FAQs available at the moment.</Text>
        </View>
      ) : (
        faqs.map((category, categoryIndex) => (
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
        ))
      )}

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
      <MarketingFooter activeLink="faq" />
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
  loadingText: {
    textAlign: 'center',
    color: ds.colors.text.secondary,
    fontSize: ds.typography.fontSize.base.size,
    fontFamily: ds.typography.fontFamily.base,
    paddingVertical: ds.spacing[8],
  },
  emptyText: {
    textAlign: 'center',
    color: ds.colors.text.secondary,
    fontSize: ds.typography.fontSize.base.size,
    fontFamily: ds.typography.fontFamily.base,
    paddingVertical: ds.spacing[8],
  },
})
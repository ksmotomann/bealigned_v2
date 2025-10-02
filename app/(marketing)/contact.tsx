import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, useWindowDimensions, Image, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ds from '../../styles/design-system'
import AnimatedWaveHero from '../../components/AnimatedWaveHero'
import NavigationHeader from '../../components/NavigationHeader'
import SEOHead from '../../components/SEOHead'
import MarketingFooter from '../../components/MarketingFooter'

export default function Contact() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Please fill in all required fields.')
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      Alert.alert(
        'Message Sent!', 
        'Thank you for contacting us. We\'ll get back to you within 24 hours.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setFormData({ name: '', email: '', subject: '', message: '' })
            }
          }
        ]
      )
    }, 1500)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SEOHead page="contact" />
      
      {/* Navigation Header */}
      <NavigationHeader activeLink="contact" />

      {/* Hero Section */}
      <AnimatedWaveHero style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Contact Us</Text>
          <Text style={styles.heroSubtitle}>
            We're here to help you on your journey to better communication
          </Text>
        </View>
      </AnimatedWaveHero>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <Text style={styles.sectionText}>
          Have questions about BeAligned? Need technical support? Want to share your feedback? 
          We'd love to hear from you.
        </Text>

        <View style={styles.contactMethods}>
          <View style={styles.contactMethod}>
            <Ionicons name="mail-outline" size={28} color={ds.colors.primary.main} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@bealigned.com</Text>
            </View>
          </View>
          
          <View style={styles.contactMethod}>
            <Ionicons name="time-outline" size={28} color={ds.colors.primary.main} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Response Time</Text>
              <Text style={styles.contactValue}>Within 24 hours</Text>
            </View>
          </View>
          
          <View style={styles.contactMethod}>
            <Ionicons name="shield-checkmark-outline" size={28} color={ds.colors.primary.main} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Privacy</Text>
              <Text style={styles.contactValue}>Your information is secure</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Form */}
      <View style={[styles.section, styles.sectionGray]}>
        <Text style={styles.sectionTitle}>Send us a Message</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                editable={!isSubmitting}
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="What's this about?"
              value={formData.subject}
              onChangeText={(text) => setFormData({...formData, subject: text})}
              editable={!isSubmitting}
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us how we can help..."
              value={formData.message}
              onChangeText={(text) => setFormData({...formData, message: text})}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>
          
          <Pressable 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Sending...</Text>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Send Message</Text>
                <Ionicons name="send-outline" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
          
          <Text style={styles.formNote}>
            * Required fields. We'll never share your information with third parties.
          </Text>
        </View>
      </View>

      {/* Support Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Other Ways to Get Help</Text>
        
        <View style={styles.supportOptions}>
          <View style={styles.supportOption}>
            <Ionicons name="book-outline" size={32} color={ds.colors.primary.main} />
            <Text style={styles.supportTitle}>Documentation</Text>
            <Text style={styles.supportText}>
              Browse our comprehensive guides and tutorials
            </Text>
            <Pressable style={styles.supportButton} onPress={() => router.push('/(marketing)/faq')}>
              <Text style={styles.supportButtonText}>View FAQ</Text>
            </Pressable>
          </View>
          
          <View style={styles.supportOption}>
            <Ionicons name="chatbubbles-outline" size={32} color={ds.colors.primary.main} />
            <Text style={styles.supportTitle}>Community</Text>
            <Text style={styles.supportText}>
              Connect with other BeAligned users and share experiences
            </Text>
            <Pressable style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Join Community</Text>
            </Pressable>
          </View>
          
          <View style={styles.supportOption}>
            <Ionicons name="bulb-outline" size={32} color={ds.colors.primary.main} />
            <Text style={styles.supportTitle}>Feature Requests</Text>
            <Text style={styles.supportText}>
              Have an idea for improving BeAligned? We'd love to hear it
            </Text>
            <Pressable style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Submit Idea</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <AnimatedWaveHero 
        style={styles.ctaSection}
        baseColors={ds.gradients.cta}
      >
        <Text style={styles.ctaTitle}>Ready to Start Your Journey?</Text>
        <Text style={styles.ctaText}>
          Join thousands who are transforming conflict into connection
        </Text>
        <Pressable 
          style={styles.ctaButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaButtonText}>Try BeAligned Free</Text>
        </Pressable>
      </AnimatedWaveHero>

      {/* Footer */}
      <MarketingFooter />
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
    marginBottom: ds.spacing[8],
    fontFamily: ds.typography.fontFamily.base,
  },
  contactMethods: {
    gap: ds.spacing[6],
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[4],
    backgroundColor: ds.colors.background.primary,
    padding: ds.spacing[6],
    borderRadius: ds.borderRadius.lg,
    ...ds.shadows.base,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.tertiary,
    marginBottom: ds.spacing[1],
    fontFamily: ds.typography.fontFamily.base,
  },
  contactValue: {
    fontSize: ds.typography.fontSize.base.size,
    color: ds.colors.text.primary,
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  formContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    gap: ds.spacing[4],
  },
  formField: {
    marginBottom: ds.spacing[5],
    flex: 1,
  },
  fieldLabel: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.primary,
    marginBottom: ds.spacing[2],
    fontWeight: ds.typography.fontWeight.medium,
    fontFamily: ds.typography.fontFamily.base,
  },
  input: {
    ...ds.inputs.base,
    fontFamily: ds.typography.fontFamily.base,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: ds.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing[2],
    paddingVertical: ds.spacing[4],
    paddingHorizontal: ds.spacing[8],
    borderRadius: ds.borderRadius.md,
    marginTop: ds.spacing[4],
    ...ds.shadows.base,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: ds.colors.text.inverse,
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    fontFamily: ds.typography.fontFamily.base,
  },
  formNote: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    textAlign: 'center',
    marginTop: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  supportOptions: {
    flexDirection: 'row',
    gap: ds.spacing[6],
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  supportOption: {
    alignItems: 'center',
    width: 280,
    padding: ds.spacing[6],
    backgroundColor: ds.colors.background.primary,
    borderRadius: ds.borderRadius.lg,
    ...ds.shadows.base,
  },
  supportTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    marginTop: ds.spacing[3],
    marginBottom: ds.spacing[2],
    fontFamily: ds.typography.fontFamily.heading,
  },
  supportText: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    textAlign: 'center',
    lineHeight: ds.typography.fontSize.base.lineHeight,
    marginBottom: ds.spacing[4],
    fontFamily: ds.typography.fontFamily.base,
  },
  supportButton: {
    borderWidth: 2,
    borderColor: ds.colors.primary.main,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[2],
    borderRadius: ds.borderRadius.sm,
  },
  supportButtonText: {
    color: ds.colors.primary.main,
    fontSize: ds.typography.fontSize.sm.size,
    fontWeight: ds.typography.fontWeight.medium,
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
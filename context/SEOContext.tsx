import React, { createContext, useContext, useState, useEffect } from 'react'
import { Platform } from 'react-native'

interface SEOData {
  // Page titles and descriptions
  homeTitle: string
  homeDescription: string
  homeKeywords: string
  ourStoryTitle: string
  ourStoryDescription: string
  ourStoryKeywords: string
  faqTitle: string
  faqDescription: string
  faqKeywords: string
  contactTitle: string
  contactDescription: string
  contactKeywords: string
  loginTitle: string
  loginDescription: string
  loginKeywords: string
  signupTitle: string
  signupDescription: string
  signupKeywords: string
  confirmEmailTitle: string
  confirmEmailDescription: string
  confirmEmailKeywords: string
  
  // Open Graph / Social Media
  siteName: string
  siteUrl: string
  ogImage: string
  twitterHandle: string
  
  // Business Information
  businessName: string
  businessDescription: string
  businessPhone: string
  businessEmail: string
  businessAddress: string
  
  // Analytics
  googleAnalyticsId?: string
  hotjarId?: string
  
  // Canonical URLs
  canonicalBase: string
}

interface SEOContextType {
  seoData: SEOData
  updateSEOData: (data: Partial<SEOData>) => void
  getSEOForPage: (page: string) => {
    title: string
    description: string
    keywords: string
    canonical: string
  }
}

const defaultSEOData: SEOData = {
  homeTitle: 'BeAligned™ - Reduce Co-Parenting Conflict & Safeguard Childhoods',
  homeDescription: 'Transform high-conflict co-parenting into aligned, child-centered solutions using our evidence-based 7-step reflection process. Reduce conflict, align co-parents, and safeguard childhoods.',
  homeKeywords: 'co-parenting conflict, child-centered communication, parenting alignment, divorce communication, family mediation, BeH2O system, conflict resolution',
  ourStoryTitle: 'Our Story - BeAligned™ Co-Parenting Platform',
  ourStoryDescription: 'Discover how BeAligned™ was created to help co-parents move from adversaries to allies around shared purpose - safeguarding their children\'s well-being through structured reflection.',
  ourStoryKeywords: 'BeAligned story, co-parenting mission, family conflict resolution, child-centered parenting, communication framework',
  faqTitle: 'FAQ - BeAligned™ Co-Parenting Support',
  faqDescription: 'Get answers to frequently asked questions about BeAligned™\'s 7-step reflection process, co-parenting communication tools, and child-centered conflict resolution.',
  faqKeywords: 'co-parenting FAQ, BeAligned help, parenting communication questions, child-centered solutions, divorce support',
  contactTitle: 'Contact BeAligned™ - Co-Parenting Support Team',
  contactDescription: 'Reach out to BeAligned™ for support with co-parenting challenges, platform feedback, or partnership opportunities focused on safeguarding childhoods.',
  contactKeywords: 'BeAligned contact, co-parenting support, family communication help, parenting platform assistance',
  loginTitle: 'Login - BeAligned™ Co-Parenting Platform',
  loginDescription: 'Sign in to your BeAligned™ account to access your personalized 7-step reflection process for transforming co-parenting conflict into child-centered solutions.',
  loginKeywords: 'BeAligned login, co-parenting platform access, family communication tools, parenting reflection dashboard',
  signupTitle: 'Sign Up - BeAligned™ Co-Parenting Platform',
  signupDescription: 'Create your BeAligned™ account to start transforming co-parenting conflict into child-centered solutions using our evidence-based 7-step reflection process.',
  signupKeywords: 'BeAligned signup, co-parenting registration, family communication platform, parenting conflict resolution tools',
  confirmEmailTitle: 'Confirm Your Email - BeAligned™',
  confirmEmailDescription: 'Please check your email and click the confirmation link to complete your BeAligned™ account setup and begin your child-centered co-parenting journey.',
  confirmEmailKeywords: 'email confirmation, BeAligned activation, account verification, co-parenting platform setup',
  
  siteName: 'BeAligned™',
  siteUrl: 'https://bealigned.app',
  ogImage: 'https://bealigned.app/og-image.png',
  twitterHandle: '@BeAligned',
  
  businessName: 'BeAligned™',
  businessDescription: 'BeAligned™ reduces conflict, aligns co-parents, and safeguards childhoods by guiding reflection and generating aligned, child-centered solutions through our evidence-based 7-step process.',
  businessPhone: '',
  businessEmail: 'hello@bealigned.app',
  businessAddress: '',
  
  canonicalBase: 'https://bealigned.app'
}

const SEOContext = createContext<SEOContextType | undefined>(undefined)

export function SEOProvider({ children }: { children: React.ReactNode }) {
  const [seoData, setSeoData] = useState<SEOData>(defaultSEOData)
  
  useEffect(() => {
    // In the future, load from AsyncStorage or API
    loadSEOData()
  }, [])
  
  const loadSEOData = async () => {
    try {
      // TODO: Load from AsyncStorage or Supabase
      // const stored = await AsyncStorage.getItem('seoData')
      // if (stored) setSeoData(JSON.parse(stored))
    } catch (error) {
      console.error('Failed to load SEO data:', error)
    }
  }
  
  const updateSEOData = async (data: Partial<SEOData>) => {
    const newSeoData = { ...seoData, ...data }
    setSeoData(newSeoData)
    
    try {
      // TODO: Save to AsyncStorage or Supabase
      // await AsyncStorage.setItem('seoData', JSON.stringify(newSeoData))
    } catch (error) {
      console.error('Failed to save SEO data:', error)
    }
  }
  
  const getSEOForPage = (page: string) => {
    const pageMap: Record<string, { title: string, description: string, keywords: string }> = {
      'home': {
        title: seoData.homeTitle,
        description: seoData.homeDescription,
        keywords: seoData.homeKeywords
      },
      'our-story': {
        title: seoData.ourStoryTitle,
        description: seoData.ourStoryDescription,
        keywords: seoData.ourStoryKeywords
      },
      'faq': {
        title: seoData.faqTitle,
        description: seoData.faqDescription,
        keywords: seoData.faqKeywords
      },
      'contact': {
        title: seoData.contactTitle,
        description: seoData.contactDescription,
        keywords: seoData.contactKeywords
      },
      'login': {
        title: seoData.loginTitle,
        description: seoData.loginDescription,
        keywords: seoData.loginKeywords
      },
      'signup': {
        title: seoData.signupTitle,
        description: seoData.signupDescription,
        keywords: seoData.signupKeywords
      },
      'confirm-email': {
        title: seoData.confirmEmailTitle,
        description: seoData.confirmEmailDescription,
        keywords: seoData.confirmEmailKeywords
      }
    }
    
    const pageData = pageMap[page] || pageMap['home']
    const canonical = page === 'home' ? seoData.canonicalBase : `${seoData.canonicalBase}/${page}`
    
    return {
      ...pageData,
      canonical
    }
  }
  
  return (
    <SEOContext.Provider value={{ seoData, updateSEOData, getSEOForPage }}>
      {children}
    </SEOContext.Provider>
  )
}

export function useSEO() {
  const context = useContext(SEOContext)
  if (!context) {
    throw new Error('useSEO must be used within a SEOProvider')
  }
  return context
}
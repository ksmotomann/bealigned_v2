import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useSEO } from '../context/SEOContext'

interface SEOHeadProps {
  page: string
  customTitle?: string
  customDescription?: string
  customKeywords?: string
  customImage?: string
}

export default function SEOHead({ 
  page, 
  customTitle, 
  customDescription, 
  customKeywords,
  customImage 
}: SEOHeadProps) {
  const { seoData, getSEOForPage } = useSEO()
  const pageData = getSEOForPage(page)
  
  const title = customTitle || pageData.title
  const description = customDescription || pageData.description
  const keywords = customKeywords || pageData.keywords
  const image = customImage || seoData.ogImage
  const canonical = pageData.canonical
  
  useEffect(() => {
    if (Platform.OS !== 'web') return
    
    // Update document title
    if (typeof document !== 'undefined') {
      document.title = title
    }
    
    // Function to set or update meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      if (typeof document === 'undefined') return
      
      const attribute = property ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${name}"]`)
      
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, name)
        document.head.appendChild(meta)
      }
      
      meta.setAttribute('content', content)
    }
    
    // Function to set link tags
    const setLinkTag = (rel: string, href: string) => {
      if (typeof document === 'undefined') return
      
      let link = document.querySelector(`link[rel="${rel}"]`)
      
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', rel)
        document.head.appendChild(link)
      }
      
      link.setAttribute('href', href)
    }
    
    // Basic meta tags
    setMetaTag('description', description)
    setMetaTag('keywords', keywords)
    
    // Open Graph tags
    setMetaTag('og:title', title, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:image', image, true)
    setMetaTag('og:url', canonical, true)
    setMetaTag('og:type', 'website', true)
    setMetaTag('og:site_name', seoData.siteName, true)
    
    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
    setMetaTag('twitter:image', image)
    if (seoData.twitterHandle) {
      setMetaTag('twitter:site', seoData.twitterHandle)
      setMetaTag('twitter:creator', seoData.twitterHandle)
    }
    
    // Canonical URL
    setLinkTag('canonical', canonical)
    
    // Additional meta tags
    setMetaTag('robots', 'index, follow')
    setMetaTag('author', seoData.businessName)
    setMetaTag('viewport', 'width=device-width, initial-scale=1')
    
    // Add JSON-LD structured data
    addStructuredData(page, { title, description, canonical })
    
    // Add Google Analytics if configured
    if (seoData.googleAnalyticsId) {
      addGoogleAnalytics(seoData.googleAnalyticsId)
    }
    
  }, [title, description, keywords, image, canonical, page, seoData])
  
  const addStructuredData = (page: string, data: { title: string, description: string, canonical: string }) => {
    if (typeof document === 'undefined') return
    
    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]')
    if (existing) existing.remove()
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': page === 'home' ? 'Organization' : 'WebPage',
      name: seoData.businessName,
      description: seoData.businessDescription,
      url: seoData.siteUrl,
      ...(page === 'home' && {
        '@type': 'Organization',
        email: seoData.businessEmail,
        ...(seoData.businessPhone && { telephone: seoData.businessPhone }),
        ...(seoData.businessAddress && { address: seoData.businessAddress }),
        sameAs: [
          // Add social media URLs here when available
        ]
      }),
      ...(page !== 'home' && {
        '@type': 'WebPage',
        headline: data.title,
        description: data.description,
        url: data.canonical,
        isPartOf: {
          '@type': 'WebSite',
          name: seoData.siteName,
          url: seoData.siteUrl
        }
      })
    }
    
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData, null, 2)
    document.head.appendChild(script)
  }
  
  const addGoogleAnalytics = (gaId: string) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return
    
    // Check if GA is already loaded
    if (document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)) return
    
    // Add GA script
    const gaScript = document.createElement('script')
    gaScript.async = true
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(gaScript)
    
    // Add GA config script
    const configScript = document.createElement('script')
    configScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `
    document.head.appendChild(configScript)
  }
  
  // This component doesn't render anything visible
  return null
}
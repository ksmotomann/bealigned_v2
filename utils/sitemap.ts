interface SitemapUrl {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function generateSitemap(baseUrl: string = 'https://bealigned.app'): string {
  const now = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  const urls: SitemapUrl[] = [
    {
      url: baseUrl,
      lastmod: now,
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      url: `${baseUrl}/our-story`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/faq`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/contact`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/login`,
      lastmod: now,
      changefreq: 'yearly',
      priority: 0.5
    }
  ]
  
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${priority ? `<priority>${priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`
  
  return sitemapXml
}

export function saveSitemapToPublic() {
  if (typeof window !== 'undefined') {
    console.warn('saveSitemapToPublic should only be called on the server side')
    return
  }
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    const publicDir = path.join(process.cwd(), 'public')
    const sitemapPath = path.join(publicDir, 'sitemap.xml')
    
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
    
    const sitemapXml = generateSitemap()
    fs.writeFileSync(sitemapPath, sitemapXml, 'utf8')
    
    console.log('Sitemap generated successfully at:', sitemapPath)
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
  }
}
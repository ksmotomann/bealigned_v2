import React, { useState, useEffect } from "react";

const FIGMA_URL = "https://bealigned.figma.site/";

export default function LandingPage() {
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    // Hide header when iframe is focused/clicked
    const handleFocus = () => {
      setShowHeader(false);
    };

    // Show header when clicking outside iframe
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('iframe')) {
        setShowHeader(true);
      }
    };

    // Listen for iframe interaction
    window.addEventListener('blur', handleFocus);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('blur', handleFocus);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0 }}>
      {/* Fixed header matching overlay_banner.png design */}
      {showHeader && (
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            zIndex: 10,
            background: "#ffffff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
        {/* Logo */}
        <a href="/" style={{ 
          fontSize: "28px",
          fontWeight: 600,
          textDecoration: "none",
          color: "#333"
        }}>
          <span style={{ color: "#5BA4CF" }}>Be</span>
          <span style={{ color: "#333" }}>Aligned</span>
        </a>

        {/* Center Navigation */}
        <nav style={{ 
          display: "flex", 
          gap: "40px",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)"
        }}>
          <a href="#about" style={{ 
            textDecoration: "none", 
            color: "#666",
            fontSize: "16px",
            fontWeight: 500
          }}>
            About
          </a>
          <a href="#how-it-works" style={{ 
            textDecoration: "none", 
            color: "#666",
            fontSize: "16px",
            fontWeight: 500
          }}>
            How It Works
          </a>
          <a href="#contact" style={{ 
            textDecoration: "none", 
            color: "#666",
            fontSize: "16px",
            fontWeight: 500
          }}>
            Contact
          </a>
          <a href="#faq" style={{ 
            textDecoration: "none", 
            color: "#666",
            fontSize: "16px",
            fontWeight: 500
          }}>
            FAQ
          </a>
        </nav>

        {/* Login Button */}
        <a
          href="/login"
          style={{
            textDecoration: "none",
            padding: "10px 30px",
            borderRadius: "6px",
            backgroundColor: "#5BA4CF",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 500
          }}
        >
          Login
        </a>
        </header>
      )}

      {/* SEO-friendly hidden content for search engines */}
      <div 
        style={{ 
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden"
        }}
        aria-hidden="false"
      >
        <h1>BeAligned - Transform Your Co-Parenting Journey</h1>
        
        <section>
          <h2>Compassionate AI-Powered Co-Parenting Support</h2>
          <p>
            BeAligned is your trusted partner in navigating the complexities of co-parenting. 
            Our innovative platform combines artificial intelligence with evidence-based communication 
            strategies to help separated parents build healthier, more effective relationships 
            for the benefit of their children.
          </p>
        </section>

        <section>
          <h2>How BeAligned Works</h2>
          <p>
            Our AI-guided conversation system walks you through seven essential phases of 
            co-parenting communication, helping you identify challenges, develop solutions, 
            and create sustainable parenting agreements that work for everyone involved.
          </p>
          <ul>
            <li>Phase 1: Understanding Your Current Situation</li>
            <li>Phase 2: Identifying Communication Patterns</li>
            <li>Phase 3: Exploring Your Children's Needs</li>
            <li>Phase 4: Building Effective Communication Strategies</li>
            <li>Phase 5: Creating Parenting Agreements</li>
            <li>Phase 6: Managing Conflict Resolution</li>
            <li>Phase 7: Planning for Long-term Success</li>
          </ul>
        </section>

        <section>
          <h2>Why Choose BeAligned?</h2>
          <ul>
            <li>Evidence-based approach to co-parenting communication</li>
            <li>24/7 availability - get support when you need it most</li>
            <li>Private and confidential conversations</li>
            <li>Personalized guidance tailored to your unique situation</li>
            <li>Track your progress and celebrate improvements</li>
            <li>Expert-reviewed content and strategies</li>
            <li>Affordable alternative to traditional mediation</li>
          </ul>
        </section>

        <section>
          <h2>Features That Make a Difference</h2>
          <p>
            <strong>AI-Powered Conversations:</strong> Our intelligent system understands context 
            and provides relevant, compassionate responses to help you navigate difficult conversations.
          </p>
          <p>
            <strong>Document Generation:</strong> Create professional co-parenting agreements, 
            schedules, and communication plans that you can share with legal professionals.
          </p>
          <p>
            <strong>Progress Tracking:</strong> Monitor your journey and see how your communication 
            improves over time with our analytics dashboard.
          </p>
          <p>
            <strong>Resource Library:</strong> Access curated articles, templates, and tools 
            to support your co-parenting journey.
          </p>
        </section>

        <section>
          <h2>Start Your Journey Today</h2>
          <p>
            Join thousands of parents who have transformed their co-parenting relationships 
            with BeAligned. Whether you're newly separated or looking to improve an existing 
            co-parenting arrangement, our platform provides the tools and support you need 
            to create a positive environment for your children.
          </p>
          <p>
            Sign up now for a free trial and experience the difference that compassionate, 
            AI-guided support can make in your co-parenting journey.
          </p>
        </section>

        <footer>
          <p>© 2024 BeAligned. All rights reserved.</p>
          <nav>
            <a href="/about">About Us</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/pricing">Pricing</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/blog">Blog</a>
            <a href="/resources">Resources</a>
            <a href="/faq">FAQ</a>
          </nav>
        </footer>
      </div>

      {/* Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "BeAligned",
            "applicationCategory": "LifestyleApplication",
            "operatingSystem": "Web",
            "description": "AI-powered co-parenting support platform that helps separated parents communicate effectively and create positive outcomes for their children.",
            "url": "https://bealigned.app",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "eligibleRegion": {
                "@type": "Place",
                "name": "Worldwide"
              }
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            },
            "creator": {
              "@type": "Organization",
              "name": "BeAligned",
              "url": "https://bealigned.app"
            }
          })
        }}
      />

      {/* Figma site embedded full-viewport */}
      <iframe
        title="BeAligned - Co-Parenting Support Platform"
        src={FIGMA_URL}
        style={{ border: "0", width: "100%", height: "100%" }}
        allowFullScreen
        aria-label="BeAligned interactive prototype demonstration"
      />
    </div>
  );
}

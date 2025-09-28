import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface RippleBackgroundProps {
  children: React.ReactNode
  style?: any
  backgroundColor?: string
  rippleColor?: string
  amplitude?: number
  wavelength?: number
  propagationSpeed?: number
  spawnInterval?: number
  maxRipples?: number
}

export default function RippleBackground({
  children,
  style,
  backgroundColor = '#F9FAFB',
  rippleColor = 'rgba(94, 195, 234, 0.15)',
  amplitude = 3,
  wavelength = 80,
  propagationSpeed = 120,
  spawnInterval = 2500,
  maxRipples = 4,
}: RippleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const ripplesRef = useRef<Array<{ x: number; y: number; startTime: number }>>([])
  const lastSpawnRef = useRef<number>(0)

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web' || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      const container = canvas.parentElement
      if (container) {
        const rect = container.getBoundingClientRect()
        canvas.width = rect.width * window.devicePixelRatio
        canvas.height = rect.height * window.devicePixelRatio
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    // Animation loop
    const animate = (timestamp: number) => {
      const W = canvas.width / window.devicePixelRatio
      const H = canvas.height / window.devicePixelRatio

      // Clear canvas
      ctx.clearRect(0, 0, W, H)
      
      // Draw background
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, W, H)

      // Spawn new ripples
      if (timestamp - lastSpawnRef.current > spawnInterval) {
        if (ripplesRef.current.length < maxRipples) {
          // Random position within center area
          const x = W * 0.3 + Math.random() * W * 0.4
          const y = H * 0.3 + Math.random() * H * 0.4
          ripplesRef.current.push({ x, y, startTime: timestamp })
        }
        lastSpawnRef.current = timestamp
      }

      // Remove old ripples
      ripplesRef.current = ripplesRef.current.filter(ripple => {
        const age = (timestamp - ripple.startTime) / 1000
        return age < 3.5 // Keep ripples for 3.5 seconds
      })

      // Draw ripples
      ripplesRef.current.forEach(ripple => {
        const age = (timestamp - ripple.startTime) / 1000
        const maxRadius = 200 // Maximum radius for ripples
        
        // Draw ripples from largest to smallest (inward effect)
        for (let ring = 0; ring < 5; ring++) {
          // Start from the largest radius and work inward
          const baseRadius = maxRadius - (propagationSpeed * 0.5) * age + ring * (wavelength * 0.8)
          
          // Draw main wave (more perfectly circular with minimal variation)
          if (baseRadius > 10 && baseRadius < maxRadius) {
            const decay = Math.exp(-0.4 * age)
            const distanceFade = Math.max(0, 1 - (baseRadius / maxRadius))
            const opacity = Math.max(0, (0.4 - ring * 0.05) * decay * distanceFade)
            
            if (opacity > 0.01) {
              ctx.beginPath()
              // Create nearly perfect circles with very minimal variation
              const points = 64 // More points for smoother circles
              for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2
                // Very subtle variation for natural effect - much less than before
                const variation = Math.sin(angle * 3 + age * 0.8) * 0.3 + Math.cos(angle * 5 + age * 1.1) * 0.2
                const organicRadius = baseRadius + variation
                const x = ripple.x + Math.cos(angle) * organicRadius
                const y = ripple.y + Math.sin(angle) * organicRadius
                
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
              }
              ctx.closePath()
              ctx.strokeStyle = `rgba(94, 195, 234, ${opacity})`
              ctx.lineWidth = Math.max(0.5, 1.5 - ring * 0.2)
              ctx.stroke()
            }
          }
        }
      })

      // Add subtle gradient overlay for depth
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.6)
      gradient.addColorStop(0, 'rgba(255,255,255,0)')
      gradient.addColorStop(1, 'rgba(94, 195, 234, 0.03)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, W, H)

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateSize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [amplitude, wavelength, propagationSpeed, spawnInterval, maxRipples, backgroundColor, rippleColor])

  // For non-web platforms, just show a static background
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        {children}
      </View>
    )
  }

  // Web platform with canvas
  return (
    <View style={[styles.container, style]}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
})
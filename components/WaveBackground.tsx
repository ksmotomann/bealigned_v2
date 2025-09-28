import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import ds from '../styles/design-system'

interface WaveBackgroundProps {
  children: React.ReactNode
  style?: any
  // Customizable parameters
  amplitudeMain?: number
  wavelengthMain?: number
  speedMain?: number
  amplitudeMicro?: number
  wavelengthMicro?: number
  speedMicro?: number
  phaseAcrossX?: number
  chromaMaxPx?: number
  duration?: number
  baseColors?: string[]
}

export default function WaveBackground({
  children,
  style,
  amplitudeMain = 12,
  wavelengthMain = 150,
  speedMain = 0.65,
  amplitudeMicro = 2,
  wavelengthMicro = 45,
  speedMicro = 1.2,
  phaseAcrossX = Math.PI / 3,
  chromaMaxPx = 1.2,
  duration = 9,
  baseColors = ds.gradients.hero,
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>()

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
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    // Create gradient background
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      if (baseColors.length === 2) {
        gradient.addColorStop(0, baseColors[0])
        gradient.addColorStop(1, baseColors[1])
      } else if (baseColors.length >= 3) {
        gradient.addColorStop(0, baseColors[0])
        gradient.addColorStop(0.5, baseColors[1])
        gradient.addColorStop(1, baseColors[2])
      } else {
        // Fallback for single color
        gradient.addColorStop(0, baseColors[0] || '#5EC3EA')
        gradient.addColorStop(1, baseColors[0] || '#87CEEB')
      }
      return gradient
    }

    // Envelope function for fade in/out
    const envelope = (t: number): number => {
      const tt = Math.min(Math.max((t - 0.3) / (duration - 0.6), 0), 1)
      const ease = tt < 0.5 
        ? 4 * tt * tt * tt 
        : 1 - Math.pow(-2 * tt + 2, 3) / 2
      return 0.2 + 0.8 * ease // Keep 20% floor for idle jitter
    }

    // Animation frame
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const t = (timestamp - startTimeRef.current) / 1000

      const W = canvas.width
      const H = canvas.height
      const E = envelope(t % duration)

      // Clear and draw base gradient
      ctx.fillStyle = createGradient()
      ctx.fillRect(0, 0, W, H)

      // Create displacement effect
      const imageData = ctx.getImageData(0, 0, W, H)
      const data = imageData.data
      const output = new Uint8ClampedArray(data.length)

      const ω1 = 2 * Math.PI * speedMain
      const ω2 = 2 * Math.PI * speedMicro

      for (let y = 0; y < H; y++) {
        const yTerm1 = (2 * Math.PI / wavelengthMain) * y - ω1 * t
        const yTerm2 = (2 * Math.PI / wavelengthMicro) * y + ω2 * t

        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4
          const φx = phaseAcrossX * (x / W)
          
          // Main wave
          const dy1 = amplitudeMain * Math.sin(yTerm1 + φx)
          // Micro ripple
          const dy2 = amplitudeMicro * Math.sin(yTerm2 + 0.5 * x * (2 * Math.PI / wavelengthMicro))
          
          const d = (dy1 + dy2) * E
          const shift = chromaMaxPx * Math.min(1, Math.abs(d) / (amplitudeMain + amplitudeMicro))

          // Sample with displacement and chromatic aberration
          const sample = (sx: number, sy: number) => {
            sx = Math.max(0, Math.min(W - 1, Math.floor(sx)))
            sy = Math.max(0, Math.min(H - 1, Math.floor(sy)))
            const sidx = (sy * W + sx) * 4
            return [data[sidx], data[sidx + 1], data[sidx + 2], data[sidx + 3]]
          }

          // Sample RGB channels with chromatic shift
          const [rR] = sample(x, y + d - shift)
          const [, gG] = sample(x, y + d)
          const [, , bB] = sample(x, y + d + shift)

          output[idx] = rR
          output[idx + 1] = gG
          output[idx + 2] = bB
          output[idx + 3] = 255
        }
      }

      // Apply the displaced image
      const outputImage = new ImageData(output, W, H)
      ctx.putImageData(outputImage, 0, 0)

      // Add subtle vignette
      const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.7)
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.12)')
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
  }, [
    amplitudeMain, wavelengthMain, speedMain,
    amplitudeMicro, wavelengthMicro, speedMicro,
    phaseAcrossX, chromaMaxPx, duration, baseColors
  ])

  // For non-web platforms, fall back to LinearGradient
  if (Platform.OS !== 'web') {
    return (
      <LinearGradient
        colors={baseColors}
        style={[styles.container, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
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
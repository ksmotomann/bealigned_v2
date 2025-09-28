import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'
import ds from '../styles/design-system'

interface WaveBackgroundProps {
  children: React.ReactNode
  style?: any
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
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Envelope function for smooth transitions
    const envelope = (t: number): number => {
      const cycleTime = t % duration
      const tt = Math.min(Math.max((cycleTime - 0.3) / (duration - 0.6), 0), 1)
      const ease = tt < 0.5 
        ? 4 * tt * tt * tt 
        : 1 - Math.pow(-2 * tt + 2, 3) / 2
      return 0.3 + 0.7 * ease // Keep 30% minimum for constant motion
    }

    // Animation loop
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const t = (timestamp - startTimeRef.current) / 1000
      const E = envelope(t)

      const W = canvas.width / window.devicePixelRatio
      const H = canvas.height / window.devicePixelRatio

      // Clear canvas
      ctx.clearRect(0, 0, W, H)

      // Create base gradient
      const gradient = ctx.createLinearGradient(0, 0, W, H)
      if (baseColors.length === 2) {
        gradient.addColorStop(0, baseColors[0])
        gradient.addColorStop(1, baseColors[1])
      } else if (baseColors.length >= 3) {
        gradient.addColorStop(0, baseColors[0])
        gradient.addColorStop(0.5, baseColors[1])
        gradient.addColorStop(1, baseColors[2])
      }

      // Draw base gradient
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, W, H)

      // Create wave overlay effect with multiple layers
      const ω1 = 2 * Math.PI * speedMain
      const ω2 = 2 * Math.PI * speedMicro

      // Draw wave distortion lines
      ctx.globalCompositeOperation = 'overlay'
      
      for (let y = 0; y < H; y += 3) {
        const φx = phaseAcrossX * (0.5)
        const dy1 = amplitudeMain * Math.sin((2 * Math.PI / wavelengthMain) * y - ω1 * t + φx)
        const dy2 = amplitudeMicro * Math.sin((2 * Math.PI / wavelengthMicro) * y + ω2 * t)
        const displacement = (dy1 + dy2) * E

        // Create wave effect with opacity based on displacement
        const opacity = Math.abs(displacement) / (amplitudeMain + amplitudeMicro) * 0.3
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, y)
        
        // Create wavy line across the width
        for (let x = 0; x < W; x += 10) {
          const xPhase = phaseAcrossX * (x / W)
          const localDisplacement = amplitudeMain * Math.sin((2 * Math.PI / wavelengthMain) * y - ω1 * t + xPhase) * E
          ctx.lineTo(x, y + localDisplacement)
        }
        ctx.stroke()
      }

      // Add shimmer effect
      ctx.globalCompositeOperation = 'screen'
      const shimmerGradient = ctx.createLinearGradient(0, 0, W, 0)
      const shimmerOffset = (t * 100) % W
      shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      shimmerGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.1 * E})`)
      shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.fillStyle = shimmerGradient
      ctx.save()
      ctx.translate(shimmerOffset - W/2, 0)
      ctx.fillRect(0, 0, W * 2, H)
      ctx.restore()

      // Add subtle vignette
      ctx.globalCompositeOperation = 'multiply'
      const vignette = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.7)
      vignette.addColorStop(0, 'rgba(255,255,255,1)')
      vignette.addColorStop(0.7, 'rgba(255,255,255,1)')
      vignette.addColorStop(1, 'rgba(200,200,200,1)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)

      ctx.globalCompositeOperation = 'source-over'
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    amplitudeMain, wavelengthMain, speedMain,
    amplitudeMicro, wavelengthMicro, speedMicro,
    phaseAcrossX, chromaMaxPx, duration, baseColors
  ])

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        ...style,
      }}
    >
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
      <View style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </View>
    </div>
  )
}
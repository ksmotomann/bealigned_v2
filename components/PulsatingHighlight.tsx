import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Animated, LayoutChangeEvent } from 'react-native'

interface PulsatingHighlightProps {
  children: React.ReactNode
  color?: string
  ringCount?: number
  scale?: number
  duration?: number
  borderRadius?: number
}

interface ShapeRingProps {
  color: string
  width: number
  height: number
  borderRadius: number
  scale: number
  duration: number
  delay: number
}

function PulsatingShapeRing({ color, width, height, borderRadius, scale, duration, delay }: ShapeRingProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current // Start smaller than the object
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      // Reset values - start smaller and with layered opacity
      scaleAnim.setValue(0.85) // Start at 85% of object size

      // Create layered opacity effect based on delay (newer waves are darker)
      const ringIndex = delay / (duration / 3) // Assumes 3 rings
      const maxOpacity = 0.4 - (ringIndex * 0.1) // First ring: 0.4, second: 0.3, third: 0.2
      opacityAnim.setValue(maxOpacity)

      // Create the pulsating animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: scale, // Expand to target scale
          duration: duration,
          useNativeDriver: false, // Set to false for web compatibility
        }),
        Animated.timing(opacityAnim, {
          toValue: 0, // Fade to transparent
          duration: duration,
          useNativeDriver: false, // Set to false for web compatibility
        }),
      ]).start(() => {
        // Loop the animation
        animate()
      })
    }

    // Start animation with delay
    const timer = setTimeout(() => {
      animate()
    }, delay)

    return () => clearTimeout(timer)
  }, [scaleAnim, opacityAnim, scale, duration, delay])

  const ringStyle = {
    position: 'absolute' as const,
    width: width,
    height: height,
    backgroundColor: color,
    borderRadius: width * 0.5, // Elliptical shape
    left: -width / 2,
    top: -height / 2,
    transform: [{ scaleX: scaleAnim }, { scaleY: scaleAnim }],
    opacity: opacityAnim,
  }

  return (
    <Animated.View style={ringStyle} />
  )
}

export default function PulsatingHighlight({
  children,
  color = 'rgba(0,150,255,0.3)',
  ringCount = 3,
  scale = 2.0,
  duration = 2400, // Duration in milliseconds for React Native
  borderRadius = 16
}: PulsatingHighlightProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setDimensions({ width, height })
  }

  const rings = Array.from({ length: ringCount }, (_, index) => {
    const delay = (duration / ringCount) * index

    return (
      <PulsatingShapeRing
        key={index}
        color={color}
        width={dimensions.width}
        height={dimensions.height}
        borderRadius={borderRadius}
        scale={scale}
        duration={duration}
        delay={delay}
      />
    )
  })

  return (
    <View style={styles.container}>
      <View style={styles.content} onLayout={onLayout}>
        {children}
      </View>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <View style={[styles.rings, {
          left: dimensions.width / 2,
          top: dimensions.height / 2
        }]}>
          {rings}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  rings: {
    position: 'absolute',
    width: 0,
    height: 0,
    pointerEvents: 'none',
    zIndex: 10, // Higher z-index to appear on top as translucent overlay
  },
  content: {
    zIndex: 1,
    position: 'relative',
  },
})
import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Easing } from 'react-native'
import ds from '../styles/design-system'

interface TypingIndicatorProps {
  visible?: boolean
}

export function TypingIndicator({ visible = true }: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      const animateWave = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.sin), // Smooth wave-like motion
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        )
      }

      const animation = Animated.parallel([
        animateWave(dot1, 0),
        animateWave(dot2, 150),    // Shorter delays for flowing wave effect
        animateWave(dot3, 300),
      ])

      animation.start()

      return () => {
        animation.stop()
        dot1.setValue(0)
        dot2.setValue(0)
        dot3.setValue(0)
      }
    }
  }, [visible, dot1, dot2, dot3])

  const dotStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8], // More wave-like vertical movement
        }),
      },
      {
        scaleY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2], // Slight vertical stretching like water
        }),
      },
    ],
  })

  if (!visible) {
    return null
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dotStyle(dot1)]} />
      <Animated.View style={[styles.dot, dotStyle(dot2)]} />
      <Animated.View style={[styles.dot, dotStyle(dot3)]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginLeft: 20,
    gap: 6, // Space between water droplets
    paddingVertical: 12, // Some vertical padding for wave motion
  },
  dot: {
    width: 10,
    height: 6,
    borderRadius: 5, // More oval/water droplet shape
    backgroundColor: '#4FC3F7', // Water-like blue color
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
})
import React, { useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'

const WaveCircle = ({
  size = 100,
  color = '#FFFFFF',
  waveColor = 'rgba(0, 122, 255, 0.3)',
  waveCount = 3,
  duration = 3000,
  children
}) => {
  const waveAnimations = useRef(
    Array.from({ length: waveCount }, () => new Animated.Value(0))
  ).current

  useEffect(() => {
    const staggerDelay = duration / waveCount
    const animations = []
    const timeouts = []

    waveAnimations.forEach((animValue, index) => {
      const timeoutId = setTimeout(() => {
        animValue.setValue(0)
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        )
        animation.start()
        animations.push(animation)
      }, staggerDelay * index)

      timeouts.push(timeoutId)
    })

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      animations.forEach(animation => animation.stop())
      waveAnimations.forEach(animValue => animValue.stopAnimation())
    }
  }, [duration, waveCount])

  const maxScale = 2.5
  const containerSize = size * maxScale

  return (
    <View style={{
      width: containerSize,
      height: containerSize,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Animated wave rings */}
      {waveAnimations.map((animValue, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: waveColor,
            transform: [
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, maxScale],
                })
              }
            ],
            opacity: animValue.interpolate({
              inputRange: [0, 0.1, 1],
              outputRange: [0.8, 0.4, 0],
            })
          }}
        />
      ))}

      {/* Main circle with children */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        elevation: 1
      }}>
        {children}
      </View>
    </View>
  )
}

export default WaveCircle
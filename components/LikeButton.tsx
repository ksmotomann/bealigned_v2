import React, { useEffect, useRef } from 'react'
import { Pressable, Text, View, StyleSheet, Animated } from 'react-native'
import { Heart } from 'lucide-react-native'
import ds from '../styles/design-system'

interface LikeButtonProps {
  likes: number
  isLiked: boolean
  onPress: (e: any) => void
  isAnimating: boolean
}

export default function LikeButton({ likes, isLiked, onPress, isAnimating }: LikeButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isAnimating) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isAnimating])

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Heart
          size={14}
          color="#ef4444"
          strokeWidth={2}
          fill={isLiked ? '#ef4444' : 'none'}
        />
      </Animated.View>
      <Text style={styles.text}>{likes}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing[1],
  },
  text: {
    fontSize: ds.typography.fontSize.xs.size,
    color: ds.colors.text.tertiary,
    fontFamily: ds.typography.fontFamily.base,
  },
})

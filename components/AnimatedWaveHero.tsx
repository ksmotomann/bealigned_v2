import React from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import ds from '../styles/design-system'

interface AnimatedWaveHeroProps {
  children: React.ReactNode
  style?: any
  baseColors?: string[]
}

export default function AnimatedWaveHero({
  children,
  style,
  baseColors = ds.gradients.hero,
}: AnimatedWaveHeroProps) {
  
  // For native platforms, use LinearGradient
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

  // For web, use CSS animations
  return (
    <View style={[styles.container, style]}>
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${baseColors[0]} 0%, ${baseColors[1]} 50%, ${baseColors[2]} 100%)`,
          zIndex: 0,
        }}
      />
      
      {/* Animated wave layers */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Wave Layer 1 */}
        <svg
          style={{
            position: 'absolute',
            width: '200%',
            height: '100%',
            left: '-50%',
            animation: 'wave1 8s ease-in-out infinite',
          }}
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave1-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave1-gradient)"
            d="M0,140 C320,260,640,60,960,140 C1280,260,1600,60,1920,140 L1920,320 L0,320 Z"
          />
        </svg>

        {/* Wave Layer 2 */}
        <svg
          style={{
            position: 'absolute',
            width: '200%',
            height: '100%',
            left: '-50%',
            animation: 'wave2 12s ease-in-out infinite',
            animationDelay: '-2s',
          }}
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave2-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave2-gradient)"
            d="M0,240 C320,200,640,280,960,240 C1280,200,1600,280,1920,240 L1920,320 L0,320 Z"
          />
        </svg>

      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes wave1 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(-10%) translateY(-10px);
          }
          50% {
            transform: translateX(-20%) translateY(5px);
          }
          75% {
            transform: translateX(-10%) translateY(-5px);
          }
        }

        @keyframes wave2 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          33% {
            transform: translateX(10%) translateY(10px);
          }
          66% {
            transform: translateX(-5%) translateY(-8px);
          }
        }

        @keyframes wave3 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          20% {
            transform: translateX(5%) translateY(12px);
          }
          40% {
            transform: translateX(-10%) translateY(-6px);
          }
          60% {
            transform: translateX(8%) translateY(8px);
          }
          80% {
            transform: translateX(-3%) translateY(-10px);
          }
        }

        /* Shimmer effect */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>

      {/* Shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          backgroundSize: '1000px 100%',
          animation: 'shimmer 8s linear infinite',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
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
    zIndex: 3,
  },
})
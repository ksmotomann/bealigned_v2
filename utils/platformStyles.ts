import { Platform } from 'react-native'

interface ShadowProps {
  color?: string
  offset?: { width: number; height: number }
  opacity?: number
  radius?: number
  elevation?: number
}

interface TextShadowProps {
  color?: string
  offset?: { width: number; height: number }
  radius?: number
}

/**
 * Creates cross-platform shadow styles
 * On web, uses boxShadow; on native, uses individual shadow properties
 */
export function createShadow(props: ShadowProps): any {
  const {
    color = '#000',
    offset = { width: 0, height: 2 },
    opacity = 0.1,
    radius = 4,
    elevation = 2
  } = props

  if (Platform.OS === 'web') {
    // Handle hex colors
    let rgba: string
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16) || 0
      const g = parseInt(color.slice(3, 5), 16) || 0
      const b = parseInt(color.slice(5, 7), 16) || 0
      rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`
    } else {
      // Assume it's already in a valid format (rgb, rgba, etc)
      rgba = color
    }
    
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${rgba}`,
      elevation // Keep elevation for Android web
    }
  }
  
  // Native platforms (iOS and Android)
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation
  }
}

/**
 * Creates cross-platform text shadow styles
 * On web, uses textShadow; on native, uses individual text shadow properties
 */
export function createTextShadow(props: TextShadowProps): any {
  const {
    color = 'rgba(0, 0, 0, 0.1)',
    offset = { width: 0, height: 1 },
    radius = 2
  } = props

  if (Platform.OS === 'web') {
    return {
      textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`
    }
  }
  
  // Native platforms
  return {
    textShadowColor: color,
    textShadowOffset: offset,
    textShadowRadius: radius
  }
}

/**
 * Helper to apply pointer events style correctly
 */
export function pointerEvents(value: 'none' | 'auto' | 'box-none' | 'box-only') {
  if (Platform.OS === 'web') {
    return { pointerEvents: value } as any
  }
  return { pointerEvents: value }
}
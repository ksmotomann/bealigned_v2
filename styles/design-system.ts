// BeAligned Design System
// Based on Figma specifications - Single source of truth for all design decisions
import { createShadow } from '../utils/platformStyles'

export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#5EC3EA',      // Primary blue - water theme
    light: '#87CEEB',     // Sky blue
    lighter: '#B0E0E6',   // Powder blue
    lightest: '#E6F3FF',  // Ice blue
    dark: '#4A90E2',      // Deep water blue
  },
  
  // Neutrals
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Functional Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Chart Colors for Data Visualization
  chart: {
    primary: '#5EC3EA',
    secondary: '#87CEEB',
    tertiary: '#B0E0E6',
    quaternary: '#4A90E2',
    accent1: '#10B981',
    accent2: '#F59E0B',
    accent3: '#8B5CF6',
    accent4: '#EC4899',
  },
  
  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  // Text
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
}

export const typography = {
  // Font Family - Nunito
  fontFamily: {
    base: 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'monospace',
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Font Sizes & Line Heights
  fontSize: {
    xs: { size: 12, lineHeight: 16 },
    sm: { size: 14, lineHeight: 20 },
    base: { size: 16, lineHeight: 24 },
    lg: { size: 18, lineHeight: 28 },
    xl: { size: 20, lineHeight: 32 },
    '2xl': { size: 24, lineHeight: 36 },
    '3xl': { size: 30, lineHeight: 42 },
    '4xl': { size: 36, lineHeight: 48 },
    '5xl': { size: 48, lineHeight: 56 },
    '6xl': { size: 60, lineHeight: 72 },
  },
}

export const spacing = {
  // Based on Tailwind scale
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
}

export const borderRadius = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
}

export const shadows = {
  sm: createShadow({
    color: '#000',
    offset: { width: 0, height: 1 },
    opacity: 0.05,
    radius: 2,
    elevation: 1,
  }),
  base: createShadow({
    color: '#000',
    offset: { width: 0, height: 2 },
    opacity: 0.1,
    radius: 4,
    elevation: 2,
  }),
  md: createShadow({
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.12,
    radius: 8,
    elevation: 3,
  }),
  lg: createShadow({
    color: '#000',
    offset: { width: 0, height: 8 },
    opacity: 0.15,
    radius: 12,
    elevation: 4,
  }),
  xl: createShadow({
    color: '#000',
    offset: { width: 0, height: 12 },
    opacity: 0.18,
    radius: 16,
    elevation: 5,
  }),
}

export const gradients = {
  hero: ['#5FA8D3', '#7FC4E8', '#9FD8EC'],
  heroReverse: ['#9FD8EC', '#7FC4E8', '#5FA8D3'],
  cta: ['#4A90E2', '#5EC3EA'],
  ctaReverse: ['#5EC3EA', '#4A90E2'],
  light: ['#E6F3FF', '#F3F4F6'],
  water: ['rgba(94, 195, 234, 0.1)', 'rgba(135, 206, 235, 0.05)', 'rgba(176, 224, 230, 0)'],
}

export const animations = {
  // 12 Water dynamics theme animations
  wave: {
    duration: 4000,
    easing: 'ease-in-out',
  },
  ripple: {
    duration: 2000,
    easing: 'ease-out',
  },
  float: {
    duration: 3000,
    easing: 'ease-in-out',
  },
  bubble: {
    duration: 5000,
    easing: 'linear',
  },
  tide: {
    duration: 8000,
    easing: 'ease-in-out',
  },
  splash: {
    duration: 800,
    easing: 'ease-out',
  },
  flow: {
    duration: 6000,
    easing: 'linear',
  },
  drift: {
    duration: 10000,
    easing: 'ease-in-out',
  },
  cascade: {
    duration: 1500,
    easing: 'ease-in',
  },
  swirl: {
    duration: 3500,
    easing: 'ease-in-out',
  },
  pulse: {
    duration: 2500,
    easing: 'ease-in-out',
  },
  shimmer: {
    duration: 1800,
    easing: 'linear',
  },
}

export const breakpoints = {
  // Mobile-first responsive breakpoints
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export const containers = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  full: '100%',
}

// Component-specific styles
export const buttons = {
  primary: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary.main,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
  },
  text: {
    primary: {
      color: colors.text.inverse,
      fontSize: typography.fontSize.base.size,
      fontWeight: typography.fontWeight.semibold,
    },
    secondary: {
      color: colors.primary.main,
      fontSize: typography.fontSize.base.size,
      fontWeight: typography.fontWeight.semibold,
    },
  },
}

export const cards = {
  base: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    ...shadows.base,
  },
  elevated: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing[8],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
}

// Input System with Focus States
export const inputs = {
  base: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base.size,
    color: colors.text.primary,
  },
  focused: {
    borderColor: colors.primary.main,
    ...createShadow({
      color: colors.primary.main,
      offset: { width: 0, height: 0 },
      opacity: 0.2,
      radius: 4,
    }),
  },
  error: {
    borderColor: colors.error,
  },
  disabled: {
    backgroundColor: colors.neutral[50],
    color: colors.neutral[400],
  },
}

// Badge/Status System
export const badges = {
  default: {
    backgroundColor: colors.neutral[100],
    color: colors.text.secondary,
  },
  primary: {
    backgroundColor: colors.primary.lightest,
    color: colors.primary.dark,
  },
  success: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  warning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  info: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
}

// Navigation Components
export const navigation = {
  tab: {
    inactive: {
      color: colors.text.secondary,
      backgroundColor: 'transparent',
    },
    active: {
      color: colors.primary.main,
      backgroundColor: colors.primary.lightest,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary.main,
    },
  },
  link: {
    default: {
      color: colors.primary.main,
      textDecorationLine: 'none',
    },
    hover: {
      color: colors.primary.dark,
      textDecorationLine: 'underline',
    },
  },
}

// Accessibility
export const a11y = {
  minTouchTarget: 44, // Minimum touch target size
  focusOutlineWidth: 2,
  focusOutlineColor: colors.primary.main,
  contrastRatio: {
    normal: 4.5,
    large: 3,
  },
}

// Export as default for easy importing
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  gradients,
  animations,
  breakpoints,
  containers,
  buttons,
  cards,
  inputs,
  badges,
  navigation,
  a11y,
}
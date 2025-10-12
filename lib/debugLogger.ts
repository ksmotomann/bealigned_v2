/**
 * Debug Logger Utility
 *
 * Centralized logging system controlled by admin debug toggle.
 * Only logs when debug mode is enabled.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

let debugEnabled = false

// DISABLED: Debug logging is OFF by default
// Initialize debug state from storage (commented out to force OFF)
// AsyncStorage.getItem('debugLogging').then((value) => {
//   debugEnabled = value === 'true'
// }).catch(() => {
//   debugEnabled = false
// })

// Allow runtime updates to debug state
export const setDebugEnabled = (enabled: boolean) => {
  debugEnabled = enabled
}

export const getDebugEnabled = (): boolean => {
  return debugEnabled
}

// Debug logger that respects the debug flag
export const debugLog = (...args: any[]) => {
  if (debugEnabled) {
    console.log(...args)
  }
}

// Specific debug categories for granular control
export const debug = {
  log: (...args: any[]) => debugEnabled && console.log(...args),
  warn: (...args: any[]) => debugEnabled && console.warn(...args),
  info: (...args: any[]) => debugEnabled && console.info(...args),

  // Always log errors regardless of debug mode
  error: (...args: any[]) => console.error(...args),

  // Specific categories
  chat: (...args: any[]) => debugEnabled && console.log('[CHAT]', ...args),
  ai: (...args: any[]) => debugEnabled && console.log('[AI]', ...args),
  vector: (...args: any[]) => debugEnabled && console.log('[VECTOR]', ...args),
  phase: (...args: any[]) => debugEnabled && console.log('[PHASE]', ...args),
  db: (...args: any[]) => debugEnabled && console.log('[DB]', ...args),
  session: (...args: any[]) => debugEnabled && console.log('[SESSION]', ...args),
}

export default debug

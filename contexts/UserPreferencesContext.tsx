import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface UserPreferences {
  showPhasePrompts: boolean
  showStepGuidance: boolean
  autoAdvanceSteps: boolean
  showFeelingsHelper: boolean
  showNeedsHelper: boolean
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreference: (key: keyof UserPreferences, value: any) => Promise<void>
  loading: boolean
}

const defaultPreferences: UserPreferences = {
  showPhasePrompts: false,
  showStepGuidance: true,
  autoAdvanceSteps: true,
  showFeelingsHelper: true,
  showNeedsHelper: true
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const userSettings = data?.settings || {}
      setPreferences({
        showPhasePrompts: userSettings.showPhasePrompts ?? defaultPreferences.showPhasePrompts,
        showStepGuidance: userSettings.showStepGuidance ?? defaultPreferences.showStepGuidance,
        autoAdvanceSteps: userSettings.autoAdvanceSteps ?? defaultPreferences.autoAdvanceSteps,
        showFeelingsHelper: userSettings.showFeelingsHelper ?? defaultPreferences.showFeelingsHelper,
        showNeedsHelper: userSettings.showNeedsHelper ?? defaultPreferences.showNeedsHelper
      })
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(key: keyof UserPreferences, value: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update local state immediately for responsive UI
      setPreferences(prev => ({ ...prev, [key]: value }))

      // Get current profile settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()

      const currentSettings = profile?.settings || {}
      const newSettings = { ...currentSettings, [key]: value }

      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating preference:', error)
      // Revert local state on error
      loadPreferences()
    }
  }

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference, loading }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider')
  }
  return context
}
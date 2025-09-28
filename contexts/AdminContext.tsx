import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AdminContextType {
  adminViewEnabled: boolean
  setAdminViewEnabled: (enabled: boolean) => void
  isActualAdmin: boolean
  setIsActualAdmin: (isAdmin: boolean) => void
}

const AdminContext = createContext<AdminContextType>({
  adminViewEnabled: false,
  setAdminViewEnabled: () => {},
  isActualAdmin: false,
  setIsActualAdmin: () => {},
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminViewEnabled, setAdminViewEnabledState] = useState(false)
  const [isActualAdmin, setIsActualAdmin] = useState(false)

  useEffect(() => {
    loadAdminViewPreference()
  }, [])

  // Reload preferences when admin status changes
  useEffect(() => {
    loadAdminViewPreference()
    // If user is no longer an admin, disable admin view
    if (!isActualAdmin) {
      setAdminViewEnabledState(false)
    }
  }, [isActualAdmin])

  async function loadAdminViewPreference() {
    try {
      const saved = await AsyncStorage.getItem('adminViewEnabled')
      // Only load saved preference if user is actually an admin
      // This prevents regular users from enabling admin view through local storage manipulation
      if (saved !== null && isActualAdmin) {
        setAdminViewEnabledState(saved === 'true')
      }
    } catch (error) {
      console.error('Error loading admin view preference:', error)
    }
  }

  async function setAdminViewEnabled(enabled: boolean) {
    // Only allow admins to enable admin view
    if (enabled && !isActualAdmin) {
      console.warn('Non-admin user attempted to enable admin view')
      return
    }

    setAdminViewEnabledState(enabled)
    try {
      await AsyncStorage.setItem('adminViewEnabled', enabled.toString())
    } catch (error) {
      console.error('Error saving admin view preference:', error)
    }
  }

  return (
    <AdminContext.Provider 
      value={{ 
        adminViewEnabled, 
        setAdminViewEnabled,
        isActualAdmin,
        setIsActualAdmin
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
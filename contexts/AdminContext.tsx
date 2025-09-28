import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AdminContextType {
  adminViewEnabled: boolean
  setAdminViewEnabled: (enabled: boolean) => void
  isActualAdmin: boolean
  setIsActualAdmin: (isAdmin: boolean) => void
}

const AdminContext = createContext<AdminContextType>({
  adminViewEnabled: true,
  setAdminViewEnabled: () => {},
  isActualAdmin: false,
  setIsActualAdmin: () => {},
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminViewEnabled, setAdminViewEnabledState] = useState(true)
  const [isActualAdmin, setIsActualAdmin] = useState(false)

  useEffect(() => {
    loadAdminViewPreference()
  }, [])

  async function loadAdminViewPreference() {
    try {
      const saved = await AsyncStorage.getItem('adminViewEnabled')
      if (saved !== null) {
        setAdminViewEnabledState(saved === 'true')
      }
    } catch (error) {
      console.error('Error loading admin view preference:', error)
    }
  }

  async function setAdminViewEnabled(enabled: boolean) {
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
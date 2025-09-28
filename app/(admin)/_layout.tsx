import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      console.log('Admin Layout: Checking admin access...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('Admin Layout: No user found, redirecting to login')
        router.replace('/(auth)/login')
        return
      }

      console.log('Admin Layout: User found:', user.email)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      console.log('Admin Layout: Profile role:', profile?.role)
      if (profile?.role === 'admin') {
        console.log('Admin Layout: User is admin, granting access')
        setIsAdmin(true)
      } else {
        console.log('Admin Layout: User is not admin, redirecting to dashboard')
        router.replace('/(tabs)/dashboard')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.replace('/(tabs)/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Verifying access...</Text>
      </View>
    )
  }

  if (!isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Access denied</Text>
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="training" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="analytics" />
    </Stack>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
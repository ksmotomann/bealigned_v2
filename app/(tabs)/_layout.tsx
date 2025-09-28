import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide the bottom tab bar
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Reflect',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: null, // This hides it from navigation but keeps the route accessible
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Subscription',
          href: null, // This hides it from navigation but keeps the route accessible
        }}
      />
    </Tabs>
  )
}
// Test authentication status in the browser
// Copy and paste this into your browser console while logged into the app

console.log('🧪 Testing authentication status...')

// This should be run in the browser console while on your app
if (typeof window !== 'undefined' && window.supabase) {
  window.supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.log('❌ Auth error:', error)
    } else if (user) {
      console.log('✅ Authenticated as:', user.email)
      console.log('   User ID:', user.id)

      // Test profile lookup
      return window.supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()
    } else {
      console.log('❌ No authenticated user')
    }
  }).then((profileResult) => {
    if (profileResult) {
      const { data: profile, error } = profileResult
      if (error) {
        console.log('❌ Profile error:', error)
      } else {
        console.log('✅ Profile type:', profile.user_type)
        if (profile.user_type === 'admin') {
          console.log('🎯 You have admin privileges!')
          console.log('   The 403 error might be a session issue.')
          console.log('   Try refreshing the page or signing out/in.')
        } else {
          console.log('❌ Not admin! Current type:', profile.user_type)
        }
      }
    }
  })
} else {
  console.log('❌ Supabase client not found. Make sure you\'re on your app page.')
  console.log('   This script needs to run in the browser console while logged into your app.')
}
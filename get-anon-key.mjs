import dotenv from 'dotenv'

dotenv.config()

const accessToken = process.env.SUPABASE_ACCESS_TOKEN

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found in .env')
  process.exit(1)
}

console.log('🔑 Fetching anon key from Supabase Management API...\n')

try {
  const response = await fetch('https://api.supabase.com/v1/projects/oohrdabehxzzwdmpmcfv/api-keys', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    console.error(`❌ API returned ${response.status}: ${response.statusText}`)
    const text = await response.text()
    console.error('Response:', text)
    process.exit(1)
  }

  const keys = await response.json()

  const anonKey = keys.find(k => k.name === 'anon')
  const serviceRoleKey = keys.find(k => k.name === 'service_role')

  if (anonKey) {
    console.log('✅ Anon Key (for client-side/testing):')
    console.log(anonKey.api_key)
    console.log('')
  }

  if (serviceRoleKey) {
    console.log('🔐 Service Role Key (for server-side):')
    console.log(serviceRoleKey.api_key)
    console.log('')
  }

  console.log('\n📝 To test chat-v2, use the anon key with:')
  console.log('   --header "apikey: <anon_key>"')
  console.log('   --header "Authorization: Bearer <anon_key>"')

} catch (error) {
  console.error('❌ Error:', error.message)
}

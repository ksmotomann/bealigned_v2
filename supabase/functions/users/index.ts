import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p && p !== 'users')
    
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const userType = profile?.user_type || 'user'
    const isAdmin = userType === 'admin' || userType === 'super_admin'
    const isSuperAdmin = userType === 'super_admin'

    // Only admins can access user management
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /users - Get all users
    if (req.method === 'GET' && pathParts.length === 0) {
      console.log('🔍 Edge Function: Getting all users...')
      
      try {
        // Get all users (using service role key bypasses RLS)
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (userError) {
          console.error('❌ User error:', userError)
          throw new Error(`User query failed: ${userError.message}`)
        }

        console.log('✅ Found', users?.length || 0, 'users')
        
        // Get conversation counts
        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('user_id')
          .is('archived_at', null)

        if (convError) {
          console.error('⚠️ Conversation error (non-fatal):', convError)
        }

        // Create conversation count map
        const convCountMap = new Map()
        if (conversations) {
          const userConvCounts = conversations.reduce((acc, conv) => {
            acc[conv.user_id] = (acc[conv.user_id] || 0) + 1
            return acc
          }, {})
          
          Object.entries(userConvCounts).forEach(([userId, count]) => {
            convCountMap.set(userId, count)
          })
        }

        // Transform users to response format
        const usersData = users?.map(user => ({
          id: user.id,
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          full_name: user.full_name || '',
          user_type: user.user_type || 'user',
          is_active: user.is_active !== false,
          created_at: user.created_at,
          last_sign_in_at: user.last_seen || user.updated_at,
          conversation_count: convCountMap.get(user.id) || 0,
        })) || []

        console.log('✅ Returning', usersData.length, 'users')
        return new Response(JSON.stringify({ users: usersData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
        
      } catch (error) {
        console.error('❌ Database error in Edge Function:', error)
        throw new Error(`Database error finding users: ${error.message}`)
      }
    }

    // POST /users - Create new user (Super Admin only)
    if (req.method === 'POST' && pathParts.length === 0) {
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Only super admins can create users' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const body = await req.json()
      const { email, password, first_name, last_name, user_type = 'user' } = body

      // Create user in auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
        }
      })

      if (createError) throw createError

      // Update profile with user details
      await supabase
        .from('users')
        .update({
          user_type,
          first_name,
          last_name,
          full_name: `${first_name || ''} ${last_name || ''}`.trim(),
        })
        .eq('id', newUser.user.id)

      return new Response(JSON.stringify({ success: true, user: newUser.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /users/:id/status - Toggle user active status
    if (req.method === 'PUT' && pathParts.length === 2 && pathParts[1] === 'status') {
      const userId = pathParts[0]
      const body = await req.json()
      const { is_active } = body

      // For now, we'll track this in profiles
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /users/:id - Update user profile (Admin/Super Admin only)
    if (req.method === 'PUT' && pathParts.length === 1) {
      const userId = pathParts[0]
      const body = await req.json()
      const { first_name, last_name, user_type, is_active } = body

      console.log('🔍 Updating user:', userId, body)

      const { data, error } = await supabase
        .from('users')
        .update({ 
          first_name,
          last_name,
          full_name: `${first_name || ''} ${last_name || ''}`.trim(),
          user_type,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Update error:', error)
        throw error
      }

      console.log('✅ User updated successfully:', data)
      return new Response(JSON.stringify({ success: true, user: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }



    // POST /users/:id/reset-password - Reset user password (Admin/Super Admin only)
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'reset-password') {
      const userId = pathParts[0]
      const body = await req.json()
      const { password } = body

      console.log('🔍 Resetting password for user:', userId)

      // Reset password using admin API
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (error) {
        console.error('❌ Password reset error:', error)
        throw error
      }

      console.log('✅ Password reset successfully')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /users/:id - Delete user (Super Admin only)
    if (req.method === 'DELETE' && pathParts.length === 1) {
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Only super admins can delete users' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const userId = pathParts[0]
      
      // Delete from auth.users (this will cascade to profiles)
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
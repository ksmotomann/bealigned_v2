-- ============================================================================
-- Custom Authentication System - Database Schema
-- This replaces Supabase Auth with our own portable authentication
-- ============================================================================

-- Step 1: Create custom users table
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Authentication
  password_hash TEXT NOT NULL,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  
  -- User info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200),
  avatar_url TEXT,
  
  -- Role and permissions
  user_type VARCHAR(50) DEFAULT 'user' CHECK (user_type IN ('user', 'expert', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 2: Create sessions table for JWT management
CREATE TABLE IF NOT EXISTS public.app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT UNIQUE,
  
  -- Session info
  ip_address INET,
  user_agent TEXT,
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- Step 3: Create audit log for security
CREATE TABLE IF NOT EXISTS public.app_auth_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- login, logout, password_change, password_reset, etc.
  event_data JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_app_users_email ON public.app_users(email);
CREATE INDEX idx_app_users_user_type ON public.app_users(user_type);
CREATE INDEX idx_app_users_is_active ON public.app_users(is_active);
CREATE INDEX idx_app_sessions_user_id ON public.app_sessions(user_id);
CREATE INDEX idx_app_sessions_token_hash ON public.app_sessions(token_hash);
CREATE INDEX idx_app_sessions_expires_at ON public.app_sessions(expires_at);
CREATE INDEX idx_app_auth_audit_user_id ON public.app_auth_audit(user_id);
CREATE INDEX idx_app_auth_audit_created_at ON public.app_auth_audit(created_at);

-- Step 5: Create RLS policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_auth_audit ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON public.app_users
  FOR SELECT USING (id = auth.uid() OR auth.uid() IN (
    SELECT id FROM public.app_users WHERE user_type IN ('admin', 'super_admin')
  ));

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.app_users
  FOR UPDATE USING (id = auth.uid());

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.app_users
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM public.app_users WHERE user_type IN ('admin', 'super_admin')
  ));

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON public.app_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON public.app_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Step 6: Create helper functions
CREATE OR REPLACE FUNCTION public.app_hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use crypt for bcrypt hashing
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

CREATE OR REPLACE FUNCTION public.app_verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$;

CREATE OR REPLACE FUNCTION public.app_generate_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Step 7: Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Migrate existing users from auth.users and profiles
INSERT INTO public.app_users (
  id,
  email,
  email_verified,
  email_verified_at,
  password_hash,
  first_name,
  last_name,
  full_name,
  user_type,
  is_active,
  created_at,
  last_sign_in_at
)
SELECT 
  COALESCE(p.id, a.id),
  a.email,
  COALESCE(a.email_confirmed_at IS NOT NULL, false),
  a.email_confirmed_at,
  COALESCE(a.encrypted_password, public.app_hash_password('TempPassword123!')), -- Temporary password
  p.first_name,
  p.last_name,
  COALESCE(p.full_name, p.first_name || ' ' || p.last_name),
  COALESCE(p.user_type, 'user'),
  COALESCE(p.is_active, true),
  COALESCE(p.created_at, a.created_at),
  a.last_sign_in_at
FROM auth.users a
LEFT JOIN public.profiles p ON p.id = a.id
ON CONFLICT (email) DO UPDATE
SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  is_active = EXCLUDED.is_active;

-- Step 9: Update profiles table to reference new auth
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS app_user_id UUID REFERENCES public.app_users(id);

UPDATE public.profiles p
SET app_user_id = (SELECT id FROM public.app_users WHERE email = p.email);

-- Step 10: Grant permissions
GRANT ALL ON public.app_users TO authenticated;
GRANT ALL ON public.app_sessions TO authenticated;
GRANT ALL ON public.app_auth_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_hash_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_verify_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_generate_token TO authenticated;

-- Final status
SELECT 
  'Migration Complete' as status,
  COUNT(*) as users_migrated,
  'All users need to reset passwords' as note
FROM public.app_users;
-- Restore profiles table with user_type field
-- This combines the base schema with the user_type migration

-- Create enum type for user roles
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('user', 'expert', 'admin', 'super_admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    user_type user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    ai_queries_count INTEGER DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert the known users
INSERT INTO public.profiles (id, email, full_name, first_name, last_name, user_type, is_active) VALUES
    ('f29fb05e-b067-42f6-a5ea-80c3764e046e', 'ksmotomann@gmail.com', 'Robert Mann', 'Robert', 'Mann', 'super_admin', true),
    ('de314769-80ec-4b72-a802-40a328807123', 'trina@thelayneproject.com', 'Trina', 'Trina', '', 'super_admin', true),
    ('9ff56fe6-a69e-4a14-a0c8-a2fc13e47486', 'kankanalaranish@gmail.com', 'Anish', 'Anish', '', 'super_admin', true),
    ('fe62d710-632c-4e26-acec-9673270a1ab7', 'robert@freedomrallyracing.com', 'Robert', 'Robert', '', 'user', true)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    user_type = EXCLUDED.user_type,
    is_active = EXCLUDED.is_active;

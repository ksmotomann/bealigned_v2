-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invite_code VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    organization VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    accepted_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON public.invites(created_by);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all invites
CREATE POLICY "Admins can view all invites" ON public.invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can create invites
CREATE POLICY "Admins can create invites" ON public.invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can update invites
CREATE POLICY "Admins can update invites" ON public.invites
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Admins can delete invites
CREATE POLICY "Admins can delete invites" ON public.invites
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Public can check invite validity (for registration)
CREATE POLICY "Public can check invite validity" ON public.invites
    FOR SELECT
    USING (
        status = 'sent' 
        AND uses_count < max_uses 
        AND expires_at > NOW()
    );
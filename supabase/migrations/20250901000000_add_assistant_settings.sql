-- Create assistant_settings table
CREATE TABLE IF NOT EXISTS public.assistant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    instructions TEXT,
    model VARCHAR(100) DEFAULT 'gpt-4-turbo-preview',
    temperature DECIMAL(2,1) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,
    top_p DECIMAL(2,1) DEFAULT 1.0,
    frequency_penalty DECIMAL(2,1) DEFAULT 0.0,
    presence_penalty DECIMAL(2,1) DEFAULT 0.0,
    metadata JSONB DEFAULT '{}',
    knowledge_base_files JSONB DEFAULT '[]', -- Store file references
    tools JSONB DEFAULT '[]', -- Store enabled tools like retrieval, code_interpreter
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create index for active settings
CREATE INDEX idx_assistant_settings_active ON public.assistant_settings(is_active);

-- RLS policies
ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage assistant settings
CREATE POLICY "Super admins can manage assistant settings" ON public.assistant_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

-- All authenticated users can read active settings
CREATE POLICY "Users can read active assistant settings" ON public.assistant_settings
    FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_active = true);

-- Insert default settings
INSERT INTO public.assistant_settings (
    name,
    instructions,
    model,
    temperature,
    is_active
) VALUES (
    'Default Settings',
    '📋 BeAligned™ Beta Lite – Revised Operational Instructions

You are BeAligned™ Beta Lite — a warm, grounded, nonjudgmental reflection bot built to support one co-parent in thinking through a current challenge. Your goal is to guide the user through a 7-phase reflective process rooted in the BeH2O® communication framework and BeAligned™ mindset.

[Full instructions here...]',
    'gpt-4-turbo-preview',
    0.7,
    true
) ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assistant_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER assistant_settings_updated_at
    BEFORE UPDATE ON public.assistant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_assistant_settings_updated_at();

-- Function to ensure only one active setting
CREATE OR REPLACE FUNCTION ensure_single_active_assistant_setting()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE public.assistant_settings 
        SET is_active = false 
        WHERE id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active setting
CREATE TRIGGER ensure_single_active_assistant_setting
    BEFORE INSERT OR UPDATE ON public.assistant_settings
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION ensure_single_active_assistant_setting();
-- Create knowledge_base_files table for storing uploaded files
CREATE TABLE IF NOT EXISTS public.knowledge_base_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assistant_setting_id UUID REFERENCES public.assistant_settings(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_content TEXT, -- Store markdown/text content directly
    openai_file_id VARCHAR(255), -- OpenAI's file ID if uploaded to their system
    file_url TEXT, -- URL if stored externally
    purpose VARCHAR(50) DEFAULT 'assistants', -- OpenAI file purpose
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create index for assistant settings
CREATE INDEX idx_knowledge_base_files_setting ON public.knowledge_base_files(assistant_setting_id);

-- RLS policies
ALTER TABLE public.knowledge_base_files ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage knowledge base files
CREATE POLICY "Super admins can manage knowledge base files" ON public.knowledge_base_files
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

-- All authenticated users can read files for active assistant settings
CREATE POLICY "Users can read active knowledge base files" ON public.knowledge_base_files
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.assistant_settings
            WHERE assistant_settings.id = knowledge_base_files.assistant_setting_id
            AND assistant_settings.is_active = true
        )
    );
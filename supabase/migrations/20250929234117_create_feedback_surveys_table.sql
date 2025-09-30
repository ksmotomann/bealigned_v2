-- Create feedback_surveys table for post-reflection survey data
CREATE TABLE IF NOT EXISTS public.feedback_surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reflection_id UUID REFERENCES public.reflection_sessions(id) ON DELETE SET NULL,
    helpfulness_rating INTEGER NOT NULL CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    clarity_level TEXT NOT NULL CHECK (clarity_level IN ('yes', 'somewhat', 'no')),
    feeling_word TEXT,
    additional_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.feedback_surveys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own feedback surveys
CREATE POLICY "Users can view own feedback surveys" ON public.feedback_surveys
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback surveys
CREATE POLICY "Users can insert own feedback surveys" ON public.feedback_surveys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback surveys
CREATE POLICY "Users can update own feedback surveys" ON public.feedback_surveys
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own feedback surveys
CREATE POLICY "Users can delete own feedback surveys" ON public.feedback_surveys
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_feedback_surveys_user_id ON public.feedback_surveys(user_id);
CREATE INDEX idx_feedback_surveys_reflection_id ON public.feedback_surveys(reflection_id);
CREATE INDEX idx_feedback_surveys_created_at ON public.feedback_surveys(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_surveys_updated_at
    BEFORE UPDATE ON public.feedback_surveys
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
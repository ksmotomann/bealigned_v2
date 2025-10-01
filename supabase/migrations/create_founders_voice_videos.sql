-- Create founders_voice_videos table
CREATE TABLE IF NOT EXISTS public.founders_voice_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  duration_seconds INTEGER, -- Auto-populated from video metadata
  video_url TEXT,
  thumbnail_url TEXT,
  plays INTEGER DEFAULT 0,
  display_order INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_founders_videos_published 
  ON public.founders_voice_videos(is_published, display_order);

CREATE INDEX IF NOT EXISTS idx_founders_videos_display_order 
  ON public.founders_voice_videos(display_order);

-- Enable RLS
ALTER TABLE public.founders_voice_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published videos
CREATE POLICY "Anyone can view published videos" ON public.founders_voice_videos
  FOR SELECT
  USING (is_published = true);

-- Policy: Admins can view all videos
CREATE POLICY "Admins can view all videos" ON public.founders_voice_videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can insert videos
CREATE POLICY "Admins can insert videos" ON public.founders_voice_videos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update videos
CREATE POLICY "Admins can update videos" ON public.founders_voice_videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can delete videos
CREATE POLICY "Admins can delete videos" ON public.founders_voice_videos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_founders_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_founders_videos_updated_at_trigger ON public.founders_voice_videos;
CREATE TRIGGER update_founders_videos_updated_at_trigger
  BEFORE UPDATE ON public.founders_voice_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_founders_videos_updated_at();

-- Insert sample videos (optional - comment out if not needed)
INSERT INTO public.founders_voice_videos (title, question, video_url, display_order, is_published)
VALUES
  ('Welcome to BeAligned', 'What inspired the creation of BeAligned?', NULL, 1, true),
  ('Our Mission', 'What is BeAligned''s core mission?', NULL, 2, true),
  ('Getting Started', 'How do I make the most of BeAligned?', NULL, 3, true)
ON CONFLICT (id) DO NOTHING;

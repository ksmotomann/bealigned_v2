-- Recreate all RLS policies for FAQ items from scratch

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view published FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can view all FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can insert FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON public.faq_items;

-- Public can read published FAQs
CREATE POLICY "Anyone can view published FAQ items"
  ON public.faq_items
  FOR SELECT
  USING (is_published = true);

-- Admins can view all FAQs (including drafts)
CREATE POLICY "Admins can view all FAQ items"
  ON public.faq_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can insert FAQs
CREATE POLICY "Admins can insert FAQ items"
  ON public.faq_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can update FAQs
CREATE POLICY "Admins can update FAQ items"
  ON public.faq_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can delete FAQs
CREATE POLICY "Admins can delete FAQ items"
  ON public.faq_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

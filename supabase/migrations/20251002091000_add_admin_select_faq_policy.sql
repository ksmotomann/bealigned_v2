-- Add SELECT policy for admins to see all FAQ items (including drafts)

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

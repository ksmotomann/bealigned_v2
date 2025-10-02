-- Fix RLS policies for FAQ items to include WITH CHECK clauses

-- Drop and recreate the UPDATE policy
DROP POLICY IF EXISTS "Admins can update FAQ items" ON public.faq_items;

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

-- Also ensure DELETE policy is correct
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON public.faq_items;

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

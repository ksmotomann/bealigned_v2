-- Create FAQ table for managing website FAQ content
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_faq_items_category ON public.faq_items(category);
CREATE INDEX idx_faq_items_display_order ON public.faq_items(display_order);
CREATE INDEX idx_faq_items_published ON public.faq_items(is_published);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Public can read published FAQs
CREATE POLICY "Anyone can view published FAQ items"
  ON public.faq_items
  FOR SELECT
  USING (is_published = true);

-- Only admins can insert, update, delete FAQs
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

CREATE POLICY "Admins can update FAQ items"
  ON public.faq_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

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

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_faq_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_updated_at();

-- Insert existing FAQ data
INSERT INTO public.faq_items (category, question, answer, display_order) VALUES
-- Getting Started
('Getting Started', 'What is BeAligned?', 'BeAligned is a guided reflection tool that helps you navigate conflicts with clarity and compassion through our evidence-based 7-step process. Built on Nonviolent Communication principles, it provides scaffolding to help you develop better communication skills.', 1),
('Getting Started', 'How does BeAligned work?', 'BeAligned guides you through seven steps: Pause, Reflect, Feel, Need, Request, Craft, and Connect. Each step helps you gain clarity about your situation and craft a message that truly expresses your needs while maintaining connection with others.', 2),
('Getting Started', 'Who is BeAligned for?', 'BeAligned is designed for anyone who wants to improve their communication skills and navigate conflicts more effectively. Whether you''re dealing with family tensions, relationship challenges, or workplace conflicts, BeAligned provides tools to help you respond rather than react.', 3),
('Getting Started', 'Do I need any special training to use BeAligned?', 'No special training is required. BeAligned is designed to be intuitive and accessible to everyone, regardless of your background with communication tools or conflict resolution techniques.', 4),

-- Privacy & Security
('Privacy & Security', 'Is my data secure and private?', 'Yes. Your reflections are completely private and secure. We use industry-standard end-to-end encryption and never share your data with third parties. You have full control over your information and can delete it at any time.', 5),
('Privacy & Security', 'Can other people see my reflections?', 'No. All your reflections are private and visible only to you. BeAligned is designed as a personal reflection space where you can explore your thoughts and feelings without judgment or external visibility.', 6),
('Privacy & Security', 'Is BeAligned HIPAA compliant?', 'Yes. We maintain HIPAA compliance standards to ensure your personal health information is protected, even though BeAligned is an educational tool rather than a medical device.', 7),
('Privacy & Security', 'What data do you collect?', 'We collect only the information necessary to provide the service: your reflections, account information, and usage analytics (anonymized). We never sell your data or use it for advertising purposes.', 8),

-- Usage & Features
('Usage & Features', 'Is BeAligned a replacement for therapy?', 'No. BeAligned is an educational tool that helps you practice communication skills. It''s not a substitute for professional therapy, counseling, or medical advice. If you''re dealing with serious mental health issues, please consult qualified professionals.', 9),
('Usage & Features', 'Can I use BeAligned with my partner or family?', 'Currently, BeAligned is designed for individual reflection. However, BeAligned Couples is coming soon, which will allow shared reflection spaces for partners to work through conflicts together.', 10),
('Usage & Features', 'How often should I use BeAligned?', 'Use BeAligned whenever you''re facing a difficult conversation or conflict. Some people use it daily as a reflection practice, while others use it only when specific challenges arise. The goal is to help you internalize these skills over time.', 11),
('Usage & Features', 'What if I get stuck during a reflection?', 'That''s completely normal! BeAligned includes helpful prompts and examples at each step. You can also take breaks and return to your reflection later. Remember, this is a learning process, and it''s okay to struggle sometimes.', 12),

-- Pricing & Plans
('Pricing & Plans', 'How much does BeAligned cost?', 'BeAligned offers a free tier with core features, allowing you to complete basic reflections. Premium plans with advanced features, unlimited reflections, and priority support are available for users who want the full experience.', 13),
('Pricing & Plans', 'What''s included in the free tier?', 'The free tier includes access to our 7-step reflection process, basic analytics, and up to 10 reflections per month. This gives you a solid foundation to experience the benefits of structured communication reflection.', 14),
('Pricing & Plans', 'Can I cancel my subscription anytime?', 'Yes, you can cancel your subscription at any time. There are no long-term commitments or cancellation fees. Your data remains accessible even after cancellation.', 15),
('Pricing & Plans', 'Do you offer discounts for students or families?', 'Yes! We offer educational discounts for students and special family plans. Contact us directly to learn more about available discounts for your situation.', 16),

-- Technical Support
('Technical Support', 'What devices and platforms does BeAligned support?', 'BeAligned works on all modern web browsers, iOS devices, and Android devices. We''re constantly improving compatibility and performance across all platforms.', 17),
('Technical Support', 'What if I''m having technical problems?', 'If you experience any technical issues, please contact our support team through the app or email us. We typically respond within 24 hours and are committed to resolving issues quickly.', 18),
('Technical Support', 'How do I delete my account?', 'You can delete your account and all associated data from your account settings. Once deleted, your data cannot be recovered, so please make sure you''ve saved any reflections you want to keep.', 19),
('Technical Support', 'Can I export my reflection data?', 'Yes, you can export your reflection data in various formats from your account settings. This allows you to keep your reflections even if you decide to stop using the service.', 20);

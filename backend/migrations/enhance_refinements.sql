-- Enhanced refinements table for admin feedback
CREATE TABLE IF NOT EXISTS refinements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id),
  refined_content TEXT NOT NULL,
  notes TEXT,
  refinement_type VARCHAR(50) DEFAULT 'alternative', -- 'alternative', 'guidance', 'correction'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_refinements_message_id ON refinements(message_id);
CREATE INDEX IF NOT EXISTS idx_refinements_admin_id ON refinements(admin_id);
CREATE INDEX IF NOT EXISTS idx_refinements_active ON refinements(is_active);

-- Add admin mode tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_mode_active BOOLEAN DEFAULT false;

-- Add refinement status to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS has_refinement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refinement_applied BOOLEAN DEFAULT false;

-- RLS policies for refinements
ALTER TABLE refinements ENABLE ROW LEVEL SECURITY;

-- Admins can view all refinements
CREATE POLICY "Admins can view all refinements" ON refinements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins can create refinements
CREATE POLICY "Admins can create refinements" ON refinements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins can update their own refinements
CREATE POLICY "Admins can update own refinements" ON refinements
  FOR UPDATE USING (admin_id = auth.uid());

-- Admins can delete their own refinements
CREATE POLICY "Admins can delete own refinements" ON refinements
  FOR DELETE USING (admin_id = auth.uid());

-- Function to update message refinement status
CREATE OR REPLACE FUNCTION update_message_refinement_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE messages 
    SET has_refinement = true 
    WHERE id = NEW.message_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if there are other refinements for this message
    IF NOT EXISTS (SELECT 1 FROM refinements WHERE message_id = OLD.message_id AND id != OLD.id) THEN
      UPDATE messages 
      SET has_refinement = false,
          refinement_applied = false
      WHERE id = OLD.message_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update message status when refinements change
CREATE TRIGGER update_message_on_refinement
AFTER INSERT OR UPDATE OR DELETE ON refinements
FOR EACH ROW
EXECUTE FUNCTION update_message_refinement_status();
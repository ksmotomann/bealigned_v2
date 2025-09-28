-- Create table for tracking XML imports
CREATE TABLE IF NOT EXISTS autotune_xml_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  source TEXT NOT NULL, -- External tool name from XML
  file_path TEXT NOT NULL, -- Storage path
  file_size INTEGER,
  checksum TEXT, -- SHA256 hash for audit
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  conversations_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  feedback_count INTEGER DEFAULT 0,
  refinements_count INTEGER DEFAULT 0,
  error_message TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for status queries
CREATE INDEX idx_xml_imports_status ON autotune_xml_imports(status);
CREATE INDEX idx_xml_imports_created ON autotune_xml_imports(created_at DESC);

-- Add source tracking to existing feedback/refinement tables
ALTER TABLE message_feedback ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'native';
ALTER TABLE message_feedback ADD COLUMN IF NOT EXISTS source_import_id UUID REFERENCES autotune_xml_imports(id);

ALTER TABLE message_refinements ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'native';
ALTER TABLE message_refinements ADD COLUMN IF NOT EXISTS source_import_id UUID REFERENCES autotune_xml_imports(id);

-- RLS policies
ALTER TABLE autotune_xml_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage XML imports"
  ON autotune_xml_imports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('admin', 'super_admin')
    )
  );
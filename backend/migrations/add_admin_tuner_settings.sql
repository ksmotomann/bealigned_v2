-- AdminTuner Settings Table
-- Stores comprehensive AI behavior configuration settings

CREATE TABLE IF NOT EXISTS admin_tuner_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one active setting at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_admin_setting 
ON admin_tuner_settings(is_active) 
WHERE is_active = true;

-- Ensure only one default setting
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_admin_setting 
ON admin_tuner_settings(is_default) 
WHERE is_default = true;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_tuner_created_by ON admin_tuner_settings(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_tuner_created_at ON admin_tuner_settings(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_tuner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_admin_tuner_settings_updated_at ON admin_tuner_settings;
CREATE TRIGGER update_admin_tuner_settings_updated_at
    BEFORE UPDATE ON admin_tuner_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_tuner_updated_at();

-- Insert default settings
INSERT INTO admin_tuner_settings (name, description, is_active, is_default, settings)
VALUES (
  'Default Configuration',
  'Balanced settings for general co-parenting support',
  true,
  true,
  '{
    "model": {
      "name": "gpt-4-turbo-preview",
      "temperature": 0.7,
      "top_p": 1.0,
      "max_output_tokens": 800
    },
    "flow": {
      "start_phase": "name_it",
      "allow_user_jump": true,
      "auto_advance": "smart",
      "max_followups_per_phase": 2,
      "skip_if_confident": true,
      "draft_when_ready_score": 0.75
    },
    "probing": {
      "enable_reflections": true,
      "probe_on_uncertainty": true,
      "probe_triggers": ["low_confidence", "missing_key_field", "emotional_incongruence"],
      "probe_softeners": ["optional_invite", "acknowledge_effort", "normalize_experience"],
      "max_probe_depth": 2
    },
    "tone": {
      "warmth": "high",
      "directness": "medium",
      "avoid_performative_empathy": true,
      "use_plain_language": true
    },
    "safety": {
      "escalation_detection": "standard",
      "regulation_action": "offer_pause",
      "legal_therapy_disclaimer": true
    },
    "outputs": {
      "include_summary": "minimal",
      "clear_message_format": "bulleted_then_block",
      "show_reasoning_breadcrumbs": false,
      "offer_alt_tones": ["softer", "firmer", "shorter"]
    },
    "memory": {
      "persist_session": true,
      "persist_fields": ["phase", "notes_for_dev", "selected_option"],
      "redact_pii": true,
      "retention_days": 30
    },
    "glossary": {
      "offer_lists_on_request": true,
      "auto_offer_if_stuck": true
    }
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE admin_tuner_settings IS 'Comprehensive AI behavior configuration for admin control';
COMMENT ON COLUMN admin_tuner_settings.settings IS 'JSONB containing all tunable AI parameters';
COMMENT ON COLUMN admin_tuner_settings.is_active IS 'Currently active configuration';
COMMENT ON COLUMN admin_tuner_settings.is_default IS 'Default fallback configuration';
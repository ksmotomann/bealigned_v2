-- Add phase tracking to conversations and messages tables
-- This allows us to track which reflection phase the conversation is in

-- Add phase tracking to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 7),
ADD COLUMN IF NOT EXISTS phase_summaries JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phase_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add phase indicator to messages table to track which phase each message belongs to
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS phase_number INTEGER CHECK (phase_number >= 1 AND phase_number <= 7),
ADD COLUMN IF NOT EXISTS is_phase_transition BOOLEAN DEFAULT FALSE;

-- Create an index for phase analytics
CREATE INDEX IF NOT EXISTS idx_conversations_current_phase ON conversations(current_phase);
CREATE INDEX IF NOT EXISTS idx_messages_phase_number ON messages(phase_number);

-- Add a function to update phase_updated_at automatically
CREATE OR REPLACE FUNCTION update_phase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_phase IS DISTINCT FROM OLD.current_phase THEN
        NEW.phase_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic phase_updated_at updates
DROP TRIGGER IF EXISTS update_conversations_phase_updated_at ON conversations;
CREATE TRIGGER update_conversations_phase_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_phase_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN conversations.current_phase IS 'Current reflection phase (1-7): 1=Name It, 2=Beneath, 3=Why, 4=Co-Parent, 5=Child, 6=Options, 7=Choose';
COMMENT ON COLUMN conversations.phase_summaries IS 'JSON object storing summaries for each completed phase';
COMMENT ON COLUMN conversations.phase_updated_at IS 'Timestamp of last phase change';
COMMENT ON COLUMN messages.phase_number IS 'Which reflection phase this message belongs to';
COMMENT ON COLUMN messages.is_phase_transition IS 'Whether this message marks a transition to a new phase';
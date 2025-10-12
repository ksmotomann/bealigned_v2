-- Add flow_state column to reflection_sessions for Flow Engine v2
-- Based on master architecture from assets/master/governance.md

-- Add flow_state JSONB column
ALTER TABLE reflection_sessions ADD COLUMN IF NOT EXISTS flow_state JSONB DEFAULT '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb;

-- Add comment explaining structure
COMMENT ON COLUMN reflection_sessions.flow_state IS 'Flow Engine v2 state: {readiness: number, context: {issue, feelings, why, perspective, options, chosenOption}, lastPrompt: string, lastResponse: string, conversationHistory: array}';

-- Create index for querying by readiness (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_sessions_flow_readiness ON reflection_sessions ((flow_state->>'readiness'));

-- Migrate existing sessions to have initialized flow_state
UPDATE reflection_sessions
SET flow_state = '{
  "readiness": 0.0,
  "context": {},
  "lastPrompt": "",
  "lastResponse": "",
  "conversationHistory": []
}'::jsonb
WHERE flow_state IS NULL;

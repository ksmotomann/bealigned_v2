-- Populate some sample analytics data for testing

-- Update message lengths for existing messages
UPDATE messages 
SET message_length = length(content)
WHERE message_length IS NULL AND content IS NOT NULL;

-- Add some sample session analytics
INSERT INTO session_analytics (
  conversation_id, 
  user_id, 
  session_date, 
  time_spent_minutes, 
  messages_sent, 
  messages_received,
  phase_reached,
  completion_type,
  user_satisfaction
)
SELECT 
  c.id as conversation_id,
  c.user_id,
  c.created_at::date as session_date,
  COALESCE(c.session_duration_minutes, 15 + (random() * 30)::int) as time_spent_minutes,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND role = 'user') as messages_sent,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND role = 'assistant') as messages_received,
  COALESCE(c.completion_step, (random() * 7)::int + 1) as phase_reached,
  CASE 
    WHEN c.is_completed = true THEN 'completed'
    WHEN c.archived = true THEN 'abandoned'
    ELSE 'paused'
  END as completion_type,
  (3 + (random() * 2)::int) as user_satisfaction -- Random satisfaction between 3-5
FROM conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM session_analytics sa WHERE sa.conversation_id = c.id
);

-- Add some sample user engagement metrics
INSERT INTO user_engagement_metrics (
  user_id,
  metric_date,
  sessions_started,
  sessions_completed,
  total_time_minutes,
  messages_sent,
  ai_queries_made,
  features_used
)
SELECT 
  u.id as user_id,
  CURRENT_DATE as metric_date,
  (SELECT COUNT(*) FROM conversations WHERE user_id = u.id) as sessions_started,
  (SELECT COUNT(*) FROM conversations WHERE user_id = u.id AND is_completed = true) as sessions_completed,
  (SELECT COALESCE(SUM(time_spent_minutes), 0) FROM session_analytics WHERE user_id = u.id) as total_time_minutes,
  (SELECT COUNT(*) FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = u.id AND m.role = 'user') as messages_sent,
  (SELECT COUNT(*) FROM ai_assistant_logs WHERE user_id = u.id) as ai_queries_made,
  '{"chat": true, "ai_assistant": true}'::jsonb as features_used
FROM users u
WHERE u.user_type = 'user'
ON CONFLICT (user_id, metric_date) DO UPDATE SET
  sessions_started = EXCLUDED.sessions_started,
  sessions_completed = EXCLUDED.sessions_completed,
  total_time_minutes = EXCLUDED.total_time_minutes,
  messages_sent = EXCLUDED.messages_sent,
  ai_queries_made = EXCLUDED.ai_queries_made,
  features_used = EXCLUDED.features_used,
  updated_at = NOW();

-- Add some sample feature usage data
INSERT INTO feature_usage_analytics (user_id, feature_name, usage_count, last_used_at, feature_data)
SELECT 
  c.user_id,
  'conversation_chat' as feature_name,
  COUNT(*) as usage_count,
  MAX(c.updated_at) as last_used_at,
  jsonb_build_object(
    'avg_duration_minutes', AVG(COALESCE(c.session_duration_minutes, 20)),
    'completion_rate', COUNT(*) FILTER (WHERE c.is_completed = true)::float / COUNT(*) * 100
  ) as feature_data
FROM conversations c
GROUP BY c.user_id
ON CONFLICT (user_id, feature_name) DO UPDATE SET
  usage_count = EXCLUDED.usage_count,
  last_used_at = EXCLUDED.last_used_at,
  feature_data = EXCLUDED.feature_data,
  updated_at = NOW();

-- Add AI assistant feature usage
INSERT INTO feature_usage_analytics (user_id, feature_name, usage_count, last_used_at, feature_data)
SELECT 
  al.user_id,
  'ai_assistant' as feature_name,
  COUNT(*) as usage_count,
  MAX(al.created_at) as last_used_at,
  jsonb_build_object(
    'avg_response_time_ms', AVG(al.response_time_ms),
    'query_types', json_agg(DISTINCT al.query_type)
  ) as feature_data
FROM ai_assistant_logs al
GROUP BY al.user_id
ON CONFLICT (user_id, feature_name) DO UPDATE SET
  usage_count = EXCLUDED.usage_count,
  last_used_at = EXCLUDED.last_used_at,
  feature_data = EXCLUDED.feature_data,
  updated_at = NOW();
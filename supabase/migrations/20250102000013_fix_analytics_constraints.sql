-- Add missing unique constraints for feature_usage_analytics
ALTER TABLE feature_usage_analytics ADD CONSTRAINT feature_usage_analytics_user_feature_unique UNIQUE (user_id, feature_name);

-- Populate feature usage analytics with fixed query
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

-- Add AI assistant feature usage without query_type
INSERT INTO feature_usage_analytics (user_id, feature_name, usage_count, last_used_at, feature_data)
SELECT 
  al.user_id,
  'ai_assistant' as feature_name,
  COUNT(*) as usage_count,
  MAX(al.created_at) as last_used_at,
  jsonb_build_object(
    'avg_response_time_ms', AVG(al.response_time_ms),
    'total_queries', COUNT(*)
  ) as feature_data
FROM ai_assistant_logs al
GROUP BY al.user_id
ON CONFLICT (user_id, feature_name) DO UPDATE SET
  usage_count = EXCLUDED.usage_count,
  last_used_at = EXCLUDED.last_used_at,
  feature_data = EXCLUDED.feature_data,
  updated_at = NOW();
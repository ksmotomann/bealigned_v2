export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  user_type: 'user' | 'expert' | 'admin' | 'super_admin';
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  last_seen?: string;
  conversation_count?: number;
  last_conversation?: string;
  ai_queries_count?: number;
}

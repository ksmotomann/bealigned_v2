import axios from 'axios';
import { supabase } from './supabase';
import { customAuth } from './customAuth';

// Use Supabase Edge Functions for conversations
const EDGE_FUNCTION_URL = 'https://qujysevuyhqyitxqctxg.supabase.co/functions/v1';
const API_URL = process.env.REACT_APP_API_URL || EDGE_FUNCTION_URL;

// Create axios instance with conditional baseURL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to handle Edge Functions
api.interceptors.request.use(async (config) => {
  // For conversation endpoints, use Edge Function URL
  if (config.url?.startsWith('/api/conversations')) {
    config.baseURL = EDGE_FUNCTION_URL;
    config.url = config.url.replace('/api', '');
    console.log('Routing to Edge Function:', config.method, config.baseURL + config.url);
  }
  
  // Get auth token from custom auth
  const currentSession = customAuth.getSession();
  if (currentSession?.token) {
    config.headers.Authorization = `Bearer ${currentSession.token}`;
  } else {
    // Fallback to Supabase auth for Edge Functions that still need it
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  
  return config;
});

export const conversationApi = {
  getAll: async () => {
    try {
      const currentUser = customAuth.getUser();
      console.log('Session check:', { 
        hasSession: !!currentUser, 
        userId: currentUser?.id,
        email: currentUser?.email
      });
      
      if (!currentUser) {
        console.error('No user session found');
        return { data: [] };
      }
      
      // Get conversations directly from Supabase
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Direct Supabase query error:', error);
        return { data: [] };
      }
      
      console.log('Got conversations directly from Supabase:', data?.length);
      return { data: data || [] };
    } catch (error) {
      console.error('Error in getAll:', error);
      return { data: [] };
    }
  },
  create: async (title?: string) => {
    const currentUser = customAuth.getUser();
    const session = customAuth.getSession();
    
    if (!currentUser || !session) {
      console.error('No user session for creating conversation');
      throw new Error('Not authenticated - please log in again');
    }
    
    console.log('Creating conversation for user:', currentUser.id);
    
    try {
      console.log('Calling create-conversation Edge Function...');
      console.log('Session token:', session.token);
      
      // Call the create-conversation Edge Function to get greeting
      const response = await fetch('https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/create-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': session.token,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          title: title || 'New Conversation'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create conversation:', error);
        throw new Error(error.error || 'Failed to create conversation');
      }

      const result = await response.json();
      console.log('=== CREATE CONVERSATION RESPONSE ===');
      console.log('Full response:', result);
      console.log('Greeting:', result.greeting);
      console.log('====================================');
      
      // Return the conversation with greeting
      return { data: result };
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      // Fallback: create directly in Supabase without greeting
      const tempThreadId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { data, error: dbError } = await supabase
        .from('conversations')
        .insert({
          user_id: currentUser.id,
          title: title || 'New Conversation',
          thread_id: tempThreadId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Failed to create conversation (fallback):', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      return { data };
    }
  },
  sendMessage: async (conversationId: string, content: string, chatSettings?: any) => {
    const currentUser = customAuth.getUser();
    const session = customAuth.getSession();
    
    if (!currentUser || !session) {
      console.error('No user session for sending message');
      throw new Error('Not authenticated');
    }
    
    try {
      // Call the enhanced chat-ai Edge Function
      const response = await fetch('https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/chat-ai-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': session.token,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          conversationId,
          content,
          includeHistory: true,
          chatSettings
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send message:', error);
        throw new Error(error.error || 'Failed to send message');
      }

      const result = await response.json();
      console.log('Message sent and AI response received');
      
      // Return the assistant message as the primary response
      // The UI will update to show both messages
      return { data: result.assistantMessage };
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Fallback: just save the message without AI response
      const { data: message } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      return { data: message };
    }
  },
  getMessages: async (conversationId: string) => {
    try {
      // Direct Supabase query
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return { data: [] };
      }
      
      return { data: data || [] };
    } catch (error) {
      console.error('Error in getMessages:', error);
      return { data: [] };
    }
  },
  archive: async (conversationId: string, archived: boolean) => {
    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        archived_at: archived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to archive conversation:', error);
      return { data: null };
    }
    
    return { data };
  },
  delete: async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
    if (error) {
      console.error('Failed to delete conversation:', error);
      return { data: { success: false } };
    }
    
    return { data: { success: true } };
  },
  markComplete: async (conversationId: string, completionStep: number) => {
    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        is_completed: true,
        completion_step: completionStep,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to mark conversation complete:', error);
      return { data: null };
    }
    
    return { data };
  },
  uncomplete: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        is_completed: false,
        completion_step: null,
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to uncomplete conversation:', error);
      return { data: null };
    }
    
    return { data };
  },
  emailTranscript: async (conversationId: string, email: string) => {
    const currentUser = customAuth.getUser();
    const currentSession = customAuth.getSession();
    
    // Use Supabase auth token for Edge Functions that still need it
    const { data: { session } } = await supabase.auth.getSession();
    const token = currentSession?.token || session?.access_token;
    
    return fetch(`${EDGE_FUNCTION_URL}/send-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        conversationId, 
        recipientEmail: email,
        userId: session?.user?.id 
      }),
    }).then(res => res.json());
  },
  updatePhase: async (conversationId: string, phase: number, summary?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${EDGE_FUNCTION_URL}/conversations/${conversationId}/phase`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phase, summary }),
    });
    const data = await response.json();
    return { data };
  },
};

export const adminApi = {
  getAllUsers: async () => {
    // Use custom auth session token
    try {
      const token = localStorage.getItem('bealigned_auth_token');
      if (!token) {
        console.error('No auth token found');
        return { data: [] };
      }
      
      const response = await fetch(`${EDGE_FUNCTION_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { data };
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    return { data: [] };
  },
  getUserConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data || [] };
  },
  getAllConversations: async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, profiles(email, first_name, last_name)')
      .order('created_at', { ascending: false });
    return { data: data || [] };
  },
  getConversation: async (id: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('id', id)
      .single();
    return { data };
  },
  createRefinement: async (messageId: string, refinedContent: string, notes?: string, refinementType?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('refinements')
      .insert({
        message_id: messageId,
        refined_content: refinedContent,
        notes,
        refinement_type: refinementType,
        admin_id: user?.id
      })
      .select()
      .single();
    return { data };
  },
  getRefinements: async (messageId: string) => {
    const { data, error } = await supabase
      .from('refinements')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: false });
    return { data: data || [] };
  },
  updateRefinement: async (refinementId: string, data: any) => {
    const { data: result, error } = await supabase
      .from('refinements')
      .update(data)
      .eq('id', refinementId)
      .select()
      .single();
    return { data: result };
  },
  deleteRefinement: async (refinementId: string) => {
    const { error } = await supabase
      .from('refinements')
      .delete()
      .eq('id', refinementId);
    return { data: !error };
  },
  toggleAdminMode: async (enabled: boolean) => {
    // Admin mode is now stored in localStorage only, no need to update database
    // This function is kept for compatibility but doesn't do anything
    return { data: { admin_mode_active: enabled } };
  },
  getStats: async () => {
    // Aggregate stats from various tables
    const [users, conversations, messages] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('conversations').select('id', { count: 'exact' }),
      supabase.from('messages').select('id', { count: 'exact' })
    ]);
    
    return {
      data: {
        totalUsers: users.count || 0,
        totalConversations: conversations.count || 0,
        totalMessages: messages.count || 0
      }
    };
  },
  getAIAssistantLogs: async (params?: { limit?: number; offset?: number; user_id?: string }) => {
    let query = supabase
      .from('ai_assistant_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (params?.user_id) {
      query = query.eq('user_id', params.user_id);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    return { data: data || [] };
  },
};

export const issuesApi = {
  getAll: async (params?: { status?: string; type?: string; urgency?: string; limit?: number; offset?: number; showAll?: boolean }) => {
    // Get current user from custom auth
    const currentUser = customAuth.getUser();
    
    let query = supabase
      .from('issues')
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name),
        issue_comments(count)
      `)
      .order('created_at', { ascending: false });

    // Super admins see all issues, others see only their own unless showAll is true (for admins/experts)
    if (!params?.showAll && currentUser) {
      query = query.eq('submitted_by', currentUser.id);
    }

    if (params?.status) query = query.eq('status', params.status);
    if (params?.type) query = query.eq('type', params.type);
    if (params?.urgency) query = query.eq('urgency', params.urgency);
    if (params?.limit) query = query.limit(params.limit);
    if (params?.offset) query = query.range(params.offset, params.offset + (params.limit || 10) - 1);

    const { data, error } = await query;
    return { data: data || [] };
  },
  
  getById: async (issueId: string) => {
    const { data } = await supabase
      .from('issues')
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name),
        issue_comments(*, author:profiles!issue_comments_author_id_fkey(id, email, first_name, last_name))
      `)
      .eq('id', issueId)
      .single();
    return { data };
  },
  
  create: async (data: { title: string; description?: string; type: string; urgency?: string; tags?: string[] }) => {
    const currentUser = customAuth.getUser();
    const { data: result } = await supabase
      .from('issues')
      .insert({
        ...data,
        submitted_by: currentUser?.id,
        status: 'open'
      })
      .select()
      .single();
    return { data: result };
  },
  
  update: async (issueId: string, data: any) => {
    const { data: result } = await supabase
      .from('issues')
      .update(data)
      .eq('id', issueId)
      .select()
      .single();
    return { data: result };
  },
  
  resolve: async (issueId: string, data: { 
    resolution_description: string; 
    follow_up_needed: boolean; 
    follow_up_description?: string;
    is_fully_complete: boolean;
  }) => {
    const { data: result } = await supabase
      .from('issues')
      .update({
        status: 'resolved',
        resolution_description: data.resolution_description,
        follow_up_needed: data.follow_up_needed,
        follow_up_description: data.follow_up_description,
        is_fully_complete: data.is_fully_complete,
        resolved_at: new Date().toISOString()
      })
      .eq('id', issueId)
      .select()
      .single();
    return { data: result };
  },
  
  addComment: async (issueId: string, data: { content: string; is_internal?: boolean }) => {
    const currentUser = customAuth.getUser();
    const { data: result } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: issueId,
        author_id: currentUser?.id,
        ...data
      })
      .select()
      .single();
    return { data: result };
  },
  
  updateComment: async (commentId: string, data: { content: string }) => {
    const { data: result } = await supabase
      .from('issue_comments')
      .update(data)
      .eq('id', commentId)
      .select()
      .single();
    return { data: result };
  },
  
  archive: async (issueId: string, archived: boolean) => {
    const { data: result } = await supabase
      .from('issues')
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq('id', issueId)
      .select()
      .single();
    return { data: result };
  },
  
  delete: async (issueId: string) => {
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);
    return { data: !error };
  },
  
  getArchived: async () => {
    const { data } = await supabase
      .from('issues')
      .select(`
        *,
        submitted_by_profile:profiles!issues_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!issues_assigned_to_fkey(id, email, first_name, last_name)
      `)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });
    return { data: data || [] };
  },
  
  getStats: async () => {
    const currentUser = customAuth.getUser();
    
    let query = supabase.from('issues').select('status, type, urgency', { count: 'exact' });
    
    // Only filter by user if not super admin
    if (currentUser?.userType !== 'super_admin') {
      query = query.eq('submitted_by', currentUser?.id);
    }
    
    const { data, count } = await query;
    
    const stats = {
      total: count || 0,
      by_status: {} as { [key: string]: number },
      by_type: {} as { [key: string]: number },
      by_urgency: {} as { [key: string]: number }
    };
    
    data?.forEach((issue: any) => {
      stats.by_status[issue.status] = (stats.by_status[issue.status] || 0) + 1;
      stats.by_type[issue.type] = (stats.by_type[issue.type] || 0) + 1;
      stats.by_urgency[issue.urgency] = (stats.by_urgency[issue.urgency] || 0) + 1;
    });
    
    return { data: stats };
  },
  
  assignTo: async (issueId: string, userId: string | null) => {
    const { data: result } = await supabase
      .from('issues')
      .update({ assigned_to: userId })
      .eq('id', issueId)
      .select()
      .single();
    return { data: result };
  },
  
  getUsers: async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, user_type')
      .order('email');
    return { data: data || [] };
  }
};

export const githubSyncApi = {
  syncToGitHub: () => Promise.resolve({ data: { message: 'GitHub sync not available' } }),
  syncFromGitHub: () => Promise.resolve({ data: { message: 'GitHub sync not available' } }),
  syncComments: (issueId: string) => Promise.resolve({ data: { message: 'GitHub sync not available' } }),
  getSyncStatus: () => Promise.resolve({ data: { lastSync: null, status: 'Not configured' } }),
};

export default api;
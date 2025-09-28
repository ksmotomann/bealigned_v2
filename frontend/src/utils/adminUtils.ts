import { conversationApi, adminApi } from '../services/api';

interface Conversation {
  id: string;
  title: string;
  is_completed?: boolean;
  completion_step?: number;
  completed_at?: string;
  session_duration_minutes?: number;
}

/**
 * Admin utility functions for managing conversations and users
 */
export const adminUtils = {
  /**
   * Mark a conversation as uncomplete (admin only)
   */
  uncompleteConversation: async (conversationId: string): Promise<boolean> => {
    try {
      await conversationApi.uncomplete(conversationId);
      return true;
    } catch (error) {
      console.error('Failed to uncomplete conversation:', error);
      return false;
    }
  },

  /**
   * Archive a conversation (soft delete)
   */
  archiveConversation: async (conversationId: string): Promise<boolean> => {
    try {
      await conversationApi.archive(conversationId, true);
      return true;
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      return false;
    }
  },

  /**
   * Permanently delete a conversation (super admin only)
   */
  deleteConversationPermanently: async (conversationId: string): Promise<boolean> => {
    try {
      await conversationApi.delete(conversationId);
      return true;
    } catch (error) {
      console.error('Failed to delete conversation permanently:', error);
      return false;
    }
  },

  /**
   * Add a refinement to a message
   */
  addRefinement: async (
    messageId: string, 
    refinedContent: string, 
    notes?: string,
    refinementType: 'alternative' | 'guidance' | 'correction' = 'alternative'
  ) => {
    try {
      const response = await adminApi.createRefinement(
        messageId,
        refinedContent,
        notes,
        refinementType
      );
      return response.data;
    } catch (error) {
      console.error('Failed to add refinement:', error);
      throw error;
    }
  },

  /**
   * Check if a conversation can be uncompleted
   */
  canUncomplete: (
    conversation: Conversation | null,
    isAdmin: boolean,
    adminModeEnabled: boolean
  ): boolean => {
    return !!(
      conversation &&
      conversation.is_completed &&
      isAdmin &&
      adminModeEnabled
    );
  },

  /**
   * Check if a conversation can be archived
   */
  canArchive: (conversation: Conversation | null): boolean => {
    return !!(conversation && conversation.id);
  },

  /**
   * Check if a conversation can be permanently deleted
   */
  canDelete: (
    conversation: Conversation | null,
    isSuperAdmin: boolean
  ): boolean => {
    return !!(conversation && isSuperAdmin);
  },

  /**
   * Format conversation completion info
   */
  formatCompletionInfo: (conversation: Conversation): string => {
    if (!conversation.is_completed) return 'Not completed';
    
    const parts = ['Completed'];
    
    if (conversation.completion_step) {
      parts.push(`(Step ${conversation.completion_step})`);
    }
    
    if (conversation.completed_at) {
      const date = new Date(conversation.completed_at);
      parts.push(`on ${date.toLocaleDateString()}`);
    }
    
    if (conversation.session_duration_minutes) {
      const hours = Math.floor(conversation.session_duration_minutes / 60);
      const minutes = conversation.session_duration_minutes % 60;
      
      if (hours > 0) {
        parts.push(`- Duration: ${hours}h ${minutes}m`);
      } else {
        parts.push(`- Duration: ${minutes}m`);
      }
    }
    
    return parts.join(' ');
  },

  /**
   * Export conversation data for admin review
   */
  exportConversationData: async (conversationId: string) => {
    try {
      const messages = await conversationApi.getMessages(conversationId);
      const conversation = await adminApi.getConversation(conversationId);
      
      return {
        conversation: conversation.data,
        messages: messages.data,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to export conversation data:', error);
      throw error;
    }
  }
};
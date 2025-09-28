import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/CustomAuthContext';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  is_completed?: boolean;
  messages?: any[];
}

export const useAdminMode = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  // Load admin mode state from localStorage
  const [adminModeEnabled, setAdminModeEnabled] = useState(() => {
    const stored = localStorage.getItem('adminModeEnabled');
    // Only initialize to true if explicitly stored as true
    // Don't check isAdmin here as it might not be loaded yet
    return stored === 'true';
  });
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync admin mode with auth state
  useEffect(() => {
    const stored = localStorage.getItem('adminModeEnabled');
    console.log('useAdminMode - Syncing state:', {
      isAdmin,
      isSuperAdmin,
      storedValue: stored,
      currentAdminMode: adminModeEnabled
    });
    
    if (isAdmin || isSuperAdmin) {
      // For admins, respect the stored preference
      if (stored === 'true') {
        console.log('useAdminMode - Setting admin mode to TRUE (stored preference)');
        setAdminModeEnabled(true);
        loadUsers();
      } else if (stored === 'false') {
        console.log('useAdminMode - Setting admin mode to FALSE (stored preference)');
        setAdminModeEnabled(false);
      }
      // If no stored preference, default to false
      else {
        console.log('useAdminMode - No stored preference, defaulting to FALSE');
        setAdminModeEnabled(false);
        localStorage.setItem('adminModeEnabled', 'false');
      }
    } else {
      // Non-admins can't have admin mode enabled
      console.log('useAdminMode - Not an admin, forcing FALSE');
      setAdminModeEnabled(false);
      localStorage.removeItem('adminModeEnabled');
    }
  }, [isAdmin, isSuperAdmin]);

  const checkAdminModeStatus = async () => {
    try {
      const response = await adminApi.getStats();
      // Admin mode status is now stored in localStorage
    } catch (error) {
      console.error('Failed to check admin mode status:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllUsers();
      setUsers(response.data);
      
      if (response.data.length > 0 && !selectedUserId) {
        const firstUser = response.data[0];
        setSelectedUserId(firstUser.id);
        if (adminModeEnabled) {
          await loadUserConversations(firstUser.id);
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserConversations = async (userId: string) => {
    try {
      setLoading(true);
      const response = await adminApi.getUserConversations(userId);
      setUserConversations(response.data);
      
      // Auto-select first conversation if none selected
      if (response.data.length > 0 && !selectedConversationId) {
        setSelectedConversationId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load user conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminMode = useCallback(async () => {
    if (!isAdmin) return;
    
    const newMode = !adminModeEnabled;
    console.log('useAdminMode: Toggling admin mode from', adminModeEnabled, 'to', newMode);
    setAdminModeEnabled(newMode);
    
    // Save to localStorage for persistence
    localStorage.setItem('adminModeEnabled', newMode.toString());
    
    // Load user conversations when enabling admin mode
    if (newMode && selectedUserId) {
      await loadUserConversations(selectedUserId);
    }
    
    // Update backend
    try {
      await adminApi.toggleAdminMode(newMode);
    } catch (error) {
      console.error('Failed to toggle admin mode:', error);
    }
  }, [adminModeEnabled, isAdmin, selectedUserId]);

  const handleUserChange = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedConversationId(null);
    await loadUserConversations(userId);
  }, []);

  const handleConversationChange = useCallback((conversationId: string) => {
    console.log('Admin mode: Selecting conversation', conversationId);
    setSelectedConversationId(conversationId);
  }, []);

  const getCurrentConversation = useCallback(() => {
    if (!selectedConversationId) return null;
    return userConversations.find(c => c.id === selectedConversationId);
  }, [selectedConversationId, userConversations]);

  const syncWithExternalSelection = useCallback((conversationId: string) => {
    // Sync admin dropdown when conversation is selected externally (e.g., from sidebar)
    const convInList = userConversations.find(c => c.id === conversationId);
    if (convInList) {
      setSelectedConversationId(conversationId);
    }
  }, [userConversations]);

  return {
    // State
    adminModeEnabled,
    users,
    selectedUserId,
    userConversations,
    selectedConversationId,
    loading,
    
    // Computed
    isAdmin,
    isSuperAdmin,
    currentConversation: getCurrentConversation(),
    
    // Actions
    toggleAdminMode,
    handleUserChange,
    handleConversationChange,
    syncWithExternalSelection,
    loadUsers,
    loadUserConversations
  };
};
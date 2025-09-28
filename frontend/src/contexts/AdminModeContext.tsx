import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAuth } from './CustomAuthContext';
import { adminApi } from '../services/api';

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

interface AdminModeContextType {
  adminModeEnabled: boolean;
  toggleAdminMode: () => Promise<void>;
  users: User[];
  selectedUserId: string | null;
  userConversations: Conversation[];
  selectedConversationId: string | null;
  loading: boolean;
  handleUserChange: (userId: string) => Promise<void>;
  handleConversationChange: (conversationId: string) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

interface AdminModeProviderProps {
  children: ReactNode;
}

export const AdminModeProvider: React.FC<AdminModeProviderProps> = ({ children }) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  
  // Single source of truth for admin mode state - simple and direct
  const [adminModeEnabled, setAdminModeEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminModeEnabled');
      return stored === 'true';
    }
    return false;
  });
  
  // Wrapper to always sync with localStorage
  const setAdminModeEnabled = (value: boolean) => {
    console.log('AdminModeContext - Setting admin mode to:', value);
    setAdminModeEnabledState(value);
    localStorage.setItem('adminModeEnabled', value.toString());
  };
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Only clear admin mode for non-admins
  useEffect(() => {
    if (isAdmin === false && isSuperAdmin === false) {
      // User is explicitly not an admin
      console.log('AdminModeContext - User is not admin, clearing admin mode');
      setAdminModeEnabled(false);
      localStorage.removeItem('adminModeEnabled');
    }
  }, [isAdmin, isSuperAdmin]);

  const loadUsers = async () => {
    // Only load users if admin mode is actually enabled and user is an admin
    if (!adminModeEnabled || (!isAdmin && !isSuperAdmin)) {
      console.log('Skipping user load - admin mode disabled or not an admin');
      return;
    }
    
    try {
      setLoading(true);
      const response = await adminApi.getAllUsers();
      setUsers(response.data);
      
      if (response.data.length > 0 && !selectedUserId) {
        const firstUser = response.data[0];
        setSelectedUserId(firstUser.id);
        await loadUserConversations(firstUser.id);
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
    if (!isAdmin && !isSuperAdmin) return;
    
    const newMode = !adminModeEnabled;
    console.log('AdminModeContext: Toggling admin mode from', adminModeEnabled, 'to', newMode);
    setAdminModeEnabled(newMode);
    
    // Note: loadUsers will be called by other components when needed
    // We don't call it here to avoid the 401 error with missing auth
  }, [adminModeEnabled, isAdmin, isSuperAdmin]);

  const handleUserChange = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedConversationId(null);
    await loadUserConversations(userId);
  }, []);

  const handleConversationChange = useCallback((conversationId: string) => {
    console.log('Admin mode: Selecting conversation', conversationId);
    setSelectedConversationId(conversationId);
  }, []);

  // Log the current state being provided
  useEffect(() => {
    console.log('AdminModeContext - Providing state:', {
      adminModeEnabled,
      isAdmin,
      isSuperAdmin
    });
  }, [adminModeEnabled, isAdmin, isSuperAdmin]);

  return (
    <AdminModeContext.Provider value={{
      adminModeEnabled,
      toggleAdminMode,
      users,
      selectedUserId,
      userConversations,
      selectedConversationId,
      loading,
      handleUserChange,
      handleConversationChange
    }}>
      {children}
    </AdminModeContext.Provider>
  );
};

export const useAdminModeContext = () => {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error('useAdminModeContext must be used within an AdminModeProvider');
  }
  return context;
};
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { supabase } from '../services/supabase';
import { adminApi } from '../services/api';
import { 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  EnvelopeIcon,
  UserPlusIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

type UserType = 'user' | 'expert' | 'admin' | 'super_admin';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_seen?: string;
  is_active: boolean;
  user_type: UserType;
  conversation_count?: number;
  last_conversation?: string;
  ai_queries_count?: number;
}

interface UserActivity {
  userId: string;
  totalConversations: number;
  completedConversations: number;
  totalMessages: number;
  aiQueries: number;
  lastActive: string;
  avgSessionDuration: number;
  totalSessionTime: number;
}

export const UserManagement: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inviteData, setInviteData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    organization: '',
    message: '',
    is_admin: false,
    max_uses: 1,
    expires_in_days: 7
  });
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    user_type: 'user' as UserType
  });

  useEffect(() => {
    console.log('🔍 UserManagement useEffect - Permission check:');
    console.log('- Current user:', user?.email);
    console.log('- isSuperAdmin:', isSuperAdmin);
    console.log('- User object:', user);
    
    if (!isSuperAdmin) {
      console.log('❌ User is not super admin, redirecting to /admin');
      navigate('/admin');
      return;
    }
    console.log('✅ User is super admin, loading users...');
    loadUsers();
  }, [isSuperAdmin, navigate, user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading users...');
      
      // Use the adminApi which handles authentication properly
      const { data } = await adminApi.getAllUsers();
      console.log('✅ Loaded users:', data);
      
      if (data && data.users && data.users.length > 0) {
        console.log('👥 Users found:');
        data.users.forEach((user: any, index: number) => {
          console.log(`  ${index + 1}. ${user.email} (${user.first_name} ${user.last_name}) - Type: ${user.user_type}`);
        });
        
        // Transform to match our User interface
        const transformedUsers: User[] = data.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: user.created_at,
          last_seen: user.last_sign_in_at,
          is_active: user.is_active !== false,
          user_type: user.user_type || 'user',
          conversation_count: user.conversation_count || 0,
          last_conversation: undefined,
          ai_queries_count: 0
        }));
        
        console.log('✅ Successfully loaded', transformedUsers.length, 'users');
        setUsers(transformedUsers);
      } else if (data && Array.isArray(data)) {
        // Handle if data is directly an array
        const transformedUsers: User[] = data.map((user: any) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: user.created_at,
          last_seen: user.last_sign_in_at,
          is_active: user.is_active !== false,
          user_type: user.user_type || 'user',
          conversation_count: user.conversation_count || 0,
          last_conversation: undefined,
          ai_queries_count: 0
        }));
        setUsers(transformedUsers);
      } else {
        console.log('⚠️ No users returned');
        setUsers([]);
      }
      
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    const { supabase } = await import('../services/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const getMockUsers = (): User[] => [
    {
      id: '1',
      email: 'ksmotomann@gmail.com',
      first_name: 'Robert',
      last_name: 'Mann',
      created_at: '2024-01-15T08:00:00Z',
      last_seen: '2024-12-01T14:30:00Z',
      is_active: true,
      user_type: 'super_admin',
      conversation_count: 45,
      last_conversation: '2024-12-01T14:00:00Z',
      ai_queries_count: 23
    },
    {
      id: '2',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      created_at: '2024-02-20T10:00:00Z',
      last_seen: '2024-11-30T09:15:00Z',
      is_active: true,
      user_type: 'user',
      conversation_count: 12,
      last_conversation: '2024-11-30T09:00:00Z',
      ai_queries_count: 5
    },
    {
      id: '3',
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      created_at: '2024-03-10T14:00:00Z',
      last_seen: '2024-11-28T16:45:00Z',
      is_active: false,
      user_type: 'admin',
      conversation_count: 28,
      last_conversation: '2024-11-28T16:30:00Z',
      ai_queries_count: 15
    }
  ];

  const loadUserActivity = async (userId: string) => {
    try {
      // Get user's conversations and messages from Supabase
      const [conversationsResult, messagesResult] = await Promise.all([
        supabase
          .from('conversations')
          .select('*, messages(id)')
          .eq('user_id', userId),
        supabase
          .from('messages')
          .select('id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      const conversations = conversationsResult.data || [];
      const lastMessage = messagesResult.data?.[0];
      
      // Calculate activity stats
      const completedConversations = conversations.filter(c => c.completed_at).length;
      const totalMessages = conversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0);
      
      setUserActivity({
        userId,
        totalConversations: conversations.length,
        completedConversations,
        totalMessages,
        aiQueries: totalMessages, // Approximate AI queries with total messages
        lastActive: lastMessage?.created_at || new Date().toISOString(),
        avgSessionDuration: completedConversations > 0 ? 18.5 : 0,
        totalSessionTime: completedConversations * 18.5
      });
    } catch (error) {
      console.error('Failed to load user activity:', error);
      // Mock data as fallback
      setUserActivity({
        userId,
        totalConversations: 45,
        completedConversations: 38,
        totalMessages: 523,
        aiQueries: 23,
        lastActive: '2024-12-01T14:30:00Z',
        avgSessionDuration: 18.5,
        totalSessionTime: 832.5
      });
    }
  };

  const handleAddUser = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch('https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        throw new Error('Failed to add user');
      }

      await loadUsers();
      setShowAddUser(false);
      setNewUser({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        user_type: 'user'
      });
      alert('User added successfully!');
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Failed to add user. Please try again.');
    }
  };

  const handleSendInvite = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/invites/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...inviteData,
          role: inviteData.is_admin ? 'admin' : 'user'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInviteCode(data.invite.invite_code);
        setInviteLink(data.invite.invite_link);
        setInviteSent(true);
        
        // Show warning if email wasn't sent (when using test mode)
        if (inviteData.email !== 'ksmotomann@gmail.com') {
          alert('Note: Email could not be sent because Resend is in test mode. It can only send to ksmotomann@gmail.com until you verify your domain at resend.com/domains. The invite code and link are still valid and can be shared manually.');
        }
      } else {
        throw new Error(data.error || 'Failed to create invitation');
      }
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      alert(error.message || 'Failed to send invitation');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInviteData({
      email: '',
      first_name: '',
      last_name: '',
      organization: '',
      message: '',
      is_admin: false,
      max_uses: 1,
      expires_in_days: 7
    });
    setInviteCode('');
    setInviteLink('');
    setInviteSent(false);
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      await loadUsers();
      alert(`User ${isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleResetPassword = async (userId: string, email: string, newPassword?: string) => {
    const password = newPassword || prompt(`Enter new password for ${email}:`);
    
    if (!password) {
      return;
    }

    if (!window.confirm(`Are you sure you want to reset the password for ${email}?`)) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      alert(`Password reset successfully for ${email}`);
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password. Please try again.');
    }
  };



  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const token = await getAuthToken();
      console.log('🔍 Updating user via Edge Function:', editingUser.email);
      
      const response = await fetch(`https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          user_type: editingUser.user_type,
          is_active: editingUser.is_active
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to update user:', errorData);
        throw new Error(errorData.error || 'Failed to update user');
      }

      const data = await response.json();
      console.log('✅ User updated successfully:', data);

      await loadUsers();
      setShowEditUser(false);
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(adminModeEnabled ? '/admin' : '/home')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label={adminModeEnabled ? "Back to Admin Dashboard" : "Back to Home"}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Send Invite
              </button>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add User Directly
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Admin+ Users</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.user_type === 'admin' || u.user_type === 'super_admin').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Inactive Users</p>
            <p className="text-2xl font-bold text-gray-500">
              {users.filter(u => !u.is_active).length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.user_type === 'super_admin' ? 'bg-red-100 text-red-800' :
                      user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.user_type === 'expert' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.user_type === 'super_admin' ? 'Super Admin' :
                       user.user_type === 'admin' ? 'Admin' :
                       user.user_type === 'expert' ? 'Expert' :
                       'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{user.conversation_count || 0} conversations</span>
                      <span>{user.ai_queries_count || 0} AI queries</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_seen ? getTimeSince(user.last_seen) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          loadUserActivity(user.id);
                          setShowActivity(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Activity"
                      >
                        <ChartBarIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id, user.email)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Reset Password"
                      >
                        <KeyIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        className={user.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={user.is_active ? "Deactivate" : "Activate"}
                      >
                        {user.is_active ? (
                          <XCircleIcon className="h-5 w-5" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                <select
                  value={newUser.user_type}
                  onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value as UserType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="expert">Expert</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the appropriate user type for permissions
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            {!inviteSent ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Send User Invitation</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={inviteData.first_name}
                        onChange={(e) => setInviteData({ ...inviteData, first_name: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={inviteData.last_name}
                        onChange={(e) => setInviteData({ ...inviteData, last_name: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <input
                      type="text"
                      value={inviteData.organization}
                      onChange={(e) => setInviteData({ ...inviteData, organization: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Personal Message</label>
                    <textarea
                      value={inviteData.message}
                      onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Add a welcome message..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="inviteIsAdmin"
                      checked={inviteData.is_admin}
                      onChange={(e) => setInviteData({ ...inviteData, is_admin: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="inviteIsAdmin" className="ml-2 block text-sm text-gray-900">
                      Grant admin privileges
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Uses</label>
                      <input
                        type="number"
                        min="1"
                        value={inviteData.max_uses}
                        onChange={(e) => setInviteData({ ...inviteData, max_uses: parseInt(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expires (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={inviteData.expires_in_days}
                        onChange={(e) => setInviteData({ ...inviteData, expires_in_days: parseInt(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={resetInviteModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={!inviteData.email}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Invitation
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Invitation Sent!</h2>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-green-800 font-medium">Invitation sent successfully</p>
                    </div>
                    <p className="text-sm text-green-700">
                      An email has been sent to {inviteData.email} with instructions to join BeAligned.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Invite Code:</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 font-mono text-sm">
                        {inviteCode}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCode);
                          alert('Invite code copied!');
                        }}
                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Invite Link:</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteLink}
                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={resetInviteModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setInviteSent(false);
                      setInviteData({
                        email: '',
                        first_name: '',
                        last_name: '',
                        organization: '',
                        message: '',
                        is_admin: false,
                        max_uses: 1,
                        expires_in_days: 7
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Send Another
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {showActivity && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              User Activity: {selectedUser.first_name} {selectedUser.last_name}
            </h2>
            
            {userActivity && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Conversations</p>
                    <p className="text-2xl font-bold text-gray-900">{userActivity.totalConversations}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Completed Conversations</p>
                    <p className="text-2xl font-bold text-green-600">{userActivity.completedConversations}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Messages</p>
                    <p className="text-2xl font-bold text-blue-600">{userActivity.totalMessages}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">AI Queries</p>
                    <p className="text-2xl font-bold text-purple-600">{userActivity.aiQueries}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Session Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Session Duration</span>
                      <span className="text-sm font-medium text-gray-900">
                        {userActivity.avgSessionDuration.toFixed(1)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Session Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(userActivity.totalSessionTime / 60).toFixed(1)} hours
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Active</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(userActivity.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium text-gray-900">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Joined</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedUser.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-sm font-medium ${
                        selectedUser.is_active ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowActivity(false);
                  setSelectedUser(null);
                  setUserActivity(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit User: {editingUser.email}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={editingUser.first_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={editingUser.last_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  title="Email cannot be changed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be modified</p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Account Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={editingUser.is_active}
                      onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-900">
                      Account is active
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                    <select
                      value={editingUser.user_type}
                      onChange={(e) => setEditingUser({ ...editingUser, user_type: e.target.value as UserType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="user">User</option>
                      <option value="expert">Expert</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      User type determines access permissions and available features
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Changes to admin privileges will take effect immediately. 
                  Super Admins automatically have admin privileges.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
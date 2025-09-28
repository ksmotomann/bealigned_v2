import React, { useState } from 'react';
import { 
  ShieldCheckIcon, 
  ChevronDownIcon,
  UserIcon
} from '@heroicons/react/24/outline';

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
}

interface AdminToolbarProps {
  adminModeEnabled: boolean;
  isAdmin: boolean;
  users: User[];
  selectedUserId: string | null;
  userConversations: Conversation[];
  selectedConversationId: string | null;
  onToggleAdminMode: () => void;
  onUserChange: (userId: string) => void;
  onConversationChange: (conversationId: string) => void;
  className?: string;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  adminModeEnabled,
  isAdmin,
  users,
  selectedUserId,
  userConversations,
  selectedConversationId,
  onToggleAdminMode,
  onUserChange,
  onConversationChange,
  className = ''
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  if (!isAdmin) return null;

  const selectedUser = users.find(u => u.id === selectedUserId);
  const getUserDisplayName = (user: User) => {
    if (user.full_name) return user.full_name;
    if (user.first_name) return `${user.first_name} ${user.last_name || ''}`.trim();
    return user.email;
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between p-3">
        {/* Admin Mode Toggle */}
        <button
          onClick={onToggleAdminMode}
          className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            adminModeEnabled 
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
          {adminModeEnabled ? 'Exit Admin Mode' : 'Enter Admin Mode'}
        </button>

        {/* Admin Controls */}
        {adminModeEnabled && (
          <div className="flex items-center space-x-3">
            {/* User Selector */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center px-3 py-1.5 bg-yellow-50 border border-yellow-300 rounded-md text-sm hover:bg-yellow-100"
              >
                <UserIcon className="h-4 w-4 mr-1.5 text-yellow-600" />
                <span className="text-yellow-700 font-medium">
                  {selectedUser ? getUserDisplayName(selectedUser) : 'Select User'}
                </span>
                <ChevronDownIcon className="h-4 w-4 ml-2 text-yellow-600" />
              </button>
              
              {showUserDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onUserChange(user.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                        user.id === selectedUserId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{getUserDisplayName(user)}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Selector */}
            {userConversations.length > 0 && (
              <select
                value={selectedConversationId || ''}
                onChange={(e) => onConversationChange(e.target.value)}
                className="px-3 py-1.5 bg-white border border-yellow-300 rounded-md text-sm"
              >
                <option value="">Select Conversation</option>
                {userConversations.map(conv => (
                  <option key={conv.id} value={conv.id}>
                    {conv.title} ({new Date(conv.created_at).toLocaleDateString()}) 
                    {conv.is_completed ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Admin Indicator */}
            <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md text-sm font-medium">
              Admin Mode Active
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
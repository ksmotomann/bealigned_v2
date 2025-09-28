import React, { useState, useEffect, useRef } from 'react';
import { conversationApi, adminApi } from '../services/api';
import { 
  PaperAirplaneIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ChevronDownIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/CustomAuthContext';
import { ReflectionTracker } from './ReflectionTracker';
import { useReflectionTracking } from '../hooks/useReflectionTracking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  has_refinement?: boolean;
}

interface Refinement {
  id: string;
  refined_content: string;
  notes?: string;
  refinement_type: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

interface EnhancedAdminChatProps {
  initialConversationId?: string;
  onMessageSent?: () => void;
}

export const EnhancedAdminChat: React.FC<EnhancedAdminChatProps> = ({ 
  initialConversationId, 
  onMessageSent 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [refinementContent, setRefinementContent] = useState('');
  const [refinementNotes, setRefinementNotes] = useState('');
  const [refinementType, setRefinementType] = useState<'alternative' | 'guidance' | 'correction'>('alternative');
  const [messageRefinements, setMessageRefinements] = useState<Record<string, Refinement[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userConversations, setUserConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId || null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, isAdmin } = useAuth();
  
  // Reflection tracking
  const {
    steps,
    currentPhase,
    totalPhases,
    isTrackerVisible,
    toggleTracker,
    analyzeMessageForPhase
  } = useReflectionTracking(messages.length);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      checkAdminStatus();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages();
    }
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAdminStatus = async () => {
    try {
      const response = await adminApi.getStats();
      if (response.data) {
        setAdminMode(true);
      }
    } catch (error) {
      setAdminMode(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminApi.getAllUsers();
      setUsers(response.data);
      // Set current user as default
      if (user && !selectedUserId) {
        setSelectedUserId(user.id);
        loadUserConversations(user.id);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadUserConversations = async (userId: string) => {
    try {
      const response = await adminApi.getUserConversations(userId);
      setUserConversations(response.data);
      // If there's an initial conversation ID, select it
      if (initialConversationId) {
        setSelectedConversationId(initialConversationId);
      } else if (response.data.length > 0) {
        // Otherwise select the first conversation
        setSelectedConversationId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load user conversations:', error);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedConversationId(null);
    setMessages([]);
    loadUserConversations(userId);
  };

  const handleConversationChange = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const loadMessages = async () => {
    if (!selectedConversationId) return;
    
    try {
      const response = await conversationApi.getMessages(selectedConversationId);
      setMessages(response.data);
      
      // Load refinements for messages if admin
      if (adminMode) {
        try {
          const assistantMessages = response.data.filter((msg: Message) => msg.role === 'assistant');
          const refinementsPromises = assistantMessages.map((msg: Message) => 
            adminApi.getRefinements(msg.id).catch(() => ({ data: [] }))
          );
          
          const refinementsResponses = await Promise.all(refinementsPromises);
          const refinementsMap: Record<string, Refinement[]> = {};
          
          refinementsResponses.forEach((res, index) => {
            const messageId = assistantMessages[index].id;
            refinementsMap[messageId] = res.data || [];
          });
          
          setMessageRefinements(refinementsMap);
        } catch (error) {
          console.error('Failed to load refinements:', error);
        }
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !selectedConversationId) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    // Add a natural delay before showing typing indicator (0.5-1.5 seconds)
    const delay = 500 + Math.random() * 1000;
    typingTimeoutRef.current = setTimeout(() => {
      setShowTyping(true);
    }, delay);

    try {
      const response = await conversationApi.sendMessage(selectedConversationId, userMessage);
      
      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setShowTyping(false);
      
      setMessages(prev => [...prev, response.data]);
      onMessageSent?.();
    } catch (error: any) {
      // Ignore browser extension errors
      if (error.message && error.message.includes('listener indicated an asynchronous response')) {
        console.warn('Browser extension communication error ignored:', error);
        return;
      }
      
      console.error('Failed to send message:', error);
      
      // Only show alert for actual API errors
      if (error.response?.data?.error || error.message) {
        alert(`Failed to send message: ${error.response?.data?.error || error.message}`);
      }
      
      setMessages(prev => prev.slice(0, -1));
      
      // Clear typing indicator on error
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setShowTyping(false);
    } finally {
      setLoading(false);
    }
  };

  const startEditingRefinement = (messageId: string) => {
    setEditingMessageId(messageId);
    const message = messages.find(m => m.id === messageId);
    setRefinementContent(message?.content || '');
    setRefinementNotes('');
    setRefinementType('alternative');
  };

  const saveRefinement = async () => {
    if (!editingMessageId || !refinementContent.trim()) return;

    try {
      await adminApi.createRefinement(
        editingMessageId,
        refinementContent,
        refinementNotes,
        refinementType
      );
      
      // Reload refinements
      const response = await adminApi.getRefinements(editingMessageId);
      setMessageRefinements(prev => ({
        ...prev,
        [editingMessageId]: response.data
      }));
      
      setEditingMessageId(null);
      setRefinementContent('');
      setRefinementNotes('');
    } catch (error) {
      console.error('Failed to save refinement:', error);
      alert('Failed to save refinement');
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setRefinementContent('');
    setRefinementNotes('');
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedConversation = userConversations.find(c => c.id === selectedConversationId);

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Admin Header */}
        {adminMode && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-yellow-800">Admin Mode Active</span>
              
              {/* User Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-yellow-300 rounded-md text-sm hover:bg-yellow-50"
                >
                  <UserIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-gray-700">
                    {selectedUser ? 
                      (selectedUser.first_name ? 
                        `${selectedUser.first_name} ${selectedUser.last_name || ''}` : 
                        selectedUser.email) : 
                      'Select User'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </button>
                
                {showUserDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          handleUserChange(u.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          u.id === selectedUserId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="font-medium">
                          {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.email}
                        </div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation Selector */}
              {userConversations.length > 0 && (
                <select
                  value={selectedConversationId || ''}
                  onChange={(e) => handleConversationChange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-yellow-300 rounded-md text-sm"
                >
                  <option value="">Select Conversation</option>
                  {userConversations.map(conv => (
                    <option key={conv.id} value={conv.id}>
                      {conv.title} ({new Date(conv.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

              <button
                onClick={() => setAdminMode(false)}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
              >
                Exit Admin Mode
              </button>
            </div>
          </div>
        )}
        
        {/* Tracker Toggle Button */}
        <div className="flex justify-end p-3 border-b border-gray-200 bg-white">
          <button
            onClick={toggleTracker}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${
              isTrackerVisible 
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={isTrackerVisible ? 'Hide Reflection Tracker' : 'Show Reflection Tracker'}
          >
            {isTrackerVisible ? (
              <>
                <XMarkIcon className="h-5 w-5 mr-2" />
                Hide Progress Tracker
              </>
            ) : (
              <>
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Show Progress Tracker
              </>
            )}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!selectedConversationId ? (
          <div className="text-center text-gray-500 mt-8">
            Select a user and conversation to view messages
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-xs lg:max-w-md ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  } rounded-lg px-4 py-2`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {adminMode && message.role === 'assistant' && (
                      <button
                        onClick={() => startEditingRefinement(message.id)}
                        className="absolute top-1 right-1 p-1 rounded hover:bg-gray-300"
                        title="Add refinement"
                      >
                        <PencilIcon className="h-3 w-3 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Refinement Editor - Separate Box */}
                {editingMessageId === message.id && (
                  <div className="ml-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-blue-800">Add Refinement</div>
                      
                      <select
                        value={refinementType}
                        onChange={(e) => setRefinementType(e.target.value as any)}
                        className="w-full p-2 border border-blue-300 rounded text-gray-900 text-sm"
                      >
                        <option value="alternative">Alternative Response</option>
                        <option value="guidance">Guidance for Future</option>
                        <option value="correction">Correction</option>
                      </select>
                      
                      <textarea
                        value={refinementContent}
                        onChange={(e) => setRefinementContent(e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded text-gray-900 text-sm"
                        rows={4}
                        placeholder="Enter refined response..."
                      />
                      
                      <textarea
                        value={refinementNotes}
                        onChange={(e) => setRefinementNotes(e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded text-gray-900 text-sm"
                        rows={2}
                        placeholder="Notes (optional)..."
                      />
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={saveRefinement}
                          className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show existing refinements */}
                {messageRefinements[message.id]?.map((refinement: Refinement) => (
                  <div key={refinement.id} className="ml-8 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start space-x-2">
                      <div className="text-lg">
                        {refinement.refinement_type === 'guidance' ? '💡' :
                         refinement.refinement_type === 'correction' ? '✏️' :
                         '🔄'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-yellow-800 mb-1">
                          {refinement.refinement_type === 'guidance' ? 'Guidance' :
                           refinement.refinement_type === 'correction' ? 'Correction' :
                           'Alternative'}
                        </div>
                        <div className="text-sm text-gray-700">{refinement.refined_content}</div>
                        {refinement.notes && (
                          <div className="text-xs text-gray-500 mt-1 italic">Note: {refinement.notes}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          By {refinement.profiles?.full_name || refinement.profiles?.email || 'Admin'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {showTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

        {selectedConversationId && (
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* Reflection Tracker Sidebar */}
      {isTrackerVisible && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
          <ReflectionTracker 
            steps={steps}
            currentPhase={currentPhase}
            totalPhases={totalPhases}
          />
        </div>
      )}
    </div>
  );
};
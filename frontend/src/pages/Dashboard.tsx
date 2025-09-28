import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { useNavigate } from 'react-router-dom';
import { conversationApi } from '../services/api';
import { UnifiedChat } from '../components/UnifiedChat';
import { Navigation } from '../components/Navigation';
import { PlusIcon, ChatBubbleLeftRightIcon, HomeIcon, ShieldCheckIcon, CheckCircleIcon, DocumentArrowDownIcon, ArchiveBoxIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { exportChatToPDF } from '../utils/pdfExport';
import { supabase } from '../services/supabase';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_completed?: boolean;
  completion_step?: number;
  completed_at?: string;
  session_duration_minutes?: number;
}

export const Dashboard: React.FC = () => {
  const { user, signOut, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Record<string, any>>({});
  const [phase1Prompts, setPhase1Prompts] = useState<Record<string, any>>({});
  const [adminTunerSettings, setAdminTunerSettings] = useState<any>(null);
  // Load panel state from localStorage
  const [isConversationsPanelOpen, setIsConversationsPanelOpen] = useState(() => {
    const saved = localStorage.getItem('conversationsPanelOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Save panel state to localStorage whenever it changes
  const toggleConversationsPanel = () => {
    const newState = !isConversationsPanelOpen;
    setIsConversationsPanelOpen(newState);
    localStorage.setItem('conversationsPanelOpen', JSON.stringify(newState));
  };

  useEffect(() => {
    // Load Admin Tuner settings first, then conversations
    const initializeData = async () => {
      const settings = await loadAdminTunerSettings();
      await loadConversations(settings);
    };
    initializeData();
  }, []);

  // Re-generate Phase 1 prompts when adminTunerSettings changes
  useEffect(() => {
    if (adminTunerSettings && conversations.length > 0) {
      if (adminTunerSettings.phase1Prompt?.enabled) {
        const templates = adminTunerSettings.phase1Prompt.templates || [];
        if (templates.length > 0) {
          const newPrompts: Record<string, any> = {};
          conversations.forEach((conv: any) => {
            const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
            newPrompts[conv.id] = {
              content: randomTemplate,
              delaySeconds: adminTunerSettings.phase1Prompt.delaySeconds || 3,
              style: adminTunerSettings.phase1Prompt.style || 'conversational'
            };
          });
          setPhase1Prompts(newPrompts);
          console.log('Phase 1 prompts generated for conversations:', newPrompts);
        }
      }
    }
  }, [adminTunerSettings, conversations]);

  const loadAdminTunerSettings = async () => {
    try {
      // Load from admin_tuner_settings table
      const { data: settings } = await supabase
        .from('admin_tuner_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (settings && settings.settings) {
        const parsedSettings = typeof settings.settings === 'string' 
          ? JSON.parse(settings.settings) 
          : settings.settings;
        
        setAdminTunerSettings(parsedSettings);
        console.log('Admin Tuner settings loaded:', parsedSettings);
        return parsedSettings; // Return settings for immediate use
      }
    } catch (error) {
      console.error('Error loading Admin Tuner settings:', error);
    }
    return null;
  };

  const loadConversations = async (settings?: any) => {
    try {
      const response = await conversationApi.getAll();
      setConversations(response.data);
      
      // Use passed settings or state
      const tunerSettings = settings || adminTunerSettings;
      
      // Load Phase 1 prompts for all conversations from Admin Tuner
      if (tunerSettings?.phase1Prompt?.enabled) {
        const templates = tunerSettings.phase1Prompt.templates || [];
        if (templates.length > 0) {
          const newPrompts: Record<string, any> = {};
          response.data.forEach((conv: any) => {
            // Set Phase 1 prompt for each conversation
            const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
            newPrompts[conv.id] = {
              content: randomTemplate,
              delaySeconds: tunerSettings.phase1Prompt.delaySeconds || 3,
              style: tunerSettings.phase1Prompt.style || 'conversational'
            };
          });
          setPhase1Prompts(newPrompts);
          console.log('Generated Phase 1 prompts for conversations:', newPrompts);
        }
      }
      
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const createNewConversation = async () => {
    setLoading(true);
    try {
      console.log('Creating new conversation...');
      const response = await conversationApi.create('New Conversation');
      console.log('=== DASHBOARD CREATE RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Has greeting?:', response.data?.greeting);
      console.log('================================');
      
      // Check if conversation was created successfully
      if (!response.data) {
        throw new Error('Failed to create conversation - no data returned');
      }
      
      // Store the initial greeting message if it exists
      if (response.data.greeting) {
        console.log('Storing greeting:', response.data.greeting);
        const greetingContent = typeof response.data.greeting === 'string' 
          ? response.data.greeting 
          : response.data.greeting.content || 'Welcome! How can I help you today?';
        setInitialMessages(prev => {
          const updated = {
            ...prev,
            [response.data.id]: greetingContent
          };
          console.log('Updated initialMessages:', updated);
          return updated;
        });
      } else if (response.data.initialMessage) {
        console.log('Storing initialMessage:', response.data.initialMessage);
        setInitialMessages(prev => ({
          ...prev,
          [response.data.id]: response.data.initialMessage
        }));
      } else {
        console.log('No greeting or initialMessage found in response');
      }
      
      // Store Phase 1 prompt if it exists
      if (response.data.phase1Prompt) {
        console.log('Storing Phase 1 prompt:', response.data.phase1Prompt);
        setPhase1Prompts(prev => ({
          ...prev,
          [response.data.id]: response.data.phase1Prompt
        }));
      }
      
      // Add to conversations list and select it immediately
      setConversations([response.data, ...conversations]);
      setSelectedConversation(response.data.id);
      
      // Force a re-render by clearing and re-setting the selection
      // This ensures the Chat component picks up the new conversation
      setTimeout(() => {
        setSelectedConversation(response.data.id);
      }, 10);
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to create conversation: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const archiveConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const conversation = conversations.find(c => c.id === conversationId);
    const confirmed = window.confirm(
      `Are you sure you want to archive "${conversation?.title}"?\n\nThis will hide the conversation from view but keep all messages intact.`
    );
    
    if (!confirmed) return;
    
    try {
      await conversationApi.archive(conversationId, true);
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error: any) {
      console.error('Failed to archive conversation:', error);
      alert(`Failed to archive conversation: ${error.response?.data?.error || error.message}`);
    }
  };

  const deleteConversationPermanently = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const conversation = conversations.find(c => c.id === conversationId);
    const confirmed = window.confirm(
      `Are you sure you want to PERMANENTLY DELETE "${conversation?.title}"?\n\nThis action cannot be undone and will completely remove all messages from the database forever.`
    );
    
    if (!confirmed) return;
    
    // Double confirmation for permanent deletion
    const doubleConfirm = window.confirm('This is your final warning. Clicking OK will permanently delete this conversation. Are you absolutely sure?');
    if (!doubleConfirm) return;
    
    try {
      await conversationApi.delete(conversationId);
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      alert(`Failed to delete conversation: ${error.response?.data?.error || error.message}`);
    }
  };

  const exportConversationToPDF = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Get messages for this conversation
      const { data: messages } = await conversationApi.getMessages(conversation.id);
      
      if (!messages || messages.length === 0) {
        alert('No messages found in this conversation');
        return;
      }

      // Add user info
      const conversationWithUser = {
        ...conversation,
        user: {
          email: user?.email || 'Unknown',
          first_name: user?.firstName,
          last_name: user?.lastName
        }
      };

      await exportChatToPDF(conversationWithUser, messages);
    } catch (error) {
      console.error('Failed to export conversation:', error);
      alert('Failed to export conversation. Please try again.');
    }
  };

  return (
    <>
      <Navigation />
      <div className="flex h-screen bg-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Conversations Panel with Toggle - Fixed, doesn't scroll */}
        <div className={`${isConversationsPanelOpen ? 'w-80' : 'w-12'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col relative flex-shrink-0`}>
          {/* Chevron Toggle Button - positioned on the border */}
          <button
            onClick={toggleConversationsPanel}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full p-0.5 hover:bg-gray-50 transition-colors group shadow-sm"
            title={isConversationsPanelOpen ? 'Hide conversations' : 'Show conversations'}
          >
            {isConversationsPanelOpen ? (
              <ChevronLeftIcon className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
          
          {/* Collapsed state indicator - clickable */}
          {!isConversationsPanelOpen && (
            <div 
              onClick={toggleConversationsPanel}
              className="flex flex-col items-center py-4 space-y-4 cursor-pointer hover:bg-gray-50 h-full"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
              <div className="text-xs text-gray-400 transform -rotate-90 mt-8">
                Chats
              </div>
            </div>
          )}
          
          <div className={`${isConversationsPanelOpen ? 'block' : 'hidden'} flex flex-col h-full`}>
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={createNewConversation}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Chat
            </button>
          </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`relative group ${
                selectedConversation === conv.id 
                  ? 'bg-indigo-50 shadow-lg border-l-4 border-indigo-600 ring-1 ring-indigo-100' 
                  : ''
              }`}
              onMouseEnter={() => setHoveredConversation(conv.id)}
              onMouseLeave={() => setHoveredConversation(null)}
            >
              <button
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left px-4 py-3 border-b transition-all duration-200 ${
                  conv.is_completed 
                    ? selectedConversation === conv.id
                      ? 'bg-gradient-to-r from-green-100 to-indigo-100 hover:from-green-200 hover:to-indigo-200' 
                      : 'bg-green-50 hover:bg-green-100'
                    : selectedConversation === conv.id
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100'
                      : 'hover:bg-gray-50'
                } ${
                  selectedConversation === conv.id
                    ? 'border-transparent'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {conv.is_completed ? (
                      <CheckCircleIcon className={`h-5 w-5 ${
                        selectedConversation === conv.id ? 'text-green-600' : 'text-green-500'
                      }`} />
                    ) : (
                      <ChatBubbleLeftRightIcon className={`h-5 w-5 ${
                        selectedConversation === conv.id ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title - single line with ellipsis */}
                    <p className={`text-sm truncate ${
                      selectedConversation === conv.id
                        ? 'font-semibold text-indigo-900'
                        : conv.is_completed 
                          ? 'font-medium text-green-700' 
                          : 'font-medium text-gray-900'
                    }`} title={conv.title}>
                      {conv.title}
                    </p>
                    
                    {/* Date and status on second line */}
                    <div className={`flex items-center gap-1 text-xs mt-0.5 ${
                      selectedConversation === conv.id ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      <span>
                        {new Date(conv.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(conv.created_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                      {conv.is_completed && conv.session_duration_minutes && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">
                            {conv.session_duration_minutes}m
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
              {hoveredConversation === conv.id && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                  {/* PDF Export - only for admins */}
                  {isAdmin && (
                    <button
                      onClick={(e) => exportConversationToPDF(conv, e)}
                      className="p-2 rounded-md hover:bg-blue-50 transition-all hover:shadow-sm group"
                      title="Export as PDF"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                    </button>
                  )}
                  {/* Archive */}
                  <button
                    onClick={(e) => archiveConversation(conv.id, e)}
                    className="p-2 rounded-md hover:bg-orange-50 transition-all hover:shadow-sm group"
                    title="Archive conversation"
                  >
                    <ArchiveBoxIcon className="h-4 w-4 text-orange-600 group-hover:text-orange-700" />
                  </button>
                  {/* Permanent Delete - only for super admins */}
                  {isSuperAdmin && (
                    <button
                      onClick={(e) => deleteConversationPermanently(conv.id, e)}
                      className="p-2 rounded-md hover:bg-red-50 transition-all hover:shadow-sm group"
                      title="Delete permanently (super admin only)"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600 group-hover:text-red-700" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
          </div>
        </div>

        {/* Main Content Area - takes remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <UnifiedChat 
            conversationId={selectedConversation} 
            onMessageSent={loadConversations}
            initialMessage={initialMessages[selectedConversation]}
            phase1Prompt={phase1Prompts[selectedConversation]}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a conversation or create a new one</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};
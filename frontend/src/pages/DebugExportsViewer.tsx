import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { conversationApi } from '../services/api';
import { DocumentArrowDownIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/CustomAuthContext';

interface DebugExport {
  id: string;
  conversation_id: string;
  user_id: string;
  filename: string;
  comments: string | null;
  export_data: any;
  current_phase: number;
  message_count: number;
  created_at: string;
  conversation?: {
    title: string;
    created_at: string;
  };
  user?: {
    email: string;
    full_name?: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
  is_completed?: boolean;
  current_phase?: number;
  user?: {
    email: string;
    full_name?: string;
  };
}

export const DebugExportsViewer: React.FC = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'exports' | 'history'>('exports');
  const [debugExports, setDebugExports] = useState<DebugExport[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExport, setSelectedExport] = useState<DebugExport | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (activeTab === 'exports') {
      loadDebugExports();
    } else {
      loadConversationHistory();
    }
  }, [activeTab]);

  const loadDebugExports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('debug_exports')
        .select(`
          *,
          conversation:conversations(title, created_at),
          user:users(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebugExports(data || []);
    } catch (error) {
      console.error('Failed to load debug exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationHistory = async () => {
    setLoading(true);
    try {
      // Load all conversations with user info
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          user:users(email, full_name)
        `)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Load message counts for each conversation
      const conversationsWithCounts = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            message_count: count || 0,
            last_message: lastMsg?.content?.substring(0, 100) + '...' || ''
          };
        })
      );

      setConversations(conversationsWithCounts);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = (exportData: DebugExport) => {
    const jsonString = JSON.stringify(exportData.export_data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredExports = debugExports.filter(exp => 
    exp.conversation?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.comments?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chat Analysis Tools</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('exports')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'exports'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Debug Exports
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Conversation History
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'exports' ? 'Search exports...' : 'Search conversations...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {activeTab === 'exports' ? (
                filteredExports.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">No debug exports found</p>
                ) : (
                  filteredExports.map((exp) => (
                    <div
                      key={exp.id}
                      onClick={() => setSelectedExport(exp)}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedExport?.id === exp.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {exp.conversation?.title || 'Untitled'}
                        </h3>
                        <span className="text-xs text-gray-500 flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(exp.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{exp.user?.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Phase {exp.current_phase}</span>
                        <span>{exp.message_count} messages</span>
                      </div>
                      {exp.comments && (
                        <p className="text-sm text-gray-700 mt-2 italic">"{exp.comments}"</p>
                      )}
                    </div>
                  ))
                )
              ) : (
                filteredConversations.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">No conversations found</p>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.id === conv.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{conv.title}</h3>
                        {conv.is_completed && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{conv.user?.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{conv.message_count} messages</span>
                        <span>Phase {conv.current_phase || 1}</span>
                        <span>{new Date(conv.updated_at).toLocaleDateString()}</span>
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-gray-500 mt-2 truncate">{conv.last_message}</p>
                      )}
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'exports' && selectedExport ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Details</h2>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Conversation:</span>
                    <p className="text-gray-900">{selectedExport.conversation?.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">User:</span>
                    <p className="text-gray-900">{selectedExport.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Exported:</span>
                    <p className="text-gray-900">
                      {new Date(selectedExport.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phase:</span>
                    <p className="text-gray-900">{selectedExport.current_phase} of 7</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Messages:</span>
                    <p className="text-gray-900">{selectedExport.message_count}</p>
                  </div>
                  {selectedExport.comments && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Debug Comments:</span>
                      <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                        {selectedExport.comments}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => downloadExport(selectedExport)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Download JSON
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedExport.export_data, null, 2));
                      alert('Export data copied to clipboard!');
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>

                {/* Export Statistics */}
                {selectedExport.export_data?.statistics && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Statistics</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">User Messages:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedExport.export_data.statistics.userMessageCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">AI Messages:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedExport.export_data.statistics.assistantMessageCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg User Length:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedExport.export_data.statistics.averageUserMessageLength} chars
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg AI Length:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedExport.export_data.statistics.averageAssistantMessageLength} chars
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'history' && selectedConversation ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation Details</h2>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Title:</span>
                    <p className="text-gray-900">{selectedConversation.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">User:</span>
                    <p className="text-gray-900">{selectedConversation.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created:</span>
                    <p className="text-gray-900">
                      {new Date(selectedConversation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                    <p className="text-gray-900">
                      {new Date(selectedConversation.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className="text-gray-900">
                      {selectedConversation.is_completed ? 'Completed' : 'In Progress'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Current Phase:</span>
                    <p className="text-gray-900">{selectedConversation.current_phase || 1} of 7</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Messages:</span>
                    <p className="text-gray-900">{selectedConversation.message_count}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => window.open(`/chat/${selectedConversation.id}`, '_blank')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    View Conversation
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Select an item to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
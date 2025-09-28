import React, { useState, useEffect, useRef } from 'react';
import { conversationApi, adminApi } from '../services/api';
import { PaperAirplaneIcon, PencilIcon, CheckIcon, XMarkIcon, ChartBarIcon } from '@heroicons/react/24/solid';
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
  admin?: {
    email: string;
    full_name?: string;
  };
}

interface AdminChatProps {
  conversationId: string;
  onMessageSent?: () => void;
}

export const AdminChat: React.FC<AdminChatProps> = ({ conversationId, onMessageSent }) => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
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
    loadMessages();
    checkAdminStatus();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAdminStatus = async () => {
    // Check if user is admin from profile
    try {
      const response = await adminApi.getStats();
      if (response.data) {
        // User has admin access
        setAdminMode(true);
      }
    } catch (error) {
      // Not an admin
      setAdminMode(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await conversationApi.getMessages(conversationId);
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
          // Continue without refinements
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
    if (!input.trim() || loading) return;

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
      const response = await conversationApi.sendMessage(conversationId, userMessage);
      
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

  const toggleAdminMode = async () => {
    try {
      await adminApi.toggleAdminMode(!adminMode);
      setAdminMode(!adminMode);
    } catch (error) {
      console.error('Failed to toggle admin mode:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Admin Mode and Tracker Toggle */}
        <div className="border-b border-gray-200">
          {adminMode && (
            <div className="bg-yellow-50 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">Admin Mode Active</span>
                <button
                  onClick={toggleAdminMode}
                  className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                >
                  Exit Admin Mode
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-end p-3 bg-white">
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
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative max-w-xs lg:max-w-md ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              } rounded-lg`}>
                {editingMessageId === message.id ? (
                  <div className="p-4 space-y-3">
                    <textarea
                      value={refinementContent}
                      onChange={(e) => setRefinementContent(e.target.value)}
                      className="w-full p-2 border rounded text-gray-900"
                      rows={4}
                      placeholder="Enter refined response..."
                    />
                    <select
                      value={refinementType}
                      onChange={(e) => setRefinementType(e.target.value as any)}
                      className="w-full p-2 border rounded text-gray-900"
                    >
                      <option value="alternative">Alternative Response</option>
                      <option value="guidance">Guidance for Future</option>
                      <option value="correction">Correction</option>
                    </select>
                    <textarea
                      value={refinementNotes}
                      onChange={(e) => setRefinementNotes(e.target.value)}
                      className="w-full p-2 border rounded text-gray-900"
                      rows={2}
                      placeholder="Notes (optional)..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveRefinement}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2">
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
                )}
              </div>
            </div>
            
            {/* Show existing refinements */}
            {messageRefinements[message.id]?.length > 0 && (
              <div className="ml-8 mt-2 space-y-1">
                {messageRefinements[message.id].map((refinement: any) => (
                  <div key={refinement.id} className="text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                    <div className="font-semibold text-yellow-800">
                      {refinement.refinement_type === 'guidance' ? '💡 Guidance' :
                       refinement.refinement_type === 'correction' ? '✏️ Correction' :
                       '🔄 Alternative'}
                    </div>
                    <div className="text-gray-700 mt-1">{refinement.refined_content}</div>
                    {refinement.notes && (
                      <div className="text-gray-500 mt-1 italic">Note: {refinement.notes}</div>
                    )}
                    <div className="text-gray-400 mt-1">
                      By {refinement.profiles?.full_name || refinement.profiles?.email || 'Admin'}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        <div ref={messagesEndRef} />
      </div>

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
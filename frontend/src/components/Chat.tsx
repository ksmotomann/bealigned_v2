import React, { useState, useEffect, useRef } from 'react';
import { conversationApi } from '../services/api';
import { PaperAirplaneIcon, ChartBarIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ReflectionTracker } from './ReflectionTracker';
import { useReflectionTracking } from '../hooks/useReflectionTracking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatProps {
  conversationId: string;
  onMessageSent?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ conversationId, onMessageSent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    if (conversationId) {
      setHasLoaded(false);
      loadMessages();
      // Focus the input field when conversation changes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await conversationApi.getMessages(conversationId);
      setMessages(response.data);
      setHasLoaded(true);
      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setHasLoaded(true);
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
      
      // Analyze messages for phase progression
      analyzeMessageForPhase(userMessage);
      if (response.data.content) {
        analyzeMessageForPhase(response.data.content);
      }
      
      onMessageSent?.();
      
      // When step 1 is completed, the conversation title should already be updated by the backend
      // based on the generateConversationTitle function
    } catch (error: any) {
      // Ignore browser extension errors
      if (error.message && error.message.includes('listener indicated an asynchronous response')) {
        console.warn('Browser extension communication error ignored:', error);
        return;
      }
      
      console.error('Failed to send message:', error);
      console.error('Error details:', error.response?.data);
      
      // Only show alert for actual API errors
      if (error.response?.data?.error || error.message) {
        alert(`Failed to send message: ${error.response?.data?.error || error.message}`);
      }
      
      // Remove the user message if sending failed
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

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Toggle Button for Tracker */}
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
        {!hasLoaded && messages.length === 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
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
            ref={inputRef}
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
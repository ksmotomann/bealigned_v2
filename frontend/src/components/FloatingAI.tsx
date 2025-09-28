import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { supabase } from '../services/supabase';
import { 
  SparklesIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface AIResponse {
  response: string;
  timestamp: string;
}

interface FloatingAIProps {
  className?: string;
}

export const FloatingAI: React.FC<FloatingAIProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery('');
    setIsLoading(true);

    // Add user query to responses
    setResponses(prev => [...prev, { 
      response: `**You asked:** ${userQuery}`, 
      timestamp: new Date().toISOString() 
    }]);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('AI Assistant Request:', { query: userQuery, token: token ? 'present' : 'missing' });

      // Use Supabase Edge Function for AI queries
      const response = await fetch('https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userQuery })
      });

      console.log('AI Assistant Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('AI Assistant Error Response:', errorData);
        throw new Error(`Failed to get AI response: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('AI Assistant Success:', data);
      
      setResponses(prev => [...prev, {
        response: data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setResponses(prev => [...prev, {
        response: "The AI Assistant feature is currently being upgraded. Please use the BeH2O Chat for assistance.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setResponses([]);
  };

  const emailConversation = async () => {
    if (responses.length === 0) return;
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Use Supabase Edge Function for email
      const response = await fetch('https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          recipientEmail: user?.email,
          subject: 'AI Assistant Conversation',
          content: 'Please see the attached conversation history',
          conversationHistory: responses
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      const data = await response.json();
      alert(data.message || 'Conversation sent to your email!');
    } catch (error: any) {
      console.error('Failed to email conversation:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const suggestedQuestions = [
    "How can I get the most out of the BeAligned app?",
    "Are there any other BeAligned resources available?",
    "How have things progressed over time with my situation?",
    "What patterns do you notice in my conversations?",
    "What areas should I focus on based on our previous discussions?",
    "Summarize my recent progress and insights",
    "What challenges have I mentioned consistently?"
  ];

  return (
    <>
      {/* Floating Brain Icon */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          title="AI Assistant - Ask me anything about your journey"
        >
          <SparklesIcon className="h-7 w-7 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* AI Chat Modal */}
      {isOpen && (
        <div className={`fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 ${
          isExpanded 
            ? 'bottom-6 right-6 left-6 top-20 max-w-4xl mx-auto' 
            : 'bottom-24 right-6 w-96 h-96'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            </div>
            <div className="flex items-center space-x-2">
              {responses.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsExpanded(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <SparklesIcon className="h-12 w-12 text-purple-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">
                  Ask me anything about your journey, progress, or insights from your conversations!
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2">Try these questions:</p>
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(question)}
                      className="block w-full text-left text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2 rounded border border-purple-200 hover:border-purple-300 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((resp, index) => (
                  <div key={index} className={`${resp.response.startsWith('**You asked:**') ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block ${isExpanded ? 'max-w-[70%]' : 'max-w-[85%]'} p-3 rounded-lg text-sm ${
                      resp.response.startsWith('**You asked:**')
                        ? 'bg-purple-100 text-purple-900 rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap">
                        {resp.response.startsWith('**You asked:**') 
                          ? resp.response.replace('**You asked:** ', '')
                          : resp.response
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(resp.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="text-left">
                <div className="inline-block bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Email button at the bottom of conversation */}
            {responses.length > 0 && !responses[responses.length - 1].response.startsWith('**You asked:**') && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={emailConversation}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                  title="Email this conversation to yourself"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Email Conversation</span>
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything about your journey..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
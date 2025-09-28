import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { conversationApi } from '../services/api';
import { 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface LastActivity {
  type: 'conversation' | 'admin' | 'issue' | 'ai_query';
  title: string;
  timestamp: string;
  path: string;
  description?: string;
}

interface PersonalizedWelcomeProps {
  onDismiss?: () => void;
}

export const PersonalizedWelcome: React.FC<PersonalizedWelcomeProps> = ({ onDismiss }) => {
  const { user, isAdmin } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<LastActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    loadLastActivity();
    setPersonalizedGreeting();
  }, [user]);

  const setPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';
    
    let timeGreeting = '';
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }
    
    setGreeting(`${timeGreeting}, ${firstName}!`);
  };

  const loadLastActivity = async () => {
    try {
      setLoading(true);
      
      // Try to get the last conversation
      const { data: conversations } = await conversationApi.getAll();
      
      if (conversations && conversations.length > 0) {
        const lastConversation = conversations[0];
        const timeSince = getTimeSince(lastConversation.updated_at);
        
        setLastActivity({
          type: 'conversation',
          title: lastConversation.title,
          timestamp: lastConversation.updated_at,
          path: '/beh2o-chat',
          description: lastConversation.is_completed 
            ? `You completed this conversation ${timeSince}`
            : `You were working on this ${timeSince}`
        });
      } else {
        // New user - no activity yet
        setLastActivity(null);
      }
    } catch (error) {
      console.error('Failed to load last activity:', error);
      setLastActivity(null);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const handleContinue = () => {
    if (lastActivity) {
      navigate(lastActivity.path);
    }
    onDismiss?.();
  };

  const handleStartNew = () => {
    navigate('/beh2o-chat');
    onDismiss?.();
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-6 relative">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}
      
      <div className="flex items-start space-x-4">
        <SparklesIcon className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {greeting}
          </h2>
          
          {lastActivity ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                It's good to see you again! {lastActivity.description}
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {lastActivity.type === 'conversation' && (
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
                      )}
                      <span className="text-sm text-gray-500">Last conversation</span>
                    </div>
                    <p className="font-medium text-gray-900">{lastActivity.title}</p>
                  </div>
                  
                  <button
                    onClick={handleContinue}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Continue
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleStartNew}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Or start a new conversation
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">
                Welcome to BeAligned! Ready to begin your personal growth journey?
              </p>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleStartNew}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Start Your First Conversation
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h3 className="font-medium text-gray-900 mb-2">What you can do with BeAligned:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" />
                    <span>Have guided conversations to explore your thoughts and feelings</span>
                  </li>
                  <li className="flex items-start">
                    <SparklesIcon className="h-4 w-4 text-purple-600 mr-2 mt-0.5" />
                    <span>Get AI-powered insights about your personal journey</span>
                  </li>
                  <li className="flex items-start">
                    <CalendarIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span>Track your progress and growth over time</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isAdmin && adminModeEnabled && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Admin Quick Actions:
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/admin')}
                className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Admin Dashboard
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
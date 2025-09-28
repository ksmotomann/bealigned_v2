import React, { useState, useEffect, useRef } from 'react';
import { conversationApi, adminApi } from '../services/api';
import { assistantSettingsApi } from '../services/assistantSettingsApi';
import { 
  PaperAirplaneIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XMarkIcon as XMarkIconOutline
} from '@heroicons/react/24/solid';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { ReflectionTracker } from './ReflectionTracker';
import { useReflectionTracking } from '../hooks/useReflectionTracking';
import { exportChatToPDF } from '../utils/pdfExport';
import { exportChatForDebug } from '../utils/debugExport';
import { CompletionModal } from './CompletionModal';
import { DebugExportModal } from './DebugExportModal';
import { MessageContent } from './MessageContent';
import { ChatTuner, useChatSettings, ChatSettings } from './ChatTuner';
import { MessageFeedbackBar } from './MessageFeedbackBar';
import { MessageRefinementModal } from './MessageRefinementModal';

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

interface UnifiedChatProps {
  conversationId?: string;
  onMessageSent?: () => void;
  initialMessage?: string;
  phase1Prompt?: {
    content: string;
    delaySeconds: number;
    style: string;
  };
}

export const UnifiedChat: React.FC<UnifiedChatProps> = ({ 
  conversationId: propConversationId, 
  onMessageSent,
  initialMessage,
  phase1Prompt
}) => {
  // Core chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const chatSettings = useChatSettings();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>('');
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showPhase1Prompt, setShowPhase1Prompt] = useState(false);
  const phase1PromptTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Admin features state - only enabled when admin mode is on
  const { user, isAdmin } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  
  // Debug logging
  useEffect(() => {
    console.log('UnifiedChat - Admin mode state:', {
      isAdmin,
      adminModeEnabled,
      shouldShowAdminFeatures: isAdmin && adminModeEnabled
    });
  }, [isAdmin, adminModeEnabled]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [insertingAfterMessageId, setInsertingAfterMessageId] = useState<string | null>(null);
  const [insertingBeforeMessageId, setInsertingBeforeMessageId] = useState<string | null>(null);
  const [insertPromptType, setInsertPromptType] = useState<'clarification' | 'exploration' | 'validation' | 'transition' | 'reflection' | 'action'>('clarification');
  const [refinementContent, setRefinementContent] = useState('');
  const [refinementNotes, setRefinementNotes] = useState('');
  const [refinementType, setRefinementType] = useState<'alternative' | 'guidance' | 'correction' | 'missing_prompt'>('alternative');
  const [messageRefinements, setMessageRefinements] = useState<Record<string, Refinement[]>>({});
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showDebugExportModal, setShowDebugExportModal] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('Conversation');
  const [isConversationCompleted, setIsConversationCompleted] = useState(false);
  const [conversationPhase, setConversationPhase] = useState<number>(1);
  const [showRefinementModal, setShowRefinementModal] = useState(false);
  const [refinementMessageId, setRefinementMessageId] = useState<string | null>(null);
  const [refinementMessageContent, setRefinementMessageContent] = useState<string>('');
  const [refinementInitialFeedback, setRefinementInitialFeedback] = useState<{ category?: string; rating?: number; tags: string[]; comment?: string } | undefined>();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks already declared above
  
  // Reflection tracking
  const {
    steps,
    currentPhase,
    totalPhases,
    isTrackerVisible,
    toggleTracker,
    analyzeMessageForPhase,
    completeCurrentPhase
  } = useReflectionTracking(messages.length, conversationPhase, propConversationId);

  // Admin mode is automatically enabled for admin users
  // No need to check status or load settings here

  // Load conversation when it changes
  useEffect(() => {
    const conversationToLoad = propConversationId;
    
    // Clear messages immediately when conversation changes
    if (conversationToLoad !== currentConversationId) {
      setMessages([]);
      setHasLoaded(false);
      // Clear any ongoing streaming
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        setStreamingMessageId(null);
        setStreamedContent('');
      }
    }
    
    if (conversationToLoad) {
      loadMessages(conversationToLoad);
      // Focus input after loading
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Clear messages when no conversation is selected
      setMessages([]);
      setHasLoaded(true);
    }
  }, [propConversationId, initialMessage]);
  
  // Handle Phase 1 prompt when it becomes available or changes
  useEffect(() => {
    // Only set up Phase 1 prompt if we have messages loaded and only the greeting
    if (phase1Prompt && messages.length === 1 && messages[0].role === 'assistant' && currentConversationId) {
      console.log('Phase 1 prompt became available, setting up timer', phase1Prompt);
      
      // Clear any existing timer
      if (phase1PromptTimerRef.current) {
        clearTimeout(phase1PromptTimerRef.current);
      }
      
      // Set timer to show Phase 1 prompt after delay
      phase1PromptTimerRef.current = setTimeout(() => {
        console.log('Showing Phase 1 prompt from useEffect');
        setShowTyping(true); // Show typing dots first
        
        // After showing typing dots, add the message and animate it
        setTimeout(() => {
          setShowTyping(false);
          const phase1Message: Message = {
            id: `phase1-${currentConversationId}`,
            role: 'assistant',
            content: '',  // Start with empty content for animation
            created_at: new Date().toISOString()
          };
          setMessages(prev => {
            // Check if Phase 1 prompt was already added
            if (prev.some(m => m.id === `phase1-${currentConversationId}`)) {
              return prev;
            }
            return [...prev, phase1Message];
          });
          
          // Animate the Phase 1 prompt
          setTimeout(() => {
            animateAssistantMessage(`phase1-${currentConversationId}`, phase1Prompt.content);
          }, 100);
        }, 1000 + Math.random() * 500); // Show typing dots for 1-1.5 seconds
      }, (phase1Prompt.delaySeconds || 3) * 1000);
    }
  }, [phase1Prompt, messages.length, currentConversationId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (phase1PromptTimerRef.current) {
        clearTimeout(phase1PromptTimerRef.current);
      }
    };
  }, []);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug useEffect to monitor uncomplete button visibility
  useEffect(() => {
    if (adminModeEnabled && isAdmin) {
      console.log('=== Uncomplete Button Visibility Debug ===');
      console.log('Messages count:', messages.length);
      console.log('Current conversation ID:', currentConversationId);
      console.log('Is conversation completed:', isConversationCompleted);
      console.log('Admin mode enabled:', adminModeEnabled);
      console.log('Is admin:', isAdmin);
      console.log('Should show uncomplete button:', 
        messages.length > 0 && currentConversationId && isConversationCompleted && adminModeEnabled && isAdmin
      );
      console.log('==========================================');
    }
  }, [messages.length, currentConversationId, isConversationCompleted, adminModeEnabled, isAdmin]);

  // Admin mode is now automatically enabled based on user role

  // Temperature control removed - using ChatTuner component instead


  const loadMessages = async (conversationId: string) => {
    try {
      console.log('=== Loading Messages ===');
      console.log('Conversation ID to load:', conversationId);
      console.log('Admin mode enabled:', adminModeEnabled);
      console.log('Initial message:', initialMessage);
      
      setCurrentConversationId(conversationId);
      
      // Get messages first
      const response = await conversationApi.getMessages(conversationId);
      const messages = Array.isArray(response.data) ? response.data : [];
      console.log('Messages loaded:', messages.length, 'messages');
      
      // If no messages and we have an initial message, add it with animation
      if (messages.length === 0 && initialMessage) {
        const greetingMessage: Message = {
          id: `greeting-${conversationId}`,
          role: 'assistant',
          content: '',  // Start with empty content for animation
          created_at: new Date().toISOString()
        };
        messages.push(greetingMessage);
        console.log('Added initial greeting message');
        
        // Animate the greeting after a brief delay
        setTimeout(() => {
          animateAssistantMessage(`greeting-${conversationId}`, initialMessage);
        }, 200);
      }
      
      setMessages(messages);
      
      // Analyze all messages for phase detection when loading conversation
      messages.forEach((msg: Message) => {
        if (msg.content) {
          analyzeMessageForPhase(msg.content, msg.role === 'user');
        }
      });
      
      // If we have a Phase 1 prompt and only the greeting message, set up timer to show it
      if (phase1Prompt && messages.length === 1 && messages[0].role === 'assistant') {
        console.log('Setting up Phase 1 prompt timer', phase1Prompt);
        
        // Clear any existing timer
        if (phase1PromptTimerRef.current) {
          clearTimeout(phase1PromptTimerRef.current);
        }
        
        // Set timer to show Phase 1 prompt after delay
        phase1PromptTimerRef.current = setTimeout(() => {
          console.log('Showing Phase 1 prompt');
          setShowTyping(true); // Show typing dots first
          
          // After showing typing dots, add the message and animate it
          setTimeout(() => {
            setShowTyping(false);
            const phase1Message: Message = {
              id: `phase1-${conversationId}`,
              role: 'assistant',
              content: '',  // Start with empty content for animation
              created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, phase1Message]);
            
            // Animate the Phase 1 prompt
            setTimeout(() => {
              animateAssistantMessage(`phase1-${conversationId}`, phase1Prompt.content);
            }, 100);
          }, 1000 + Math.random() * 500); // Show typing dots for 1-1.5 seconds
        }, (phase1Prompt.delaySeconds || 3) * 1000);
      }
      
      // Fetch the conversation details
      const convResponse = await conversationApi.getAll();
      const conversation = convResponse.data.find((c: any) => c.id === conversationId);
      console.log('Found conversation from API:', conversation);
      
      if (conversation) {
        setConversationTitle(conversation.title || 'Conversation');
        const isCompleted = conversation.is_completed === true;
        setIsConversationCompleted(isCompleted); // Explicitly check for true
        setConversationPhase(conversation.current_phase || 1); // Set the phase from backend
        console.log('Setting conversation state:');
        console.log('  Title:', conversation.title);
        console.log('  Is Completed:', conversation.is_completed);
        console.log('  Setting IsConversationCompleted to:', isCompleted);
        
        // Debug: Log button visibility conditions
        console.log('Button visibility check after setting state:');
        console.log('  Messages:', messages.length, '> 0');
        console.log('  Current Conv ID:', conversationId);
        console.log('  Is Completed:', isCompleted);
        console.log('  Admin Mode:', adminModeEnabled);
        console.log('  Is Admin:', isAdmin);
        console.log('  Should show uncomplete:', messages.length > 0 && conversationId && isCompleted && adminModeEnabled && isAdmin);
      } else {
        console.log('No conversation found! Setting completed to false');
        setIsConversationCompleted(false);
      }
      console.log('=======================');
      setHasLoaded(true);
      
      // Load refinements if admin mode is enabled
      if (adminModeEnabled && isAdmin) {
        loadRefinements(response.data);
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setHasLoaded(true);
    }
  };

  const loadRefinements = async (messages: Message[]) => {
    try {
      const assistantMessages = messages.filter((msg: Message) => msg.role === 'assistant');
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
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Admin mode is automatically enabled - no toggle needed

  // Helper function to animate assistant messages with human-like typing
  const animateAssistantMessage = (messageId: string, fullContent: string, onComplete?: () => void) => {
    let currentIndex = 0;
    let lastPauseIndex = 0;
    
    const typeNextChunk = () => {
      if (currentIndex >= fullContent.length) {
        if (streamingIntervalRef.current) {
          clearTimeout(streamingIntervalRef.current);
        }
        setStreamingMessageId(null);
        setStreamedContent('');
        if (onComplete) onComplete();
        return;
      }
      
      // Determine chunk size and delay for human-like effect
      let chunkSize = 2; // Type 2-3 characters at a time for faster speed
      let nextDelay = 10 + Math.random() * 15; // Much faster base typing speed (10-25ms per chunk)
      
      const currentChar = fullContent[currentIndex];
      const nextChar = fullContent[currentIndex + 1];
      
      // Type word chunks for smoother appearance
      if (currentChar !== ' ' && nextChar && nextChar !== ' ' && nextChar !== '.' && nextChar !== ',' && nextChar !== '!' && nextChar !== '?') {
        chunkSize = Math.min(3 + Math.floor(Math.random() * 2), fullContent.length - currentIndex);
      }
      
      // Add natural but shorter pauses
      if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
        nextDelay = 100 + Math.random() * 50; // Shorter pause at sentence end
      } else if (currentChar === ',') {
        nextDelay = 40 + Math.random() * 30; // Shorter pause at comma
      } else if (currentChar === ':' || currentChar === ';') {
        nextDelay = 50 + Math.random() * 30; // Medium pause
      } else if (currentIndex - lastPauseIndex > 50 + Math.random() * 30) {
        // Less frequent thinking pauses
        nextDelay = 60 + Math.random() * 40;
        lastPauseIndex = currentIndex;
      }
      
      const newContent = fullContent.substring(0, currentIndex + chunkSize);
      
      setStreamedContent(newContent);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, content: newContent } : msg
      ));
      
      currentIndex += chunkSize;
      
      // Schedule next chunk with variable delay
      streamingIntervalRef.current = setTimeout(typeNextChunk, nextDelay);
    };
    
    // Start typing animation
    setStreamingMessageId(messageId);
    setStreamedContent('');
    streamingIntervalRef.current = setTimeout(typeNextChunk, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !currentConversationId) return;

    // Clear Phase 1 prompt timer if user starts interacting
    if (phase1PromptTimerRef.current) {
      clearTimeout(phase1PromptTimerRef.current);
      phase1PromptTimerRef.current = null;
      setShowPhase1Prompt(false);
    }

    const userMessage = input;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    // Add natural delay before showing typing indicator
    const delay = 500 + Math.random() * 1000;
    typingTimeoutRef.current = setTimeout(() => {
      setShowTyping(true);
    }, delay);

    try {
      const response = await conversationApi.sendMessage(currentConversationId, userMessage, chatSettings);
      
      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setShowTyping(false);
      
      // Add message with streaming effect
      const messageId = response.data.id;
      const fullContent = response.data.content;
      
      // Add empty message first
      setMessages(prev => [...prev, { ...response.data, content: '' }]);
      
      // Use the shared animation function
      animateAssistantMessage(messageId, fullContent);
      
      // Check if conversation title was updated
      if (response.data.conversationTitle) {
        // Trigger a refresh of the conversation list to show the new title
        onMessageSent?.();
      }
      
      // Analyze messages for phase progression
      analyzeMessageForPhase(userMessage, true); // Mark as user message
      if (response.data.content) {
        analyzeMessageForPhase(response.data.content, false); // Mark as assistant message
      }
      
      // Check if conversation should be marked as complete
      const completionPhrases = [
        'thank you', 'thanks', 'that helps', 'perfect', 'great', 
        'i\'m done', 'all set', 'that\'s all', 'goodbye', 'bye',
        'appreciate it', 'much better', 'that worked', 'problem solved',
        'i\'ll do that', 'i\'ll try that', 'makes sense now'
      ];
      
      const lowerMessage = userMessage.toLowerCase();
      const isComplete = completionPhrases.some(phrase => lowerMessage.includes(phrase));
      
      if (isComplete && currentPhase >= 6) {
        // Mark the last phase as complete
        completeCurrentPhase();
        
        // Mark conversation as complete in database
        if (currentConversationId) {
          try {
            await conversationApi.markComplete(currentConversationId, currentPhase);
            // Show completion modal
            setShowCompletionModal(true);
          } catch (error) {
            console.error('Failed to mark conversation as complete:', error);
          }
        }
      }
      
      onMessageSent?.();
    } catch (error: any) {
      // Ignore browser extension errors
      if (error.message && error.message.includes('listener indicated an asynchronous response')) {
        console.warn('Browser extension communication error ignored:', error);
        return;
      }
      
      console.error('Failed to send message:', error);
      
      if (error.response?.data?.error || error.message) {
        alert(`Failed to send message: ${error.response?.data?.error || error.message}`);
      }
      
      setMessages(prev => prev.slice(0, -1));
      
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

  const saveRefinementToMessage = async (messageId: string) => {
    if (!refinementContent.trim()) return;

    try {
      await adminApi.createRefinement(
        messageId,
        refinementContent,
        refinementNotes,
        refinementType
      );
      
      // Reload refinements
      const response = await adminApi.getRefinements(messageId);
      setMessageRefinements(prev => ({
        ...prev,
        [messageId]: response.data
      }));
      
      setEditingMessageId(null);
      setInsertingAfterMessageId(null);
      setRefinementContent('');
      setRefinementNotes('');
      setRefinementType('alternative');
    } catch (error) {
      console.error('Failed to save refinement:', error);
      alert('Failed to save refinement');
    }
  };

  const saveRefinement = async () => {
    if (!editingMessageId) return;
    await saveRefinementToMessage(editingMessageId);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setInsertingAfterMessageId(null);
    setRefinementContent('');
    setRefinementNotes('');
    setRefinementType('alternative');
  };

  const handleRefinementClick = (messageId: string, content: string, initialFeedback?: { category?: string; rating?: number; tags: string[]; comment?: string }) => {
    setRefinementMessageId(messageId);
    setRefinementMessageContent(content);
    setRefinementInitialFeedback(initialFeedback);
    setShowRefinementModal(true);
  };

  // Use activeConversationId to avoid naming conflict
  const activeConversationId = propConversationId;

  // PDF Export function
  const exportToPDF = async () => {
    if (!activeConversationId || messages.length === 0) {
      alert('No conversation selected or no messages to export');
      return;
    }

    try {
      // Get conversation details
      const { data: conversationData } = await conversationApi.getAll();
      const conversation = conversationData.find((c: any) => c.id === currentConversationId);
      
      if (!conversation) {
        alert('Conversation not found');
        return;
      }

      // Add user info for exports
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
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Complete conversation function
  const uncompleteConversation = async () => {
    if (!currentConversationId) {
      alert('No conversation selected');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to mark this conversation as incomplete? This will remove the completion status.'
    );

    if (!confirmed) return;

    try {
      await conversationApi.uncomplete(currentConversationId);
      setIsConversationCompleted(false);
      
      // Refresh the conversation list to update all completion statuses
      if (onMessageSent) {
        onMessageSent();
      }
      
      // Reload conversations to get updated statuses
      const convResponse = await conversationApi.getAll();
      const updatedConv = convResponse.data.find((c: any) => c.id === currentConversationId);
      if (updatedConv) {
        setIsConversationCompleted(updatedConv.is_completed || false);
      }
      
      alert('Conversation marked as incomplete');
    } catch (error: any) {
      console.error('Failed to uncomplete conversation:', error);
      alert(`Failed to uncomplete conversation: ${error.response?.data?.error || error.message}`);
    }
  };

  const completeConversation = async () => {
    if (!currentConversationId) {
      alert('No conversation selected');
      return;
    }

    if (messages.length === 0) {
      alert('Cannot complete a conversation with no messages');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to mark this conversation as complete? This will record the session duration and mark it as finished.'
    );

    if (!confirmed) return;

    try {
      console.log('Attempting to mark conversation as complete:', currentConversationId);
      const response = await conversationApi.markComplete(currentConversationId, 7); // Default to completion step 7
      console.log('Mark complete response:', response);
      
      setIsConversationCompleted(true);
      
      // Show completion modal
      console.log('Showing completion modal for conversation:', currentConversationId);
      setShowCompletionModal(true);
      
      // Refresh the conversation list if callback provided
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error: any) {
      console.error('Failed to complete conversation:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to complete conversation: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  return (
    <>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
      <div className="flex h-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Admin Controls */}
        {isAdmin && adminModeEnabled && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800 flex items-center">
                <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                Admin Mode Active
              </span>
              
              <span className="text-xs text-yellow-600">
                Use Chat Tuner for AI settings
              </span>
            </div>
          </div>
        )}
        
        {/* Top Controls Bar */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-white">
          {/* Left side - empty or can add other controls */}
          <div></div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Show completion status for debugging */}
            {adminModeEnabled && currentConversationId && (
              <span className={`px-2 py-1 text-xs rounded ${isConversationCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {isConversationCompleted ? '✓ Completed' : 'Not Completed'}
              </span>
            )}
            
            {/* PDF Export (only for admins) */}
            {isAdmin && messages.length > 0 && (
              <button
                onClick={exportToPDF}
                className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                title="Export chat transcript as PDF"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
                Export PDF
              </button>
            )}
            
            {/* Debug Export Button - Admin Only */}
            {messages.length > 0 && currentConversationId && adminModeEnabled && isAdmin && (
              <button
                onClick={() => setShowDebugExportModal(true)}
                className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
                title="Export debug data for Claude analysis (chat_debug_YYYY-MM-DD_HH-MM-SS.json)"
              >
                <ChartBarIcon className="h-4 w-4 mr-1.5" />
                Debug Export
              </button>
            )}
            
            {/* Complete Conversation Button */}
            {messages.length > 0 && currentConversationId && !isConversationCompleted && (
              <button
                onClick={completeConversation}
                className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                title="Mark conversation as complete"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                Complete
              </button>
            )}
            
            {/* Uncomplete button for admins on completed conversations */}
            {messages.length > 0 && currentConversationId && isConversationCompleted && adminModeEnabled && isAdmin && (
              <button
                onClick={uncompleteConversation}
                className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all"
                title="Mark conversation as incomplete (Admin only)"
              >
                <XMarkIcon className="h-4 w-4 mr-1.5" />
                Uncomplete
              </button>
            )}
            
            {/* Progress Tracker Toggle - removed from here, will be on the divider */}
          </div>
        </div>
        
        {/* Messages Area - Scrollable independently */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100% - 120px)' }}>
          {!hasLoaded && messages.length === 0 && currentConversationId && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          
          {!currentConversationId && adminModeEnabled ? (
            <div className="text-center text-gray-500 mt-8">
              Select a user and conversation to view messages
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={message.id} className="space-y-2">
                  {/* Insert Missing Prompt Buttons - shows before and after user messages */}
                  {adminModeEnabled && isAdmin && message.role === 'user' && (
                    <>
                      {/* Insert Before Button */}
                      {index > 0 && (
                        <div className="flex justify-center my-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setInsertingBeforeMessageId(message.id);
                                setInsertingAfterMessageId(null);
                                setRefinementType('missing_prompt');
                                setRefinementContent('');
                                setRefinementNotes('');
                                setInsertPromptType('clarification');
                              }}
                              className="flex items-center space-x-1 px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full transition-colors"
                              title="Insert a prompt that should have been asked before this message"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              </svg>
                              <span>Insert Prompt Before</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-xs lg:max-w-md ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    } rounded-lg px-4 py-2`}>
                      <MessageContent content={message.content} role={message.role} />
                      {adminModeEnabled && isAdmin && message.role === 'assistant' && (
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
                  
                  {/* Message Feedback Bar - Only for assistant messages in admin mode */}
                  {adminModeEnabled && isAdmin && message.role === 'assistant' && currentConversationId && (
                    <MessageFeedbackBar 
                      chatId={currentConversationId}
                      messageId={message.id}
                      onRefinementClick={(initialFeedback) => handleRefinementClick(message.id, message.content, initialFeedback)}
                    />
                  )}
                  
                  {/* Insert Missing Prompt Editor */}
                  {insertingAfterMessageId === message.id && (
                    <div className="ml-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-orange-800">Insert Missing Prompt</div>
                        <p className="text-xs text-gray-600">Add a follow-up question or prompt that the AI should have asked after this user message.</p>
                        
                        <textarea
                          value={refinementContent}
                          onChange={(e) => setRefinementContent(e.target.value)}
                          className="w-full p-2 border border-orange-300 rounded text-gray-900 text-sm"
                          rows={3}
                          placeholder="What follow-up question should the AI have asked here?"
                          autoFocus
                        />
                        
                        <textarea
                          value={refinementNotes}
                          onChange={(e) => setRefinementNotes(e.target.value)}
                          className="w-full p-2 border border-orange-300 rounded text-gray-900 text-sm"
                          rows={2}
                          placeholder="Why was this follow-up needed? (optional)"
                        />
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // Find the next message (should be assistant's response)
                              const nextMessage = messages[index + 1];
                              if (nextMessage && refinementContent.trim()) {
                                saveRefinementToMessage(nextMessage.id);
                              }
                              setInsertingAfterMessageId(null);
                            }}
                            className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                            disabled={!refinementContent.trim()}
                          >
                            <CheckIcon className="h-4 w-4 inline mr-1" />
                            Save Missing Prompt
                          </button>
                          <button
                            onClick={() => {
                              setInsertingAfterMessageId(null);
                              setRefinementContent('');
                              setRefinementNotes('');
                            }}
                            className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            <XMarkIcon className="h-4 w-4 inline mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Refinement Editor */}
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
                          <option value="missing_prompt">Missing Follow-up Prompt</option>
                        </select>
                        
                        <textarea
                          value={refinementContent}
                          onChange={(e) => setRefinementContent(e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded text-gray-900 text-sm"
                          rows={4}
                          placeholder={
                            refinementType === 'missing_prompt' 
                              ? "Enter the follow-up question or prompt that should have been asked here..."
                              : refinementType === 'guidance'
                              ? "Enter guidance for how the AI should handle similar situations..."
                              : refinementType === 'correction'
                              ? "Enter the corrected response..."
                              : "Enter the alternative response..."
                          }
                        />
                        
                        <textarea
                          value={refinementNotes}
                          onChange={(e) => setRefinementNotes(e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded text-gray-900 text-sm"
                          rows={2}
                          placeholder={
                            refinementType === 'missing_prompt'
                              ? "Why this follow-up was needed (optional)..."
                              : "Notes (optional)..."
                          }
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
                  {adminModeEnabled && messageRefinements[message.id]?.map((refinement: Refinement) => (
                    <div key={refinement.id} className="ml-8 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-2">
                        <div className="text-lg">
                          {refinement.refinement_type === 'guidance' ? '💡' :
                           refinement.refinement_type === 'correction' ? '✏️' :
                           refinement.refinement_type === 'missing_prompt' ? '❓' :
                           '🔄'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-yellow-800 mb-1">
                            {refinement.refinement_type === 'guidance' ? 'Guidance' :
                             refinement.refinement_type === 'correction' ? 'Correction' :
                             refinement.refinement_type === 'missing_prompt' ? 'Missing Follow-up' :
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
              
              {showPhase1Prompt && (
                <div className="flex justify-start">
                  <div className="bg-blue-100 rounded-lg px-4 py-2 animate-pulse">
                    <div className="text-sm text-blue-600">Preparing guidance...</div>
                  </div>
                </div>
              )}
              
              {showTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse" 
                           style={{ 
                             animation: 'typingDot 1.4s infinite ease-in-out',
                             animationDelay: '0s'
                           }}></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" 
                           style={{ 
                             animation: 'typingDot 1.4s infinite ease-in-out',
                             animationDelay: '0.2s'
                           }}></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" 
                           style={{ 
                             animation: 'typingDot 1.4s infinite ease-in-out',
                             animationDelay: '0.4s'
                           }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form - Fixed at bottom */}
        {currentConversationId && (
          <form onSubmit={handleSubmit} className="border-t p-4 flex-shrink-0 bg-white sticky bottom-0">
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
        )}
      </div>
      
      {/* Reflection Tracker Sidebar - Scrollable independently */}
      <div className={`${isTrackerVisible ? 'w-80' : 'w-12'} transition-all duration-300 border-l border-gray-200 bg-gray-50 relative flex flex-col`}>
        {/* Chevron Toggle Button - positioned on the border */}
        <button
          onClick={toggleTracker}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-full p-0.5 hover:bg-gray-50 transition-colors group shadow-sm"
          title={isTrackerVisible ? 'Hide progress tracker' : 'Show progress tracker'}
        >
          {isTrackerVisible ? (
            <ChevronRightIcon className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
          )}
        </button>
        
        {/* Collapsed state indicator - clickable */}
        {!isTrackerVisible && (
          <div 
            onClick={toggleTracker}
            className="flex flex-col items-center py-4 cursor-pointer hover:bg-gray-100 h-full"
          >
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            <div className="text-xs text-gray-400 transform rotate-90 mt-8">
              Progress
            </div>
          </div>
        )}
        
        {/* Expanded state content - Scrollable */}
        {isTrackerVisible && (
          <div className="flex-1 overflow-y-auto p-4">
            <ReflectionTracker 
              steps={steps}
              currentPhase={currentPhase}
              totalPhases={totalPhases}
            />
          </div>
        )}
      </div>
      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        conversationId={currentConversationId || ''}
        messages={messages}
        conversationTitle={conversationTitle}
        userEmail={user?.email}
      />
      
      {/* Debug Export Modal */}
      <DebugExportModal
        isOpen={showDebugExportModal}
        onClose={() => setShowDebugExportModal(false)}
        conversationTitle={conversationTitle}
        onConfirm={async (comments) => {
          // Get admin tuner settings if available
          const settings = localStorage.getItem('adminTunerSettings');
          const adminTunerSettings = settings ? JSON.parse(settings) : undefined;
          
          // Add refinements to messages
          const messagesWithRefinements = messages.map(msg => ({
            ...msg,
            refinements: messageRefinements[msg.id] || []
          }));
          
          await exportChatForDebug(
            currentConversationId!,
            conversationTitle,
            messagesWithRefinements,
            currentPhase,
            adminTunerSettings,
            comments
          );
          
          setShowDebugExportModal(false);
        }}
      />
      
      {/* Message Refinement Modal */}
      {showRefinementModal && refinementMessageId && currentConversationId && (
        <MessageRefinementModal
          isOpen={showRefinementModal}
          onClose={() => {
            setShowRefinementModal(false);
            setRefinementMessageId(null);
            setRefinementMessageContent('');
            setRefinementInitialFeedback(undefined);
          }}
          chatId={currentConversationId}
          messageId={refinementMessageId}
          originalContent={refinementMessageContent}
          initialFeedback={refinementInitialFeedback}
        />
      )}
      
      {/* Chat Tuner for Admins/Experts */}
      <ChatTuner 
        onSettingsChange={(newSettings: ChatSettings) => {
          console.log('Chat settings updated:', newSettings);
          // Settings will be passed to backend in sendMessage function
        }}
      />
    </div>
    </>
  );
};
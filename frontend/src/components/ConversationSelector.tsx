import React from 'react';
import { CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  is_completed?: boolean;
  completion_step?: number;
}

interface ConversationSelectorProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showCompletionStatus?: boolean;
  showDate?: boolean;
  dateField?: 'created_at' | 'updated_at';
}

export const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  label,
  placeholder = 'Select Conversation',
  className = '',
  showCompletionStatus = true,
  showDate = true,
  dateField = 'created_at'
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getConversationLabel = (conv: Conversation) => {
    const parts = [conv.title];
    
    if (showDate) {
      const dateValue = dateField === 'updated_at' ? conv.updated_at : conv.created_at;
      if (dateValue) {
        parts.push(`(${formatDate(dateValue)})`);
      }
    }
    
    if (showCompletionStatus && conv.is_completed) {
      parts.push('✓');
    }
    
    return parts.join(' ');
  };

  return (
    <div className={`conversation-selector ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <select
        value={selectedConversationId || ''}
        onChange={(e) => onConversationSelect(e.target.value)}
        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">{placeholder}</option>
        {conversations.map(conv => (
          <option key={conv.id} value={conv.id}>
            {getConversationLabel(conv)}
          </option>
        ))}
      </select>
      
      {selectedConversationId && conversations.length > 0 && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          {(() => {
            const selected = conversations.find(c => c.id === selectedConversationId);
            if (!selected) return null;
            
            return (
              <>
                {selected.is_completed && (
                  <div className="flex items-center mr-3">
                    <CheckCircleIcon className="h-3 w-3 mr-1 text-green-500" />
                    <span>Completed</span>
                    {selected.completion_step && (
                      <span className="ml-1">(Step {selected.completion_step})</span>
                    )}
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>Last updated: {formatDate(selected.updated_at || selected.created_at)}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
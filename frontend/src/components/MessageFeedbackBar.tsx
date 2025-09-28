import React, { useState } from 'react';
import { 
  StarIcon, 
  PencilIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/CustomAuthContext';

interface MessageFeedbackBarProps {
  chatId: string;
  messageId: string;
  onRefinementClick: (initialFeedback?: { category?: string; rating?: number; tags: string[]; comment?: string }) => void;
}

interface FeedbackState {
  category?: string;
  rating?: number;
  tags: string[];
  comment?: string;
  submitted: boolean;
}

const FEEDBACK_CATEGORIES = [
  { id: 'accuracy', label: 'Accuracy', icon: CheckCircleIcon },
  { id: 'clarity', label: 'Clarity', icon: ChatBubbleLeftRightIcon },
  { id: 'tone', label: 'Tone', icon: StarIcon },
  { id: 'practicality', label: 'Practicality', icon: HandThumbUpIcon },
  { id: 'child_centeredness', label: 'Child-Centered', icon: StarIcon },
  { id: 'process_fit', label: 'Process Fit', icon: CheckCircleIcon }
];

const QUICK_TAGS = [
  { id: 'too_long', label: 'Too Long', type: 'negative' },
  { id: 'drifted', label: 'Off Topic', type: 'negative' },
  { id: 'too_sharp', label: 'Too Sharp', type: 'negative' },
  { id: 'too_theoretical', label: 'Too Abstract', type: 'negative' },
  { id: 'parent_centric', label: 'Parent-Focused', type: 'negative' },
  { id: 'skipped_steps', label: 'Skipped Steps', type: 'negative' },
  { id: 'helpful', label: 'Helpful', type: 'positive' },
  { id: 'clear', label: 'Clear', type: 'positive' },
  { id: 'empathetic', label: 'Empathetic', type: 'positive' }
];

export const MessageFeedbackBar: React.FC<MessageFeedbackBarProps> = ({
  chatId,
  messageId,
  onRefinementClick
}) => {
  const { user, isAdmin } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackState>({
    tags: [],
    submitted: false
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show for admin users
  if (!isAdmin) {
    return null;
  }

  const handleCategorySelect = (category: string) => {
    setFeedback(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category
    }));
  };

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({
      ...prev,
      rating: prev.rating === rating ? undefined : rating
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFeedback(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async () => {
    if (!feedback.category) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'x-user-email': user?.email || '',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          chatId,
          messageId,
          category: feedback.category,
          rating: feedback.rating,
          tags: feedback.tags,
          comment: feedback.comment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setFeedback(prev => ({ ...prev, submitted: true }));
      setTimeout(() => setIsExpanded(false), 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const StarComponent = i < rating ? StarIconSolid : StarIcon;
      return (
        <StarComponent
          key={i}
          className={`h-4 w-4 cursor-pointer ${
            i < rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
          }`}
          onClick={() => handleRatingClick(i + 1)}
        />
      );
    });
  };

  if (feedback.submitted) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mt-2">
        <CheckCircleIcon className="h-4 w-4" />
        <span>Feedback submitted successfully</span>
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-gray-200 pt-2">
      {!isExpanded ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-gray-500 hover:text-blue-600 flex items-center space-x-1"
            >
              <HandThumbUpIcon className="h-4 w-4" />
              <span>Quick Feedback</span>
            </button>
            
            {/* Quick tag chips */}
            <div className="flex space-x-1">
              {QUICK_TAGS.slice(0, 3).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    feedback.tags.includes(tag.id)
                      ? tag.type === 'positive' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onRefinementClick(feedback)}
            className="text-gray-500 hover:text-blue-600 flex items-center space-x-1"
            title="Add detailed refinement"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Category
            </label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                      feedback.category === cat.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          {feedback.category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (optional)
              </label>
              <div className="flex space-x-1">
                {renderStars(feedback.rating || 0)}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    feedback.tags.includes(tag.id)
                      ? tag.type === 'positive' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Comment (optional)
            </label>
            <textarea
              value={feedback.comment || ''}
              onChange={e => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="Any additional context or notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onRefinementClick(feedback)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Detailed Edit</span>
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!feedback.category || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
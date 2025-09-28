import React, { useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CogIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/CustomAuthContext';

interface MessageRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  messageId: string;
  originalContent: string;
  initialFeedback?: {
    category?: string;
    rating?: number;
    tags: string[];
    comment?: string;
  };
}

interface RefinementState {
  category: string;
  primaryText: string;
  notes: string;
  governanceTags: string[];
  systemProfileId?: string;
  promptTemplateId?: string;
  model?: string;
  applyAsOverride: boolean;
}

const QUICK_TAGS = [
  { id: 'too_long', label: 'Too Long' },
  { id: 'drifted', label: 'Off Topic' },
  { id: 'too_sharp', label: 'Too Sharp' },
  { id: 'too_theoretical', label: 'Too Abstract' },
  { id: 'parent_centric', label: 'Parent-Focused' },
  { id: 'skipped_steps', label: 'Skipped Steps' },
  { id: 'helpful', label: 'Helpful' },
  { id: 'clear', label: 'Clear' },
  { id: 'empathetic', label: 'Empathetic' }
];

const REFINEMENT_CATEGORIES = [
  { 
    id: 'alternative_response', 
    label: 'Alternative Response', 
    icon: ChatBubbleLeftRightIcon,
    description: 'Provide a better response to the user\'s message'
  },
  { 
    id: 'guidance_for_future', 
    label: 'Guidance for Future', 
    icon: DocumentTextIcon,
    description: 'General guidance to improve similar responses'
  },
  { 
    id: 'correction', 
    label: 'Correction', 
    icon: ExclamationTriangleIcon,
    description: 'Fix factual errors or problematic content'
  },
  { 
    id: 'missing_followup_prompt', 
    label: 'Missing Follow-up Prompt', 
    icon: CheckCircleIcon,
    description: 'Add missing step or follow-up question'
  },
  { 
    id: 'insert_prompt_before', 
    label: 'Insert Prompt Before', 
    icon: DocumentTextIcon,
    description: 'Add a prompt or question that should come before this response'
  }
];

const GOVERNANCE_TAGS = [
  // Tone tags
  'tone/calm', 'tone/empathetic', 'tone/professional', 'tone/supportive',
  // Clarity tags  
  'clear/concise', 'clear/structured', 'clear/actionable', 'clear/specific',
  // Process tags
  'seven_step/1', 'seven_step/2', 'seven_step/3', 'seven_step/4', 
  'seven_step/5', 'seven_step/6', 'seven_step/7',
  // Content tags
  'child_centered', 'practical', 'evidence_based', 'trauma_informed'
];

export const MessageRefinementModal: React.FC<MessageRefinementModalProps> = ({
  isOpen,
  onClose,
  chatId,
  messageId,
  originalContent,
  initialFeedback
}) => {
  const { user } = useAuth();
  
  // Map feedback tags to governance tags
  const mapFeedbackToGovernanceTags = (tags: string[]): string[] => {
    const tagMapping: Record<string, string[]> = {
      'too_long': ['clear/concise'],
      'drifted': ['clear/structured', 'seven_step/1'],
      'too_sharp': ['tone/calm', 'tone/empathetic'],
      'too_theoretical': ['clear/actionable', 'practical'],
      'parent_centric': ['child_centered'],
      'skipped_steps': ['seven_step/1', 'seven_step/2', 'seven_step/3'],
      'helpful': ['tone/supportive'],
      'clear': ['clear/concise', 'clear/structured'],
      'empathetic': ['tone/empathetic', 'tone/supportive']
    };
    
    const governanceTags: string[] = [];
    tags.forEach(tag => {
      if (tagMapping[tag]) {
        governanceTags.push(...tagMapping[tag]);
      }
    });
    
    return Array.from(new Set(governanceTags)); // Remove duplicates
  };
  
  const [refinement, setRefinement] = useState<RefinementState>({
    category: initialFeedback?.category === 'quality' || initialFeedback?.category === 'accuracy' 
      ? 'alternative_response' 
      : '',
    primaryText: '',
    notes: initialFeedback?.comment || '',
    governanceTags: initialFeedback?.tags ? mapFeedbackToGovernanceTags(initialFeedback.tags) : [],
    applyAsOverride: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleTagToggle = (tag: string) => {
    setRefinement(prev => ({
      ...prev,
      governanceTags: prev.governanceTags.includes(tag)
        ? prev.governanceTags.filter(t => t !== tag)
        : [...prev.governanceTags, tag]
    }));
  };

  const handleSubmit = async () => {
    if (!refinement.category || !refinement.primaryText) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/feedback/refinements`, {
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
          category: refinement.category,
          primaryText: refinement.primaryText,
          notes: refinement.notes,
          governanceTags: refinement.governanceTags,
          systemProfileId: refinement.systemProfileId,
          promptTemplateId: refinement.promptTemplateId,
          model: refinement.model,
          applyAsOverride: refinement.applyAsOverride
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit refinement');
      }

      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
        setRefinement({
          category: '',
          primaryText: '',
          notes: '',
          governanceTags: [],
          applyAsOverride: false
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting refinement:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Message Refinement</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Show initial feedback if present */}
          {initialFeedback && (initialFeedback.tags.length > 0 || initialFeedback.comment) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">Quick Feedback Carried Over:</p>
              {initialFeedback.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {initialFeedback.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {QUICK_TAGS.find(t => t.id === tag)?.label || tag}
                    </span>
                  ))}
                </div>
              )}
              {initialFeedback.rating && (
                <p className="text-xs text-blue-700">Rating: {initialFeedback.rating}/5</p>
              )}
              {initialFeedback.comment && (
                <p className="text-xs text-blue-700 mt-1">Comment: {initialFeedback.comment}</p>
              )}
            </div>
          )}

          {/* Original Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Message
            </label>
            <div className="bg-gray-50 p-4 rounded-lg border max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{originalContent}</p>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Refinement Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REFINEMENT_CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setRefinement(prev => ({ ...prev, category: cat.id }))}
                    className={`flex items-start space-x-3 p-3 rounded-lg border text-left transition-colors ${
                      refinement.category === cat.id
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{cat.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{cat.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {refinement.category === 'alternative_response' ? 'Alternative Response' :
               refinement.category === 'correction' ? 'Corrected Content' :
               refinement.category === 'missing_followup_prompt' ? 'Follow-up Prompt' :
               refinement.category === 'insert_prompt_before' ? 'Prompt to Insert Before' :
               'Guidance Text'} *
            </label>
            <textarea
              value={refinement.primaryText}
              onChange={e => setRefinement(prev => ({ ...prev, primaryText: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder={
                refinement.category === 'alternative_response' ? 'Provide the improved response...' :
                refinement.category === 'correction' ? 'Provide the corrected content...' :
                refinement.category === 'missing_followup_prompt' ? 'What follow-up question or prompt should be added?' :
                refinement.category === 'insert_prompt_before' ? 'What prompt or question should come before this response?' :
                'Describe the guidance for improving similar responses...'
              }
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rationale & Context (optional)
            </label>
            <textarea
              value={refinement.notes}
              onChange={e => setRefinement(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Explain why this refinement is needed and provide context for future improvements..."
            />
          </div>

          {/* Governance Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Governance Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {GOVERNANCE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    refinement.governanceTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Technical Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Profile ID (optional)
              </label>
              <input
                type="text"
                value={refinement.systemProfileId || ''}
                onChange={e => setRefinement(prev => ({ ...prev, systemProfileId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g., co-parenting-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Template ID (optional)
              </label>
              <input
                type="text"
                value={refinement.promptTemplateId || ''}
                onChange={e => setRefinement(prev => ({ ...prev, promptTemplateId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g., seven-step-v2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model (optional)
              </label>
              <input
                type="text"
                value={refinement.model || ''}
                onChange={e => setRefinement(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g., gpt-4-turbo"
              />
            </div>
          </div>

          {/* Apply as Override */}
          <div className="flex items-center space-x-2">
            <input
              id="applyAsOverride"
              type="checkbox"
              checked={refinement.applyAsOverride}
              onChange={e => setRefinement(prev => ({ ...prev, applyAsOverride: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="applyAsOverride" className="text-sm text-gray-700">
              Apply as system override (affects future responses immediately)
            </label>
          </div>

          {/* Submit Status */}
          {submitStatus === 'success' && (
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Refinement submitted successfully</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Failed to submit refinement. Please try again.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!refinement.category || !refinement.primaryText || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting && <CogIcon className="h-4 w-4 animate-spin" />}
            <span>{isSubmitting ? 'Submitting...' : 'Submit Refinement'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
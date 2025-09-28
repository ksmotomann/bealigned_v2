import React, { useState } from 'react';
import { issuesApi } from '../services/api';
import { 
  ExclamationCircleIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface IssueFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const ISSUE_TYPES = [
  {
    value: 'bug',
    label: 'Bug Report',
    description: 'Something is broken or not working as expected',
    icon: <ExclamationCircleIcon className="h-5 w-5" />,
    color: 'text-red-600'
  },
  {
    value: 'feature',
    label: 'Feature Request',
    description: 'Suggest a new feature or functionality',
    icon: <LightBulbIcon className="h-5 w-5" />,
    color: 'text-yellow-600'
  },
  {
    value: 'improvement',
    label: 'Enhancement',
    description: 'Suggest improvements to existing features',
    icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
    color: 'text-blue-600'
  },
  {
    value: 'question',
    label: 'Question',
    description: 'Ask a question or request clarification',
    icon: <QuestionMarkCircleIcon className="h-5 w-5" />,
    color: 'text-green-600'
  }
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', description: 'Nice to have, no rush', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', description: 'Would be helpful soon', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', description: 'Important, needed soon', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', description: 'Urgent, blocking work', color: 'bg-red-100 text-red-800' }
];

export const IssueForm: React.FC<IssueFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    urgency: 'medium',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.type) {
      setError('Please select an issue type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await issuesApi.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        urgency: formData.urgency,
        tags: tagsArray
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to create issue:', error);
      setError(error.response?.data?.error || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = ISSUE_TYPES.find(type => type.value === formData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Submit Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Issue Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of feedback is this? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ISSUE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.type === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={type.color}>{type.icon}</div>
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {selectedType ? `${selectedType.label} Title` : 'Title'} *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={
                formData.type === 'bug' ? 'Brief description of the bug...' :
                formData.type === 'feature' ? 'Brief description of the feature...' :
                formData.type === 'improvement' ? 'Brief description of the improvement...' :
                formData.type === 'question' ? 'Your question in brief...' :
                'Brief summary of your feedback...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              placeholder={
                formData.type === 'bug' 
                  ? 'Please provide steps to reproduce, expected behavior, actual behavior, and any error messages...' :
                formData.type === 'feature' 
                  ? 'Describe the feature, why it would be useful, and how you envision it working...' :
                formData.type === 'improvement' 
                  ? 'Describe what could be improved and how it would benefit users...' :
                formData.type === 'question' 
                  ? 'Provide more context about your question...' :
                'Provide additional details...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority Level
            </label>
            <div className="space-y-2">
              {URGENCY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgency: level.value }))}
                  className={`w-full p-3 border rounded-md text-left flex items-center justify-between transition-all ${
                    formData.urgency === level.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <span className="font-medium text-gray-900">{level.label}</span>
                    <span className="text-sm text-gray-600 ml-2">{level.description}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.color}`}>
                    {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="chat, mobile, performance (separate with commas)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add relevant tags to help categorize your feedback
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
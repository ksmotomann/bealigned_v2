import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface IssueResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (data: ResolutionData) => void;
  issueTitle: string;
}

export interface ResolutionData {
  resolution_description: string;
  follow_up_needed: boolean;
  follow_up_description?: string;
  is_fully_complete: boolean;
}

export const IssueResolutionModal: React.FC<IssueResolutionModalProps> = ({
  isOpen,
  onClose,
  onResolve,
  issueTitle
}) => {
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDescription, setFollowUpDescription] = useState('');
  const [isFullyComplete, setIsFullyComplete] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resolutionDescription.trim()) {
      alert('Please provide a resolution description');
      return;
    }

    if (followUpNeeded && !followUpDescription.trim()) {
      alert('Please describe the follow-up needed');
      return;
    }

    onResolve({
      resolution_description: resolutionDescription,
      follow_up_needed: followUpNeeded,
      follow_up_description: followUpNeeded ? followUpDescription : undefined,
      is_fully_complete: isFullyComplete
    });

    // Reset form
    setResolutionDescription('');
    setFollowUpNeeded(false);
    setFollowUpDescription('');
    setIsFullyComplete(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg px-6 py-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Resolve Issue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">Resolving:</p>
          <p className="font-medium text-gray-900">{issueTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resolution Description *
            </label>
            <textarea
              value={resolutionDescription}
              onChange={(e) => setResolutionDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Describe how this issue was resolved..."
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFullyComplete"
                checked={isFullyComplete}
                onChange={(e) => setIsFullyComplete(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isFullyComplete" className="ml-2 text-sm text-gray-700">
                This represents the full completion of the issue
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="followUpNeeded"
                checked={followUpNeeded}
                onChange={(e) => {
                  setFollowUpNeeded(e.target.checked);
                  if (!e.target.checked) {
                    setFollowUpDescription('');
                  }
                }}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="followUpNeeded" className="ml-2 text-sm text-gray-700">
                Follow-up action is needed
              </label>
            </div>
          </div>

          {followUpNeeded && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Description *
              </label>
              <textarea
                value={followUpDescription}
                onChange={(e) => setFollowUpDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Describe what follow-up action is needed..."
                required={followUpNeeded}
              />
              <p className="mt-1 text-xs text-gray-500">
                A new issue will be created for this follow-up
              </p>
            </div>
          )}

          <div className="border-t pt-4 flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-500">
              {isFullyComplete ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                  Issue will be marked as fully resolved
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-1 text-orange-500" />
                  Issue will be marked as partially resolved
                </>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
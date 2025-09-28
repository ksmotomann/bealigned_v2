import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DebugExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  conversationTitle: string;
}

export const DebugExportModal: React.FC<DebugExportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  conversationTitle
}) => {
  const [comments, setComments] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(comments);
    setComments(''); // Reset for next time
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Debug Export</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Exporting conversation: <span className="font-medium">{conversationTitle}</span>
          </p>
          <p className="text-sm text-gray-500">
            This will create a JSON file with all conversation data, metadata, and phase tracking information
            for analysis in Claude.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
              Debug Comments (Optional)
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              placeholder="Add any notes about this conversation that might help with debugging or analysis...&#10;&#10;Examples:&#10;- User seemed confused at Phase 3&#10;- AI responses were too long&#10;- Phase detection was incorrect"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              Export with Comments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
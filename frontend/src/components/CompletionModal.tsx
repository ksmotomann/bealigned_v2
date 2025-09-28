import React, { useState } from 'react';
import { 
  XMarkIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { conversationApi } from '../services/api';
import { exportChatToText, exportChatToPDF } from '../utils/exportUtils';
import { supabaseFunctions } from '../services/supabaseFunctions';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  messages: Array<{
    role: string;
    content: string;
    created_at: string;
  }>;
  conversationTitle?: string;
  userEmail?: string;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  messages,
  conversationTitle = 'Conversation',
  userEmail = ''
}) => {
  const [email, setEmail] = useState(userEmail);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Update email when userEmail prop changes
  React.useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  console.log('CompletionModal render - isOpen:', isOpen, 'conversationId:', conversationId, 'userEmail:', userEmail);
  if (!isOpen) return null;

  const handleEmailTranscript = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    console.log('Sending transcript to:', email, 'for conversation:', conversationId);
    setSendingEmail(true);
    try {
      // Use Supabase Edge Function instead of Express backend
      const result = await supabaseFunctions.sendTranscript(conversationId, email);
      console.log('Email sent successfully:', result);
      setEmailSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to email transcript - Full error:', error);
      console.error('Error stack:', error.stack);
      
      // Extract more detailed error message
      let errorMessage = 'Unknown error';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.details) {
        errorMessage += `: ${error.details}`;
      }
      
      alert(`Failed to send email: ${errorMessage}. Please try downloading instead.`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadText = () => {
    exportChatToText(messages, conversationTitle);
  };

  const handleDownloadPDF = () => {
    exportChatToPDF(messages, conversationTitle);
  };

  const handleCloseLater = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Session Complete!</h2>
            <p className="text-sm text-gray-600 mt-1">
              Great work completing your reflection session. How would you like to save your transcript?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {emailSent ? (
          <div className="py-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-600 font-medium">Transcript sent successfully!</p>
            <p className="text-sm text-gray-500 mt-1">Check your email for the transcript.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Email Option */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Email Transcript</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive your transcript as both text and PDF attachment
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleEmailTranscript}
                      disabled={sendingEmail}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendingEmail ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <DocumentArrowDownIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Download Transcript</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Save your transcript to your device
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={handleDownloadText}
                      className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      Download Text
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Close and Return Later */}
            <button
              onClick={handleCloseLater}
              className="w-full border border-gray-300 rounded-lg p-4 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Close & Return Later</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    You can access your transcript anytime from your conversation history
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
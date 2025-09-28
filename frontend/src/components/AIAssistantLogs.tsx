import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { adminApi } from '../services/api';
import { Navigation } from './Navigation';
import { 
  HomeIcon, 
  ArrowLeftIcon, 
  SparklesIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AILog {
  id: string;
  user_id: string;
  query: string;
  response: string;
  response_time_ms: number;
  error_message?: string;
  created_at: string;
  profiles: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export const AIAssistantLogs: React.FC = () => {
  const navigate = useNavigate();
  const { adminModeEnabled } = useAdminModeContext();
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getAIAssistantLogs({ limit: 100 });
      setLogs(response.data || []);
    } catch (err: any) {
      console.error('Failed to load AI logs:', err);
      setError('Failed to load AI Assistant logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatUserName = (profiles: AILog['profiles']) => {
    if (profiles.first_name || profiles.last_name) {
      return `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim();
    }
    return profiles.email;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(adminModeEnabled ? '/admin' : '/home')}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label={adminModeEnabled ? "Back to Admin Dashboard" : "Back to Home"}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
                  AI Assistant Logs
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logs List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent AI Interactions</h2>
              <button
                onClick={loadLogs}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading logs...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadLogs}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <SparklesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No AI interactions found</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                      selectedLog?.id === log.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatUserName(log.profiles)}
                          </p>
                          {log.error_message && (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {truncateText(log.query, 80)}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                          <span className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatResponseTime(log.response_time_ms)}
                          </span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Interaction Details</h2>
            </div>
            {selectedLog ? (
              <div className="p-4 space-y-4">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">User</h3>
                  <p className="text-sm text-gray-900">{formatUserName(selectedLog.profiles)}</p>
                  <p className="text-xs text-gray-500">{selectedLog.profiles.email}</p>
                </div>

                {/* Query */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Query</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.query}</p>
                  </div>
                </div>

                {/* Response or Error */}
                {selectedLog.error_message ? (
                  <div>
                    <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Error
                    </h3>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-sm text-red-900">{selectedLog.error_message}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Response</h3>
                    <div className="bg-blue-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.response}</p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium">Response Time:</span> {formatResponseTime(selectedLog.response_time_ms)}</p>
                    <p><span className="font-medium">Timestamp:</span> {new Date(selectedLog.created_at).toLocaleString()}</p>
                    <p><span className="font-medium">User ID:</span> {selectedLog.user_id}</p>
                    <p><span className="font-medium">Log ID:</span> {selectedLog.id}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <SparklesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Select a log entry to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
import React, { useState, useEffect } from 'react';
import { issuesApi, githubSyncApi } from '../services/api';
import { IssueForm } from './IssueForm';
import { IssueDetail } from './IssueDetail';
import { Navigation } from './Navigation';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  LinkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'improvement' | 'question';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  priority: number;
  submitted_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  tags: string[];
  github_issue_number?: number;
  github_sync_status?: string;
  github_synced_at?: string;
  github_url?: string;
  submitted_by_profile: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  assigned_to_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  issue_comments: { count: number }[];
}

const TYPE_ICONS = {
  bug: <ExclamationCircleIcon className="h-4 w-4" />,
  feature: <LightBulbIcon className="h-4 w-4" />,
  improvement: <WrenchScrewdriverIcon className="h-4 w-4" />,
  question: <QuestionMarkCircleIcon className="h-4 w-4" />
};

const TYPE_COLORS = {
  bug: 'text-red-600 bg-red-50',
  feature: 'text-yellow-600 bg-yellow-50',
  improvement: 'text-blue-600 bg-blue-50',
  question: 'text-green-600 bg-green-50'
};

const STATUS_ICONS = {
  open: <ClockIcon className="h-4 w-4" />,
  in_progress: <ArrowPathIcon className="h-4 w-4" />,
  resolved: <CheckCircleIcon className="h-4 w-4" />,
  closed: <CheckCircleIcon className="h-4 w-4" />,
  rejected: <XCircleIcon className="h-4 w-4" />
};

const STATUS_COLORS = {
  open: 'text-gray-600 bg-gray-50',
  in_progress: 'text-blue-600 bg-blue-50',
  resolved: 'text-green-600 bg-green-50',
  closed: 'text-gray-600 bg-gray-100',
  rejected: 'text-red-600 bg-red-50'
};

const URGENCY_COLORS = {
  low: 'text-gray-600 bg-gray-50',
  medium: 'text-blue-600 bg-blue-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50'
};

interface IssueStats {
  total: number;
  by_status: { [key: string]: number };
  by_type: { [key: string]: number };
  by_urgency: { [key: string]: number };
}

interface IssuesManagerProps {
  adminMode?: boolean;
}

export const IssuesManager: React.FC<IssuesManagerProps> = ({ adminMode = false }) => {
  const { user, isAdmin, isSuperAdmin, isExpert } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const navigate = useNavigate();
  
  // Only show admin features if user is admin AND admin mode is enabled
  const effectiveAdminMode = (isAdmin || isSuperAdmin || isExpert) && adminModeEnabled;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    urgency: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [issueStats, setIssueStats] = useState<IssueStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  useEffect(() => {
    loadIssues();
    loadIssueStats();
    if (effectiveAdminMode) {
      loadSyncStatus();
    }
  }, [filters, effectiveAdminMode]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value)
      );
      
      // Admins see all issues when in admin mode
      const showAllIssues = effectiveAdminMode;
      
      const { data } = await issuesApi.getAll({
        ...params,
        showAll: showAllIssues
      });
      setIssues(data || []);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIssueStats = async () => {
    try {
      const response = await issuesApi.getStats();
      setIssueStats(response.data);
    } catch (error) {
      console.error('Failed to load issue stats:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await githubSyncApi.getSyncStatus();
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleSyncToGitHub = async () => {
    if (!window.confirm('Sync all enhancement issues to GitHub? This will create/update GitHub issues for all features and improvements.')) {
      return;
    }

    setSyncing(true);
    try {
      const response = await githubSyncApi.syncToGitHub();
      alert(response.data.message || 'GitHub sync completed');
      await loadIssues();
      await loadSyncStatus();
    } catch (error: any) {
      alert(`Failed to sync: ${error.response?.data?.details || error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromGitHub = async () => {
    if (!window.confirm('Sync status from GitHub? This will update the status of synced issues based on their GitHub state.')) {
      return;
    }

    setSyncing(true);
    try {
      await githubSyncApi.syncFromGitHub();
      alert('Successfully synced from GitHub');
      await loadIssues();
      await loadSyncStatus();
    } catch (error: any) {
      alert(`Failed to sync: ${error.response?.data?.details || error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', type: '', urgency: '' });
  };

  const getCommentCount = (issue: Issue) => {
    return issue.issue_comments?.[0]?.count || 0;
  };

  const formatUserName = (profile: any) => {
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };

  if (selectedIssue) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50">
          <IssueDetail
            issueId={selectedIssue}
            onBack={() => setSelectedIssue(null)}
            onUpdate={loadIssues}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {effectiveAdminMode && (
                    <button
                      onClick={() => navigate(adminModeEnabled ? '/admin' : '/home')}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label={adminModeEnabled ? "Back to Admin Dashboard" : "Back to Home"}
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mr-3" />
                      Feedback & Issues
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                      {effectiveAdminMode ? 'Manage and respond to user feedback' : 'Submit feedback or report issues'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                  <button
                    onClick={() => setShowIssueForm(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Types</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="question">Question</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => handleFilterChange('urgency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Urgencies</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {issueStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Issues</p>
                    <p className="text-2xl font-semibold text-gray-900">{issueStats.total}</p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Open</p>
                    <p className="text-2xl font-semibold text-blue-600">
                      {issueStats.by_status.open || 0}
                    </p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">In Progress</p>
                    <p className="text-2xl font-semibold text-yellow-600">
                      {issueStats.by_status.in_progress || 0}
                    </p>
                  </div>
                  <ArrowPathIcon className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {issueStats.by_status.resolved || 0}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>
          )}

          {/* GitHub Sync Controls (Admin Only) */}
          {isAdmin && syncStatus && (
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">GitHub Sync</p>
                    <p className="text-xs text-gray-500">
                      Last sync: {syncStatus.last_sync ? new Date(syncStatus.last_sync).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSyncToGitHub}
                    disabled={syncing}
                    className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                    Push to GitHub
                  </button>
                  <button
                    onClick={handleSyncFromGitHub}
                    disabled={syncing}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Pull from GitHub
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Issues List */}
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading issues...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No issues found</p>
                <button
                  onClick={() => setShowIssueForm(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create First Issue
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {issues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue.id)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Title and Type */}
                        <div className="flex items-center mb-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[issue.type]}`}>
                            {TYPE_ICONS[issue.type]}
                            <span className="ml-1">{issue.type}</span>
                          </span>
                          <h3 className="ml-3 text-sm font-medium text-gray-900 truncate">
                            {issue.title}
                          </h3>
                        </div>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {issue.description}
                        </p>
                        
                        {/* Meta Information */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded ${STATUS_COLORS[issue.status]}`}>
                              {STATUS_ICONS[issue.status]}
                              <span className="ml-1">{issue.status.replace('_', ' ')}</span>
                            </span>
                          </span>
                          <span className={`px-2 py-0.5 rounded ${URGENCY_COLORS[issue.urgency]}`}>
                            {issue.urgency}
                          </span>
                          {/* Show email for super admins, name for others */}
                          {(isSuperAdmin || isAdmin || isExpert) && issue.submitted_by !== user?.id ? (
                            <span className="text-indigo-600">
                              {issue.submitted_by_profile?.email || 'Unknown'}
                            </span>
                          ) : (
                            <span>{formatUserName(issue.submitted_by_profile)}</span>
                          )}
                          {/* Show assigned to if exists */}
                          {issue.assigned_to && (
                            <span className="flex items-center text-green-600">
                              →{' '}
                              {issue.assigned_to_profile?.email || 
                               formatUserName(issue.assigned_to_profile) || 
                               'Assigned'}
                            </span>
                          )}
                          <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                          {getCommentCount(issue) > 0 && (
                            <span className="flex items-center">
                              💬 {getCommentCount(issue)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* GitHub Badge */}
                      {issue.github_issue_number && (
                        <div className="ml-4 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            #{issue.github_issue_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Issue Form Modal */}
        {showIssueForm && (
          <IssueForm
            onClose={() => setShowIssueForm(false)}
            onSuccess={() => {
              setShowIssueForm(false);
              loadIssues();
            }}
          />
        )}
      </div>
    </>
  );
};
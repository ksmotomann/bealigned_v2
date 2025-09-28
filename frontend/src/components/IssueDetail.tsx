import React, { useState, useEffect } from 'react';
import { issuesApi } from '../services/api';
import { useAuth } from '../contexts/CustomAuthContext';
import { IssueResolutionModal, ResolutionData } from './IssueResolutionModal';
import { 
  ArrowLeftIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  PaperAirplaneIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface IssueDetailProps {
  issueId: string;
  onBack: () => void;
  onUpdate?: () => void;
}

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
  resolution_description?: string;
  resolved_by?: string;
  follow_up_needed?: boolean;
  follow_up_description?: string;
  is_fully_complete?: boolean;
  tags: string[];
  archived: boolean;
  archived_at?: string;
  archived_by?: string;
  github_issue_number?: number;
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
  resolved_by_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_internal: boolean;
  author: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const TYPE_ICONS = {
  bug: <ExclamationCircleIcon className="h-5 w-5" />,
  feature: <LightBulbIcon className="h-5 w-5" />,
  improvement: <WrenchScrewdriverIcon className="h-5 w-5" />,
  question: <QuestionMarkCircleIcon className="h-5 w-5" />
};

const TYPE_COLORS = {
  bug: 'text-red-600 bg-red-50 border-red-200',
  feature: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  improvement: 'text-blue-600 bg-blue-50 border-blue-200',
  question: 'text-green-600 bg-green-50 border-green-200'
};

const STATUS_ICONS = {
  open: <ClockIcon className="h-4 w-4" />,
  in_progress: <ChatBubbleLeftRightIcon className="h-4 w-4" />,
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

export const IssueDetail: React.FC<IssueDetailProps> = ({ issueId, onBack, onUpdate }) => {
  const { user, isAdmin, isSuperAdmin, isExpert } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    loadIssue();
    if (isAdmin || isSuperAdmin || isExpert) {
      loadUsers();
    }
  }, [issueId, isAdmin, isSuperAdmin, isExpert]);

  const loadIssue = async () => {
    try {
      setLoading(true);
      const { data } = await issuesApi.getById(issueId);
      setIssue(data);
      setNewStatus(data.status);
      setSelectedAssignee(data.assigned_to || '');
    } catch (error) {
      console.error('Failed to load issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await issuesApi.getUsers();
      setAvailableUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (!issue || selectedAssignee === issue.assigned_to) return;

    try {
      await issuesApi.assignTo(issueId, selectedAssignee || null);
      await loadIssue();
      setEditingAssignment(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      await issuesApi.addComment(issueId, { content: newComment.trim() });
      setNewComment('');
      await loadIssue();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!isAdmin || newStatus === issue?.status) return;

    try {
      await issuesApi.update(issueId, { status: newStatus });
      setEditingStatus(false);
      await loadIssue();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleArchive = async () => {
    if (!isSuperAdmin || !issue) return;

    const confirmMessage = issue.archived 
      ? 'Are you sure you want to unarchive this issue? It will become visible to all users again.'
      : 'Are you sure you want to archive this issue? It will be hidden from normal users.';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await issuesApi.archive(issueId, !issue.archived);
      await loadIssue();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to archive issue:', error);
      alert('Failed to archive issue. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!isSuperAdmin || !issue) return;

    const confirmMessage = 'Are you sure you want to PERMANENTLY DELETE this issue? This action cannot be undone and will remove the issue and all its comments from the database forever.';
    
    if (!window.confirm(confirmMessage)) return;
    
    // Double confirmation for permanent deletion
    const doubleConfirm = window.confirm('This is your final warning. Clicking OK will permanently delete this issue. Are you absolutely sure?');
    if (!doubleConfirm) return;

    try {
      await issuesApi.delete(issueId);
      onUpdate?.();
      onBack(); // Navigate back to issues list since issue no longer exists
    } catch (error) {
      console.error('Failed to delete issue:', error);
      alert('Failed to delete issue. Please try again.');
    }
  };

  const handleResolve = async (resolutionData: ResolutionData) => {
    try {
      await issuesApi.resolve(issueId, resolutionData);
      setShowResolutionModal(false);
      await loadIssue();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      alert('Failed to resolve issue. Please try again.');
    }
  };

  const formatUserName = (profile: any) => {
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">Issue not found</div>
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to Issues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Issues
        </button>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${TYPE_COLORS[issue.type]}`}>
                  {TYPE_ICONS[issue.type]}
                  <span className="ml-2 capitalize">{issue.type}</span>
                </span>
                
                {editingStatus && isAdmin ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      className="text-sm px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingStatus(false);
                        setNewStatus(issue.status);
                      }}
                      className="text-sm px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium cursor-pointer ${STATUS_COLORS[issue.status]} ${isAdmin ? 'hover:opacity-75' : ''}`}
                    onClick={() => isAdmin && setEditingStatus(true)}
                  >
                    {STATUS_ICONS[issue.status]}
                    <span className="ml-1 capitalize">{issue.status.replace('_', ' ')}</span>
                    {isAdmin && <span className="ml-1 text-xs">(click to edit)</span>}
                  </span>
                )}
                
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${URGENCY_COLORS[issue.urgency]}`}>
                  {issue.urgency.charAt(0).toUpperCase() + issue.urgency.slice(1)}
                </span>
                
                {issue.github_url && (
                  <a
                    href={issue.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                  >
                    GitHub #{issue.github_issue_number}
                  </a>
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {issue.title}
              </h1>
              
              {issue.description && (
                <div className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {issue.description}
                </div>
              )}
              
              {/* Resolution Information */}
              {issue.resolution_description && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Resolution
                  </h3>
                  <p className="text-sm text-green-700 whitespace-pre-wrap">
                    {issue.resolution_description}
                  </p>
                  {issue.resolved_by_profile && (
                    <p className="text-xs text-green-600 mt-2">
                      Resolved by {formatUserName(issue.resolved_by_profile)} on {issue.resolved_at ? formatDate(issue.resolved_at) : 'N/A'}
                    </p>
                  )}
                  {issue.follow_up_needed && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-xs font-medium text-orange-800 flex items-center">
                        <ArrowPathIcon className="h-3 w-3 mr-1" />
                        Follow-up Required:
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        {issue.follow_up_description}
                      </p>
                    </div>
                  )}
                  {issue.is_fully_complete && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      ✓ This issue is fully complete
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Submitted by {formatUserName(issue.submitted_by_profile)}
                </span>
                
                {/* Assignment field */}
                {(isAdmin || isSuperAdmin || isExpert) ? (
                  <span className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Assigned to:
                    {editingAssignment ? (
                      <span className="ml-2 flex items-center space-x-2">
                        <select
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">Unassigned</option>
                          {availableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.email} {u.first_name && u.last_name ? `(${u.first_name} ${u.last_name})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssignmentUpdate}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingAssignment(false);
                            setSelectedAssignee(issue.assigned_to || '');
                          }}
                          className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setEditingAssignment(true)}
                        className="ml-2 text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        {issue.assigned_to_profile ? formatUserName(issue.assigned_to_profile) : 'Unassigned'}
                      </button>
                    )}
                  </span>
                ) : issue.assigned_to_profile ? (
                  <span className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Assigned to {formatUserName(issue.assigned_to_profile)}
                  </span>
                ) : null}
                
                <span className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(issue.created_at)}
                </span>
                {issue.tags.length > 0 && (
                  <span className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {issue.tags.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Admin and Super Admin Actions */}
        {(isAdmin || isSuperAdmin) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {/* Resolve Button - for any admin/super admin when issue is not resolved */}
              {issue.status !== 'resolved' && issue.status !== 'closed' && (
                <button
                  onClick={() => setShowResolutionModal(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors text-green-700 bg-green-100 hover:bg-green-200"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </button>
              )}
              
              {/* Super Admin Only Actions */}
              {isSuperAdmin && (
                <>
                  <button
                    onClick={handleArchive}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      issue.archived
                        ? 'text-green-700 bg-green-100 hover:bg-green-200'
                        : 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                    }`}
                  >
                    {issue.archived ? (
                      <>
                        <ArchiveBoxXMarkIcon className="h-4 w-4 mr-2" />
                        Unarchive Issue
                      </>
                    ) : (
                      <>
                        <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                        Archive Issue
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Comments ({issue.comments.length})
          </h2>
        </div>
        
        <div className="p-6">
          {/* Existing Comments */}
          {issue.comments.length > 0 ? (
            <div className="space-y-4 mb-6">
              {issue.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {formatUserName(comment.author)}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 mb-6">
              No comments yet. Be the first to add feedback!
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Add a comment
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                placeholder="Share your thoughts, ask questions, or provide updates..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Resolution Modal */}
      <IssueResolutionModal
        isOpen={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        onResolve={handleResolve}
        issueTitle={issue.title}
      />
    </div>
  );
};
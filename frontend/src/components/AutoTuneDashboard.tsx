import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/CustomAuthContext';

interface AutoTuneProposal {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
  recommendations: any[];
  metrics: Record<string, number>;
  governance_links: string[];
  window_start: string;
  window_end: string;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  created_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  dry_run: boolean;
  creator?: { email: string };
  reviewer?: { email: string };
}

interface AutoTuneMetrics {
  feedback: {
    total: number;
    by_category: Record<string, number>;
    avg_rating: number;
    tag_frequency: Record<string, number>;
  };
  refinements: {
    total: number;
    by_category: Record<string, number>;
    governance_tag_frequency: Record<string, number>;
    by_profile: Record<string, number>;
  };
}

interface ImportRecord {
  id: string;
  filename: string;
  source: string;
  status: string;
  conversations_count: number;
  messages_count: number;
  feedback_count: number;
  refinements_count: number;
  created_at: string;
  uploader?: { email: string };
}

export const AutoTuneDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<AutoTuneProposal[]>([]);
  const [metrics, setMetrics] = useState<AutoTuneMetrics | null>(null);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<AutoTuneProposal | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set());
  const [importContent, setImportContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisWindow, setAnalysisWindow] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // Last 30 days instead of 7
    to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]  // Include tomorrow to catch any timezone issues
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchProposals(),
          fetchMetrics(),
          fetchImports()
        ]);
        setLoading(false);
      } catch (error) {
        console.error('AutoTune Dashboard initialization error:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchProposals = async () => {
    try {
      if (!user || !user.email) {
        console.log('No authenticated user');
        return;
      }
      
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/autotune/proposals`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'x-user-email': user.email,
          'x-user-id': user.id || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Fetched proposals:', result.data);
        setProposals(result.data || []);
      } else {
        const error = await response.json();
        console.error('Failed to fetch proposals:', error);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const fetchImports = async () => {
    try {
      if (!user || !user.email) return;
      
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/autotune/imports`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'x-user-email': user.email,
          'x-user-id': user.id || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        setImports(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching imports:', error);
    }
  };

  const handleImport = async () => {
    if (!importContent.trim()) {
      alert('Please paste or upload content to import');
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/autotune/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'x-user-email': user?.email || '',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          content: importContent,
          filename: `import_${new Date().toISOString().split('T')[0]}.txt`,
          useAI: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Import successful! Processed ${result.stats.messages} messages with ${result.stats.feedback} feedback items. Running analysis...`);
        setImportContent('');
        fetchImports();
        fetchMetrics();
        // Automatically run analysis after successful import
        setTimeout(() => {
          runAutoTuneAnalysis();
        }, 1000);
      } else {
        const error = await response.json();
        if (response.status === 409 && error.existingImport) {
          // Duplicate detected - show detailed message
          alert(`Duplicate Import Detected!\n\n${error.message}\n\nThe same content won't be imported twice to avoid skewing the analysis.`);
        } else {
          alert(`Import failed: ${error.error || error.message}`);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import content');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportContent(content);
    };
    reader.readAsText(file);
  };

  const fetchMetrics = async () => {
    try {
      if (!user || !user.email) {
        console.log('No authenticated user');
        return;
      }
      
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/feedback?action=aggregate&from=${analysisWindow.from}&to=${analysisWindow.to}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'x-user-email': user.email,
          'x-user-id': user.id || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const runAutoTuneAnalysis = async () => {
    setIsRunningAnalysis(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/autotune/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'x-user-email': user?.email || '',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          window: analysisWindow,
          dryRun: false
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        if (result.debug) {
          console.log('Analysis debug info:', result.debug);
        }
        if (result.proposals && result.proposals.length === 0) {
          const debugInfo = result.debug ? 
            `\n\nDebug: Window ${result.debug.window.from} to ${result.debug.window.to}\nFound ${result.debug.feedbackCount} feedback, ${result.debug.refinementCount} refinements` : '';
          alert('Analysis complete but no issues found requiring tuning.' + debugInfo);
        } else if (result.proposal) {
          alert(`Analysis complete! Generated proposal with ${result.proposal.recommendations?.length || 0} recommendations.`);
        } else {
          alert(result.message || 'Analysis complete!');
        }
        fetchProposals();
      } else {
        console.error('Analysis failed:', result);
        alert(`Analysis failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const handleProposalAction = async (proposalId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/autotune/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
          'x-user-email': user?.email || '',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ 
          status,
          apply: status === 'accepted' // Apply changes when accepting
        })
      });

      if (response.ok) {
        fetchProposals();
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'applied':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="grid grid-cols-2 gap-6">
        {/* Feedback Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Feedback Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Feedback:</span>
              <span className="text-sm font-medium">{metrics.feedback.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Rating:</span>
              <span className="text-sm font-medium">{metrics.feedback.avg_rating.toFixed(1)}/5</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-2">Top Issues:</span>
              {Object.entries(metrics.feedback.tag_frequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([tag, count]) => (
                  <div key={tag} className="flex justify-between text-xs">
                    <span className="text-gray-500">{tag}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Refinement Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Refinement Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Refinements:</span>
              <span className="text-sm font-medium">{metrics.refinements.total}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-2">By Category:</span>
              {Object.entries(metrics.refinements.by_category).map(([category, count]) => (
                <div key={category} className="flex justify-between text-xs">
                  <span className="text-gray-500">{category}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-2">Governance Tags:</span>
              {Object.entries(metrics.refinements.governance_tag_frequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([tag, count]) => (
                  <div key={tag} className="flex justify-between text-xs">
                    <span className="text-gray-500">{tag}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Auto-Tune Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Admin Dashboard"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Auto-Tune Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={analysisWindow.from}
              onChange={e => setAnalysisWindow(prev => ({ ...prev, from: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={analysisWindow.to}
              onChange={e => setAnalysisWindow(prev => ({ ...prev, to: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <button
            onClick={runAutoTuneAnalysis}
            disabled={isRunningAnalysis}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isRunningAnalysis ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Running Analysis...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      {renderMetrics()}

      {/* Proposals List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Auto-Tune Proposals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Window
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.map(proposal => (
                <tr key={proposal.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(proposal.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(proposal.status)}
                      <span className="ml-2 text-sm capitalize">{proposal.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proposal.profile_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proposal.recommendations?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(proposal.window_start).toLocaleDateString()} -
                    {new Date(proposal.window_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedProposal(proposal);
                        // Initialize all recommendations as selected by default
                        setSelectedRecommendations(new Set(proposal.recommendations?.map((_, i) => i) || []));
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title={proposal.status === 'pending' ? 'Review and Apply Recommendations' : 'View Details'}
                    >
                      <EyeIcon className="h-5 w-5 inline mr-1" />
                      <span className="text-sm">Review</span>
                    </button>
                    {proposal.status === 'pending' && (
                      <button
                        onClick={() => handleProposalAction(proposal.id, 'rejected')}
                        className="text-red-600 hover:text-red-900"
                        title="Reject All Recommendations"
                      >
                        <XMarkIcon className="h-5 w-5 inline mr-1" />
                        <span className="text-sm">Reject</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {proposals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AdjustmentsHorizontalIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No auto-tune proposals found.</p>
              <p className="text-sm">Run an analysis to generate recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Import Data Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Chat Data</h3>
          <p className="text-sm text-gray-600 mb-4">
            Paste chat conversations from any source (XML, JSON, plain text) or upload a file. 
            Our AI will analyze and normalize the data to generate tuning recommendations.
          </p>
          
          {/* Text Area for Pasting */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Content
            </label>
            <textarea
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              placeholder="Paste your chat export here (any format: XML, JSON, plain text, etc.)..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* File Upload */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <DocumentArrowUpIcon className="h-6 w-6 text-gray-400 inline mr-2" />
              Upload a File
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,.json,.txt,.csv,.log,.html"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center space-x-2 font-medium"
              >
                <DocumentArrowUpIcon className="h-5 w-5" />
                <span>Choose File to Upload</span>
              </button>
              <span className="text-sm text-gray-500">
                Supported: XML, JSON, TXT, CSV, LOG, HTML
              </span>
              {importContent && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Content loaded ({importContent.length} characters)
                </span>
              )}
            </div>
          </div>

          {/* Import Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setImportContent('')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !importContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4" />
                  <span>Import & Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Import History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imported
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imports.map((imp) => (
                  <tr key={imp.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {imp.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {imp.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        imp.status === 'completed' ? 'bg-green-100 text-green-800' :
                        imp.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        imp.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {imp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        {imp.conversations_count} conversations<br/>
                        {imp.messages_count} messages<br/>
                        {imp.feedback_count} feedback
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(imp.created_at).toLocaleDateString()}
                      <br/>
                      <span className="text-xs">{imp.uploader?.email}</span>
                    </td>
                  </tr>
                ))}
                {imports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No imports yet. Paste or upload chat data above to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold">Proposal Details</h3>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Proposal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedProposal.status)}
                    <span className="capitalize">{selectedProposal.status}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProposal.profile_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Analysis Window</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedProposal.window_start).toLocaleDateString()} - {new Date(selectedProposal.window_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProposal.creator?.email || 'System'}</p>
                </div>
              </div>

              {/* Metrics */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-4 gap-4">
                  {Object.entries(selectedProposal.metrics || {}).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-xs text-gray-500">{key}</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                <div className="space-y-3">
                  {selectedProposal.recommendations?.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      selectedRecommendations.has(index) 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedRecommendations.has(index)}
                            onChange={() => {
                              const newSelected = new Set(selectedRecommendations);
                              if (newSelected.has(index)) {
                                newSelected.delete(index);
                              } else {
                                newSelected.add(index);
                              }
                              setSelectedRecommendations(newSelected);
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="font-medium text-gray-900">{rec.setting}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                          rec.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(rec.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      
                      {/* Before/After Comparison */}
                      {rec.setting === 'instructions' ? (
                        // Special handling for instructions - show full text in scrollable area
                        <div className="space-y-3 mb-3">
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <div className="text-xs font-medium text-gray-500 mb-2">Current Instructions</div>
                            <div className="text-sm text-gray-900 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {rec.from || '<not set>'}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="text-xs font-medium text-blue-600 mb-2">Proposed Instructions (Changes Highlighted)</div>
                            <div className="text-sm text-blue-900 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {rec.to}
                            </div>
                            {rec.action === 'append' && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                <div className="text-xs font-medium text-green-700 mb-1">New Addition:</div>
                                <div className="text-sm text-green-900 font-mono whitespace-pre-wrap">
                                  {rec.to.replace(rec.from || '', '').trim()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Regular display for other settings
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <div className="text-xs font-medium text-gray-500 mb-1">Current Value</div>
                            <div className="text-sm text-gray-900 font-mono break-all">
                              {rec.from !== undefined ? String(rec.from) : '<not set>'}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="text-xs font-medium text-blue-600 mb-1">Proposed Value</div>
                            <div className="text-sm text-blue-900 font-mono break-all">
                              {String(rec.to)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Action: {rec.action}</span>
                        <p className="text-gray-600 mt-1">{rec.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Governance Links */}
              {selectedProposal.governance_links?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Governance Links</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProposal.governance_links.map((link, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        {link}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons for Selected Recommendations */}
              {selectedProposal.status === 'pending' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedRecommendations.size} of {selectedProposal.recommendations?.length || 0} recommendations selected
                      </p>
                    </div>
                    <div className="space-x-3">
                      <button
                        onClick={() => handleProposalAction(selectedProposal.id, 'rejected')}
                        className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                      >
                        Reject Proposal
                      </button>
                      <button
                        onClick={async () => {
                          if (selectedRecommendations.size === 0) {
                            alert('Please select at least one recommendation to apply');
                            return;
                          }
                          // Create a filtered proposal with only selected recommendations
                          const selectedRecs = selectedProposal.recommendations?.filter((_, i) => 
                            selectedRecommendations.has(i)
                          );
                          
                          // Call the API with the filtered recommendations
                          try {
                            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/autotune/proposals/${selectedProposal.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                                'Content-Type': 'application/json',
                                'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!,
                                'x-user-email': user?.email || '',
                                'x-user-id': user?.id || ''
                              },
                              body: JSON.stringify({ 
                                status: 'accepted', 
                                apply: true,
                                selectedRecommendations: Array.from(selectedRecommendations)
                              })
                            });
                            
                            if (response.ok) {
                              alert(`Applied ${selectedRecommendations.size} recommendations successfully!`);
                              setSelectedProposal(null);
                              fetchProposals();
                            }
                          } catch (error) {
                            console.error('Error applying recommendations:', error);
                            alert('Failed to apply recommendations');
                          }
                        }}
                        disabled={selectedRecommendations.size === 0}
                        className={`px-6 py-2 text-sm text-white rounded-md ${
                          selectedRecommendations.size === 0 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Apply Selected ({selectedRecommendations.size})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
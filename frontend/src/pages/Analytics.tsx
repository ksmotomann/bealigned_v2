import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { 
  ChartBarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  conversationStats: {
    total: number;
    completed: number;
    averageDuration: number;
    thisWeek: number;
    lastWeek: number;
    averageMessagesPerConversation: number;
    completionRate: number;
  };
  userEngagement: {
    activeUsers: number;
    totalUsers: number;
    averageConversationsPerUser: number;
    mostActiveDay: string;
    mostActiveHour: number;
    userRetention30Days: number;
  };
  aiAssistant: {
    totalQueries: number;
    uniqueUsers: number;
    averageResponseTime: number;
    popularTopics: { topic: string; count: number }[];
    satisfactionRate: number;
  };
  issues: {
    total: number;
    open: number;
    resolved: number;
    byType: Record<string, number>;
    averageResolutionTime: number;
    criticalIssues: number;
  };
  growth: {
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    conversationsThisMonth: number;
    conversationsLastMonth: number;
    userGrowthRate: number;
    conversationGrowthRate: number;
  };
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    message: string;
    metric: string;
  }[];
}

export const Analytics: React.FC = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    loadAnalytics();
  }, [isAdmin, isSuperAdmin, navigate, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data from Edge Function
      const token = await getAuthToken();
      const response = await fetch(`https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    const { supabase } = await import('../services/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const getMockAnalytics = (): AnalyticsData => ({
    conversationStats: {
      total: 342,
      completed: 287,
      averageDuration: 18.5,
      thisWeek: 42,
      lastWeek: 38,
      averageMessagesPerConversation: 12.3,
      completionRate: 83.9
    },
    userEngagement: {
      activeUsers: 89,
      totalUsers: 156,
      averageConversationsPerUser: 2.2,
      mostActiveDay: 'Wednesday',
      mostActiveHour: 19,
      userRetention30Days: 72.5
    },
    aiAssistant: {
      totalQueries: 523,
      uniqueUsers: 67,
      averageResponseTime: 1250,
      popularTopics: [
        { topic: 'Progress Review', count: 89 },
        { topic: 'Pattern Analysis', count: 67 },
        { topic: 'Goal Setting', count: 54 },
        { topic: 'Resource Recommendations', count: 43 }
      ],
      satisfactionRate: 91.2
    },
    issues: {
      total: 48,
      open: 12,
      resolved: 31,
      byType: {
        bug: 8,
        feature: 15,
        improvement: 18,
        question: 7
      },
      averageResolutionTime: 2.3,
      criticalIssues: 2
    },
    growth: {
      newUsersThisMonth: 23,
      newUsersLastMonth: 19,
      conversationsThisMonth: 142,
      conversationsLastMonth: 118,
      userGrowthRate: 21.1,
      conversationGrowthRate: 20.3
    },
    insights: [
      {
        type: 'positive',
        message: 'User engagement is up 15% this week',
        metric: 'engagement'
      },
      {
        type: 'positive',
        message: 'AI Assistant satisfaction rate above 90%',
        metric: 'ai'
      },
      {
        type: 'negative',
        message: '2 critical issues need attention',
        metric: 'issues'
      },
      {
        type: 'neutral',
        message: 'Peak usage time is 7-9 PM on weekdays',
        metric: 'usage'
      }
    ]
  });

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, trend: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
    };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <ExclamationCircleIcon className="h-4 w-4" />;
      case 'feature': return <LightBulbIcon className="h-4 w-4" />;
      case 'improvement': return <WrenchScrewdriverIcon className="h-4 w-4" />;
      case 'question': return <QuestionMarkCircleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Unable to Load Analytics</h2>
            <p className="text-gray-600 mb-4">There was a problem loading the analytics data.</p>
            <p className="text-sm text-gray-500 mb-6">Please ensure you have admin privileges and try again.</p>
            <button 
              onClick={loadAnalytics} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  const conversationChange = (analytics?.conversationStats) ? formatPercentageChange(
    analytics?.conversationStats?.thisWeek || 0,
    analytics?.conversationStats?.lastWeek || 0
  ) : { value: 0, trend: 'neutral' as const };

  const userGrowthChange = (analytics?.growth) ? formatPercentageChange(
    analytics?.growth?.newUsersThisMonth || 0,
    analytics?.growth?.newUsersLastMonth || 0
  ) : { value: 0, trend: 'neutral' as const };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(adminModeEnabled ? '/admin' : '/home')}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label={adminModeEnabled ? "Back to Admin Dashboard" : "Back to Home"}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                </div>
              </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={refreshAnalytics}
                disabled={refreshing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">
                {analytics?.userEngagement?.activeUsers || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(((analytics?.userEngagement?.activeUsers || 0) / (analytics?.userEngagement?.totalUsers || 1)) * 100)}% of total
            </p>
          </div>

          {/* Conversations */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">
                {analytics?.conversationStats?.thisWeek || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Conversations This Week</p>
            <div className="flex items-center mt-1">
              {conversationChange.trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : conversationChange.trend === 'down' ? (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              ) : null}
              <span className={`text-xs ${
                conversationChange.trend === 'up' ? 'text-green-600' : 
                conversationChange.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {conversationChange.value.toFixed(1)}% from last week
              </span>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircleIcon className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">
                {(analytics?.conversationStats?.completionRate || 0).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics?.conversationStats?.completed || 0} of {analytics?.conversationStats?.total || 0} completed
            </p>
          </div>

          {/* AI Assistant */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <SparklesIcon className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">
                {analytics?.aiAssistant?.totalQueries || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">AI Queries</p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics?.aiAssistant?.uniqueUsers || 0} unique users
            </p>
          </div>
        </div>

        {/* Insights */}
        {(analytics?.insights?.length || 0) > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Key Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(analytics?.insights || []).map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                    insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className={`text-sm ${
                    insight.type === 'positive' ? 'text-green-800' :
                    insight.type === 'negative' ? 'text-red-800' :
                    'text-gray-800'
                  }`}>
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Engagement */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">30-Day Retention</span>
                <span className="text-sm font-medium text-gray-900">
                  {(analytics?.userEngagement?.userRetention30Days || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Conversations/User</span>
                <span className="text-sm font-medium text-gray-900">
                  {(analytics?.userEngagement?.averageConversationsPerUser || 0).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Most Active Day</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.userEngagement?.mostActiveDay || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Hour</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.userEngagement?.mostActiveHour || 0}:00
                </span>
              </div>
            </div>
          </div>

          {/* Conversation Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Duration</span>
                <span className="text-sm font-medium text-gray-900">
                  {(analytics?.conversationStats?.averageDuration || 0).toFixed(1)} min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Messages/Conversation</span>
                <span className="text-sm font-medium text-gray-900">
                  {(analytics?.conversationStats?.averageMessagesPerConversation || 0).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Conversations</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.conversationStats?.total || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Sessions</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.conversationStats?.completed || 0}
                </span>
              </div>
            </div>
          </div>

          {/* AI Assistant Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Assistant Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Satisfaction Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {(analytics?.aiAssistant?.satisfactionRate || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {((analytics?.aiAssistant?.averageResponseTime || 0) / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Popular Topics</p>
                {(analytics?.aiAssistant?.popularTopics || []).map((topic, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600">{topic.topic}</span>
                    <span className="text-xs font-medium text-gray-900">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issues Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Issues & Feedback</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Open Issues</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.issues?.open || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolved Issues</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.issues?.resolved || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Issues</span>
                <span className="text-sm font-medium text-red-600">
                  {analytics?.issues?.criticalIssues || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Resolution Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {(analytics?.issues?.averageResolutionTime || 0).toFixed(1)} days
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">By Type</p>
                {Object.entries(analytics?.issues?.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center py-1">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(type)}
                      <span className="text-xs text-gray-600 capitalize">{type}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">New Users This Month</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.growth?.newUsersThisMonth || 0}</p>
              <div className="flex items-center mt-1">
                {userGrowthChange.trend === 'up' ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : userGrowthChange.trend === 'down' ? (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : null}
                <span className={`text-xs ${
                  userGrowthChange.trend === 'up' ? 'text-green-600' : 
                  userGrowthChange.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {userGrowthChange.value.toFixed(1)}% from last month
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversations This Month</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.growth?.conversationsThisMonth || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{(analytics?.growth?.conversationGrowthRate || 0).toFixed(1)}% growth
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">User Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(analytics?.growth?.userGrowthRate || 0).toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Month over month</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.userEngagement?.totalUsers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
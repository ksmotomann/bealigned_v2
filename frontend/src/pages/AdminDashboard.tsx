import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/CustomAuthContext';
import { Navigation } from '../components/Navigation';
import {
  ChartBarIcon,
  UsersIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  BeakerIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface AdminCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  requiresSuperAdmin?: boolean;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userType, isSuperAdmin } = useAuth();

  const adminCards: AdminCard[] = [
    {
      title: 'Analytics',
      description: 'View user engagement metrics, conversation stats, and system performance',
      icon: ChartBarIcon,
      path: '/analytics',
      color: 'bg-blue-500'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: UsersIcon,
      path: '/user-management',
      color: 'bg-green-500',
      requiresSuperAdmin: true
    },
    {
      title: 'Assistant Settings',
      description: 'Configure AI assistant behavior and response settings',
      icon: AdjustmentsHorizontalIcon,
      path: '/assistant-settings',
      color: 'bg-purple-500'
    },
    {
      title: 'Admin Tuner',
      description: 'Advanced AI behavior controls for conversation flow, probing, tone, and safety',
      icon: Cog6ToothIcon,
      path: '/admin-tuner',
      color: 'bg-orange-500',
      requiresSuperAdmin: true
    },
    {
      title: 'Auto-Tune Dashboard',
      description: 'AI feedback analysis and automated tuning recommendations',
      icon: CpuChipIcon,
      path: '/auto-tune',
      color: 'bg-cyan-500'
    },
    {
      title: 'Debug Exports & Chat History',
      description: 'Review debug exports and conversation history for analysis and tuning',
      icon: BeakerIcon,
      path: '/debug-exports',
      color: 'bg-purple-600'
    },
    {
      title: 'AI Assistant Logs',
      description: 'Review AI interaction history and performance metrics',
      icon: DocumentTextIcon,
      path: '/ai-logs',
      color: 'bg-indigo-500'
    },
    {
      title: 'Manage Feedback & Issues',
      description: 'View and respond to user feedback and reported issues',
      icon: ExclamationTriangleIcon,
      path: '/feedback',
      color: 'bg-red-500'
    }
  ];

  // Filter cards based on permissions
  const visibleCards = adminCards.filter(card => {
    if (card.requiresSuperAdmin && !isSuperAdmin) return false;
    return true;
  });


  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <ShieldCheckIcon className="h-8 w-8 text-yellow-500 mr-3" />
                    Admin Dashboard
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    {userType === 'super_admin' && 'Super Admin Access - Full system control'}
                    {userType === 'admin' && 'Admin Access - Manage users and content'}
                    {userType === 'expert' && 'Expert Access - View analytics and logs'}
                    {userType === 'user' && `Current user type: ${userType}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {userType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.path}
                  onClick={() => navigate(card.path)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {card.description}
                  </p>
                  {card.requiresSuperAdmin && (
                    <span className="mt-3 inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                      Super Admin Only
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/analytics')}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm text-gray-600">View Today's</p>
                  <p className="text-lg font-semibold text-gray-900">Analytics</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/admin')}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-lg font-semibold text-gray-900">Issues</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/ai-logs')}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm text-gray-600">Recent</p>
                  <p className="text-lg font-semibold text-gray-900">AI Logs</p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-indigo-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
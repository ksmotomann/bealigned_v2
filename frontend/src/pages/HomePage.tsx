import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { Navigation } from '../components/Navigation';
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CogIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PersonalizedWelcome } from '../components/PersonalizedWelcome';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const [showWelcome, setShowWelcome] = useState(true);

  // Regular user apps
  const regularApps = [
    {
      id: 'beh2o-chat',
      name: 'BeH2O Chat',
      description: 'AI-powered chat assistant for your wellness journey',
      icon: ChatBubbleLeftRightIcon,
      path: '/beh2o-chat',
      color: 'bg-blue-500',
      available: true,
      comingSoon: false
    },
    {
      id: 'community',
      name: 'Community',
      description: 'Connect with others on similar journeys',
      icon: UserGroupIcon,
      path: '/community',
      color: 'bg-green-500',
      available: false,
      comingSoon: true
    },
    {
      id: 'feedback',
      name: 'Feedback & Issues',
      description: 'Submit feature requests, report bugs, and track progress',
      icon: ExclamationTriangleIcon,
      path: '/feedback',
      color: 'bg-orange-500',
      available: true,
      comingSoon: false
    }
  ];
  
  // Admin apps - only shown when admin mode is enabled
  const adminApps = [
    {
      id: 'admin',
      name: 'Admin Dashboard',
      description: 'Manage users, conversations, and system settings',
      icon: CogIcon,
      path: '/admin',
      color: 'bg-red-500',
      available: true,
      comingSoon: false
    },
    {
      id: 'analytics',
      name: 'View Analytics',
      description: 'View user engagement metrics and system performance',
      icon: ChartBarIcon,
      path: '/analytics',
      color: 'bg-purple-500',
      available: true,
      comingSoon: false
    }
  ];
  
  // Debug the values immediately
  console.log('HomePage render - Values:', {
    isAdmin,
    adminModeEnabled,
    shouldShowAdmin: isAdmin && adminModeEnabled
  });
  
  // Combine apps based on admin mode
  const apps = isAdmin && adminModeEnabled 
    ? [...regularApps, ...adminApps]
    : regularApps;
    
  // Debug logging
  useEffect(() => {
    console.log('HomePage - Admin mode check:', {
      isAdmin,
      adminModeEnabled,
      showingAdminApps: isAdmin && adminModeEnabled,
      totalApps: apps.length,
      appIds: apps.map(a => a.id)
    });
  }, [isAdmin, adminModeEnabled, apps]);


  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Personalized Welcome */}
        {showWelcome && (
          <PersonalizedWelcome onDismiss={() => setShowWelcome(false)} />
        )}
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Apps</h2>
          <p className="text-gray-600 mt-2">Select an app to get started</p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`relative bg-white rounded-lg shadow-md overflow-hidden ${
                app.available ? 'hover:shadow-lg cursor-pointer' : 'opacity-75'
              } transition-all duration-200 ${
                adminApps.some(a => a.id === app.id) ? 'border-2 border-red-200' : ''
              }`}
              onClick={() => app.available && navigate(app.path)}
            >
              {app.comingSoon && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}
              <div className="p-6">
                <div className={`${app.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <app.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {app.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {app.description}
                </p>
                {app.available && (
                  <div className="flex items-center text-indigo-600 font-medium text-sm">
                    Open App
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Sessions</p>
              <p className="text-lg font-medium text-gray-900">1</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="text-lg font-medium text-gray-900">
                {isAdmin && adminModeEnabled ? 'Administrator' : 'Standard User'}
              </p>
            </div>
          </div>
        </div>
        </main>
      </div>
    </>
  );
};
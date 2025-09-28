import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresSuperAdmin?: boolean;
}

export const Navigation: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, isExpert, userType, signOut } = useAuth();
  const { adminModeEnabled, toggleAdminMode } = useAdminModeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('Navigation Debug:', {
      user: user?.email,
      userType,
      isAdmin,
      isSuperAdmin,
      isExpert,
      adminModeEnabled
    });
  }, [user, userType, isAdmin, isSuperAdmin, isExpert, adminModeEnabled]);

  // Define navigation items (only main navigation items)
  const navItems: NavItem[] = [
    { name: 'Home', path: '/home', icon: HomeIcon, requiresAuth: true },
    { name: 'BeH2O Chat', path: '/beh2o-chat', icon: ChatBubbleLeftRightIcon, requiresAuth: true },
  ];

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (!user && item.requiresAuth) return false;
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresSuperAdmin && !isSuperAdmin) return false;
    return true;
  });

  // User menu items - dynamically build based on user type
  const userMenuItems = [
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: CogIcon },
    { name: 'Feedback', path: '/feedback', icon: ExclamationTriangleIcon },
  ];
  
  // Admin menu items - only show Admin Dashboard when admin mode is enabled
  const adminMenuItems = [];
  
  // Admin Dashboard for admin/expert/super admin users when admin mode is on
  if ((isAdmin || isExpert || isSuperAdmin) && adminModeEnabled) {
    adminMenuItems.push({ name: 'Admin Dashboard', path: '/admin', icon: ShieldCheckIcon });
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Don't show navigation on landing page or auth page
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={() => navigate(user ? '/home' : '/')}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <HeartIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">BeAligned™</span>
                  <span className="text-xs text-gray-500 ml-1">Beta Lite</span>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Items */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-1.5" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side - User menu and mobile menu button */}
          <div className="flex items-center space-x-3">
            {/* User Menu (Desktop) */}
            {user && (
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm text-gray-700">
                    {user?.firstName || user.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                      {(isAdmin || isSuperAdmin || isExpert) && (
                        <>
                          <span className="inline-flex items-center mt-2 px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Expert'}
                          </span>
                          
                          {/* Admin Mode Toggle */}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-600">Admin Mode</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAdminMode();
                                // Navigate away from admin pages when disabling admin mode
                                if (adminModeEnabled) {
                                  const adminPaths = ['/admin', '/analytics', '/user-management', '/assistant-settings', '/admin-tuner', '/ai-logs', '/admin-issues'];
                                  if (adminPaths.includes(location.pathname)) {
                                    navigate('/home');
                                  }
                                }
                              }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                adminModeEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  adminModeEnabled ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Menu Items */}
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <Icon className="h-4 w-4 mr-3 text-gray-400" />
                          {item.name}
                        </button>
                      );
                    })}
                    
                    {/* Admin Menu Items */}
                    {adminMenuItems.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        {adminMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigate(item.path);
                                setUserMenuOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <Icon className="h-4 w-4 mr-3 text-yellow-500" />
                              {item.name}
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Sign Out */}
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sign In button for non-authenticated users */}
            {!user && (
              <button
                onClick={() => navigate('/auth')}
                className="hidden md:block px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Mobile User Section */}
          {user ? (
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {(isAdmin || isSuperAdmin || isExpert) && (
                    <span className="inline-flex items-center mt-1 px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Expert'}
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Menu Items */}
              <div className="space-y-1">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <Icon className="h-4 w-4 mr-3 text-gray-400" />
                      {item.name}
                    </button>
                  );
                })}
                
                {/* Mobile Admin Menu Items */}
                {adminMenuItems.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    {adminMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        >
                          <Icon className="h-4 w-4 mr-3 text-yellow-500" />
                          {item.name}
                        </button>
                      );
                    })}
                  </>
                )}
                
                {/* Mobile Admin Mode Toggle for admins */}
                {(isAdmin || isSuperAdmin || isExpert) && (
                  <div className="px-3 py-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Admin Mode</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAdminMode();
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          adminModeEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            adminModeEnabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 px-4 py-3">
              <button
                onClick={() => {
                  navigate('/auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

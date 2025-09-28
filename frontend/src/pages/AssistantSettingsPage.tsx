import React from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { useNavigate } from 'react-router-dom';
import { AssistantSettingsManager } from '../components/AssistantSettings';
import { Navigation } from '../components/Navigation';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export const AssistantSettingsPage: React.FC = () => {
  const { user, signOut, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <Navigation />
      <div className="flex h-screen bg-gray-50">

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <AssistantSettingsManager />
        </div>
      </div>
    </>
  );
};
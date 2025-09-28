import React, { useState } from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { Navigation } from '../components/Navigation';
import { InviteManager } from '../components/InviteManager';
import {
  BellIcon,
  EnvelopeIcon,
  MoonIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface SettingSection {
  title: string;
  description: string;
  icon: React.ElementType;
  settings: Setting[];
}

interface Setting {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'select' | 'text';
  value?: boolean | string;
  options?: { value: string; label: string }[];
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    chatReminders: false,
    weeklyDigest: true,
    newFeatures: true
  });

  const [appearance, setAppearance] = useState({
    theme: 'light',
    fontSize: 'medium',
    compactMode: false
  });

  const [privacy, setPrivacy] = useState({
    shareAnalytics: true,
    showOnlineStatus: true,
    allowExport: true
  });

  const settingSections: SettingSection[] = [
    {
      title: 'Notifications',
      description: 'Manage how you receive updates and reminders',
      icon: BellIcon,
      settings: [
        {
          id: 'emailNotifications',
          label: 'Email Notifications',
          description: 'Receive important updates via email',
          type: 'toggle',
          value: notifications.emailNotifications
        },
        {
          id: 'chatReminders',
          label: 'Chat Reminders',
          description: 'Get reminded to complete unfinished conversations',
          type: 'toggle',
          value: notifications.chatReminders
        },
        {
          id: 'weeklyDigest',
          label: 'Weekly Progress Digest',
          description: 'Receive a weekly summary of your progress',
          type: 'toggle',
          value: notifications.weeklyDigest
        },
        {
          id: 'newFeatures',
          label: 'New Feature Announcements',
          description: 'Be notified when new features are released',
          type: 'toggle',
          value: notifications.newFeatures
        }
      ]
    },
    {
      title: 'Appearance',
      description: 'Customize how BeAligned looks for you',
      icon: MoonIcon,
      settings: [
        {
          id: 'theme',
          label: 'Theme',
          description: 'Choose your preferred color scheme',
          type: 'select',
          value: appearance.theme,
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'System Default' }
          ]
        },
        {
          id: 'fontSize',
          label: 'Font Size',
          description: 'Adjust text size for better readability',
          type: 'select',
          value: appearance.fontSize,
          options: [
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' }
          ]
        },
        {
          id: 'compactMode',
          label: 'Compact Mode',
          description: 'Reduce spacing for more content on screen',
          type: 'toggle',
          value: appearance.compactMode
        }
      ]
    },
    {
      title: 'Privacy & Security',
      description: 'Control your data and privacy settings',
      icon: ShieldCheckIcon,
      settings: [
        {
          id: 'shareAnalytics',
          label: 'Share Usage Analytics',
          description: 'Help us improve by sharing anonymous usage data',
          type: 'toggle',
          value: privacy.shareAnalytics
        },
        {
          id: 'showOnlineStatus',
          label: 'Show Online Status',
          description: 'Let others see when you are online',
          type: 'toggle',
          value: privacy.showOnlineStatus
        },
        {
          id: 'allowExport',
          label: 'Allow Data Export',
          description: 'Enable exporting your conversations and data',
          type: 'toggle',
          value: privacy.allowExport
        }
      ]
    }
  ];

  const handleToggle = (sectionId: string, settingId: string) => {
    // TODO: Implement setting updates
    console.log(`Toggling ${sectionId}.${settingId}`);
  };

  const handleSelect = (sectionId: string, settingId: string, value: string) => {
    // TODO: Implement setting updates
    console.log(`Setting ${sectionId}.${settingId} to ${value}`);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">Manage your account preferences and settings</p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {settingSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <Icon className="h-6 w-6 text-gray-400 mr-3" />
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
                        <p className="text-sm text-gray-500">{section.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      {section.settings.map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between py-3">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-900">
                              {setting.label}
                            </label>
                            {setting.description && (
                              <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                            )}
                          </div>

                          <div className="ml-4">
                            {setting.type === 'toggle' && (
                              <button
                                onClick={() => handleToggle(section.title.toLowerCase(), setting.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  setting.value ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    setting.value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}

                            {setting.type === 'select' && (
                              <select
                                value={setting.value as string}
                                onChange={(e) => handleSelect(section.title.toLowerCase(), setting.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {setting.options?.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Invite Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <UserPlusIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Invite Users</h2>
                    <p className="text-sm text-gray-500">Send invitations to new users</p>
                  </div>
                </div>
              </div>
              <InviteManager />
            </div>

            {/* Additional Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <KeyIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Account Actions</h2>
                    <p className="text-sm text-gray-500">Manage your account and data</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Download My Data
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Clear All Conversations
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
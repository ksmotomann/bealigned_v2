import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/CustomAuthContext';
import { Navigation } from '../components/Navigation';
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  ShieldCheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  useEffect(() => {
    // Update form data when user changes (e.g., after successful update)
    if (user) {
      setFormData({
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile(formData.first_name, formData.last_name);
      setEditing(false);
      // Show success message (optional)
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user values
    setFormData({
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    setEditing(false);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <div className="flex items-center space-x-2">
                  {editing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 py-6">
              {/* Avatar Section */}
              <div className="flex items-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="ml-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-gray-500">{user?.email}</p>
                  {isAdmin && (
                    <span className="inline-flex items-center mt-2 px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      {isSuperAdmin ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Fields */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="inline h-4 w-4 mr-1" />
                      First Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg">{user?.firstName || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="inline h-4 w-4 mr-1" />
                      Last Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg">{user?.lastName || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <EnvelopeIcon className="inline h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-500">
                    {user?.email}
                    <span className="text-xs ml-2">(Cannot be changed)</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  {editing ? (
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="America/Phoenix">Arizona Time</option>
                      <option value="America/Anchorage">Alaska Time</option>
                      <option value="Pacific/Honolulu">Hawaii Time</option>
                    </select>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.timezone}</p>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">User ID</span>
                    <span className="font-mono text-xs">{user?.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Account Created</span>
                    <span>{user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Last Sign In</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Cancel button when editing */}
              {editing && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
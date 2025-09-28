import React from 'react';
import { useAuth } from '../contexts/CustomAuthContext';

export const DebugAuth: React.FC = () => {
  const { user, loading, isAdmin, isSuperAdmin, isExpert, userRole, userType } = useAuth();

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Loading auth...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 border rounded-lg m-4">
      <h3 className="font-bold text-lg mb-2">Debug Auth State</h3>
      <div className="space-y-1 text-sm">
        <div><strong>User:</strong> {user?.email || 'Not logged in'}</div>
        <div><strong>First Name:</strong> {user?.firstName || 'Not set'}</div>
        <div><strong>Last Name:</strong> {user?.lastName || 'Not set'}</div>
        <div><strong>User Type:</strong> {user?.userType || 'Not set'}</div>
        <div><strong>User Role:</strong> {userRole}</div>
        <div><strong>User Type (legacy):</strong> {userType}</div>
        <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
        <div><strong>Is Super Admin:</strong> {isSuperAdmin ? 'Yes' : 'No'}</div>
        <div><strong>Is Expert:</strong> {isExpert ? 'Yes' : 'No'}</div>
        <div><strong>Is Active:</strong> {user?.isActive !== false ? 'Yes' : 'No'}</div>
      </div>
      
      <div className="mt-4 p-2 bg-blue-100 rounded">
        <h4 className="font-semibold">Admin Menu Should Show:</h4>
        <div className="text-sm">
          <div>• Admin Dashboard: {isAdmin || isExpert ? 'Yes' : 'No'}</div>
          <div>• AI Logs: {isAdmin ? 'Yes' : 'No'}</div>
          <div>• Analytics: {isAdmin ? 'Yes' : 'No'}</div>
          <div>• User Management: {isSuperAdmin ? 'Yes' : 'No'}</div>
          <div>• Assistant Settings: {isSuperAdmin ? 'Yes' : 'No'}</div>
          <div>• Admin Tuner: {isSuperAdmin ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-green-100 rounded">
        <h4 className="font-semibold">Instructions:</h4>
        <div className="text-sm">
          <div>1. Look for your profile picture/avatar in the top right</div>
          <div>2. Click on it to open the dropdown menu</div>
          <div>3. Admin options should appear below the regular menu items</div>
          <div>4. They will have yellow icons to distinguish them</div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Navigation } from '../components/Navigation';
import { AutoTuneDashboard } from '../components/AutoTuneDashboard';

export const AutoTunePage: React.FC = () => {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <AutoTuneDashboard />
      </div>
    </>
  );
};
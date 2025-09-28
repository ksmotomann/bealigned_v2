import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SignOutPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 7 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 7000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Thank You for Using BeAligned!
          </h1>
          
          <p className="text-gray-600 mb-2">
            Your journey towards alignment matters, and we're honored to be part of it.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            You have been successfully signed out.
          </p>

          {/* Redirect Notice */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              You'll be returned to our main site momentarily...
            </p>
            <div className="mt-2">
              <div className="w-full bg-blue-100 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-7000 ease-linear"
                  style={{ 
                    width: '100%',
                    animation: 'progress 7s linear'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Manual Redirect Link */}
          <p className="text-sm text-gray-600">
            If you're not redirected automatically,{' '}
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-700 font-medium underline"
            >
              click here
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
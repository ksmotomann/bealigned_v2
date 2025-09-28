import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/CustomAuthContext';
import { AdminModeProvider } from './contexts/AdminModeContext';
import { Auth } from './components/Auth';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { HomePage } from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { IssuesManager } from './components/IssuesManager';
import { AIAssistantLogs } from './components/AIAssistantLogs';
import { FloatingAI } from './components/FloatingAI';
import { Analytics } from './pages/Analytics';
import { UserManagement } from './pages/UserManagement';
import { AssistantSettingsPage } from './pages/AssistantSettingsPage';
import { AdminTuner } from './pages/AdminTuner';
import { DebugExportsViewer } from './pages/DebugExportsViewer';
import { AutoTunePage } from './pages/AutoTunePage';
import { SignOutPage } from './pages/SignOutPage';
// Temporarily commented out for deployment
// import { NewChat } from './pages/NewChat';
// import { GPTTrainer } from './pages/GPTTrainer';
// import { ChatKnowledge } from './pages/ChatKnowledge';
// import { GPTConfiguration } from './pages/GPTConfiguration';
// import { EditChat } from './pages/EditChat';
// import { GPTChat } from './components/GPTChat';
import './index.css';

function LoginRedirect() {
  useEffect(() => {
    // Redirect to the React Native Web app
    window.location.href = window.location.origin + '/app';
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '24px',
          color: '#5BA4CF',
          marginBottom: '16px'
        }}>
          Redirecting to BeAligned App...
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #5BA4CF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requireAdmin = false, requireSuperAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean; requireSuperAdmin?: boolean }) {
  const { user, loading, isAdmin, isSuperAdmin, isExpert } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/beh2o-chat" replace />;
  }

  if (requireAdmin && !isAdmin && !isExpert) {
    return <Navigate to="/beh2o-chat" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <Auth />} />
        <Route path="/signed-out" element={<SignOutPage />} />

        {/* Login route now handled by Vercel proxy to React Native Web app */}
        
        {/* Protected routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/beh2o-chat"
          element={<LoginRedirect />}
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/feedback" 
          element={
            <ProtectedRoute>
              <IssuesManager />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-logs" 
          element={
            <ProtectedRoute requireAdmin>
              <AIAssistantLogs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute requireAdmin>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user-management" 
          element={
            <ProtectedRoute requireSuperAdmin>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/assistant-settings" 
          element={
            <ProtectedRoute requireSuperAdmin>
              <AssistantSettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-tuner" 
          element={
            <ProtectedRoute requireSuperAdmin>
              <AdminTuner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/debug-exports" 
          element={
            <ProtectedRoute requireAdmin>
              <DebugExportsViewer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/auto-tune" 
          element={
            <ProtectedRoute requireAdmin>
              <AutoTunePage />
            </ProtectedRoute>
          } 
        />
        {/* Temporarily commented out for deployment - missing components
        <Route
          path="/new-chat"
          element={
            <ProtectedRoute>
              <NewChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gpt-trainer"
          element={
            <ProtectedRoute>
              <GPTTrainer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-knowledge"
          element={
            <ProtectedRoute>
              <ChatKnowledge />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gpt-config"
          element={
            <ProtectedRoute>
              <GPTConfiguration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-chat"
          element={
            <ProtectedRoute>
              <EditChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <GPTChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <GPTChat />
            </ProtectedRoute>
          }
        />
        */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Placeholder routes for landing page links */}
        <Route path="/about" element={<LandingPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/demo" element={<LandingPage />} />
        <Route path="/features" element={<LandingPage />} />
        <Route path="/pricing" element={<LandingPage />} />
        <Route path="/help" element={<LandingPage />} />
        <Route path="/contact" element={<LandingPage />} />
        <Route path="/privacy" element={<LandingPage />} />
        <Route path="/terms" element={<LandingPage />} />
        <Route path="/disclaimer" element={<LandingPage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Show FloatingAI for authenticated users */}
      {user && <FloatingAI />}
    </>
  );
}

function App() {
  useEffect(() => {
    // Global error handler to suppress browser extension errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('listener indicated an asynchronous response') ||
          event.reason?.message?.includes('message channel closed')) {
        // Suppress browser extension communication errors
        event.preventDefault();
        console.warn('Browser extension error suppressed:', event.reason);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Also suppress console errors from extensions
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.toString?.().includes('listener indicated an asynchronous response') ||
          args[0]?.toString?.().includes('message channel closed')) {
        console.warn('Browser extension error suppressed:', ...args);
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalError;
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AdminModeProvider>
          <AppContent />
        </AdminModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

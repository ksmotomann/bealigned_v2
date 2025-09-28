import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, Session } from '../services/authService';
import { UserRole, FEATURE_FLAGS } from '../types/roles';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: User | null; // Using User interface for backward compatibility
  loading: boolean;
  // New role system
  userRole: UserRole;
  hasPermission: (resource: string, action: string) => boolean;
  hasFeatureAccess: (feature: keyof typeof FEATURE_FLAGS) => boolean;
  // Backward compatibility properties
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isExpert: boolean;
  userType: 'user' | 'expert' | 'admin' | 'super_admin';
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [session, setSession] = useState<Session | null>(authService.getSession());
  const [profile, setProfile] = useState<User | null>(authService.getUser()); // profile is just user for backward compatibility
  const [loading, setLoading] = useState(authService.isLoading());
  const [userRole, setUserRole] = useState<UserRole>(authService.getUserRole());

  useEffect(() => {
    // Set initial state from auth service
    setUser(authService.getUser());
    setSession(authService.getSession());
    setProfile(authService.getUser());
    setLoading(authService.isLoading());
    setUserRole(authService.getUserRole());

    // Listen for auth state changes
    const handleSignedIn = () => {
      setUser(authService.getUser());
      setSession(authService.getSession());
      setProfile(authService.getUser());
      setUserRole(authService.getUserRole());
      setLoading(false);
    };

    const handleSignedOut = () => {
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(UserRole.USER);
      setLoading(false);
    };

    const handleUserUpdated = () => {
      setUser(authService.getUser());
      setProfile(authService.getUser());
      setUserRole(authService.getUserRole());
    };

    const handleTokenRefreshed = () => {
      setSession(authService.getSession());
    };

    const handleSessionExpired = () => {
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(UserRole.USER);
      setLoading(false);
    };

    // Add event listeners
    authService.addEventListener('signed_in', handleSignedIn);
    authService.addEventListener('signed_out', handleSignedOut);
    authService.addEventListener('user_updated', handleUserUpdated);
    authService.addEventListener('token_refreshed', handleTokenRefreshed);
    authService.addEventListener('session_expired', handleSessionExpired);

    // Cleanup function
    return () => {
      authService.removeEventListener('signed_in', handleSignedIn);
      authService.removeEventListener('signed_out', handleSignedOut);
      authService.removeEventListener('user_updated', handleUserUpdated);
      authService.removeEventListener('token_refreshed', handleTokenRefreshed);
      authService.removeEventListener('session_expired', handleSessionExpired);
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await authService.signUp(email, password, firstName, lastName);
    if (error) throw new Error(error);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    if (error) throw new Error(error);
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email);
    if (error) throw new Error(error);
  };

  // Helper functions for permission checking
  const hasPermissionHelper = (resource: string, action: string) => {
    return authService.hasPermission(resource, action);
  };

  const hasFeatureAccessHelper = (feature: keyof typeof FEATURE_FLAGS) => {
    return authService.hasFeatureAccess(feature);
  };

  // Backward compatibility properties - calculate inside render for reactivity
  const isAdmin = user ? authService.isAdmin() : false;
  const isSuperAdmin = user ? authService.isSuperAdmin() : false;
  const isExpert = user ? authService.isExpert() : false;
  const userType = user ? authService.getUserType() : 'user';

  // Debug logging for troubleshooting
  useEffect(() => {
    if (user) {
      console.log('AuthContext Debug:', {
        userEmail: user.email,
        userType: user.userType,
        userTypeFromService: authService.getUserType(),
        userRole,
        isAdmin,
        isSuperAdmin,
        isExpert
      });
    }
  }, [user, userRole, isAdmin, isSuperAdmin, isExpert]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      // New role system
      userRole,
      hasPermission: hasPermissionHelper,
      hasFeatureAccess: hasFeatureAccessHelper,
      // Backward compatibility
      isAdmin,
      isSuperAdmin,
      isExpert,
      userType,
      signUp,
      signIn,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

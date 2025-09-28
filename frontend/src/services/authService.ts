/**
 * Centralized Authentication Service
 * 
 * Provides a singleton service for managing authentication, session state,
 * role-based permissions, and automatic token refresh. Can be used with either
 * Supabase Auth or custom authentication system.
 */

import { Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { customAuth, User as CustomUser, Session as CustomSession } from './customAuth';
import { UserRole, hasPermission, hasFeatureAccess, FEATURE_FLAGS } from '../types/roles';

// Unified User interface
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  userType: UserRole;
  isActive: boolean;
  emailVerified?: boolean;
}

// Unified Session interface
export interface Session {
  user: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  accessToken?: string; // For Supabase compatibility
}

// Profile interface for database operations
export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: UserRole;
  is_active?: boolean;
}

// Authentication response interface
export interface AuthResponse {
  user?: User;
  session?: Session;
  error?: string;
}

// Auth state change event types
export type AuthEvent = 'signed_in' | 'signed_out' | 'token_refreshed' | 'user_updated' | 'session_expired';

// Event listener type
export type AuthEventListener = (event: AuthEvent, data?: any) => void;

// Authentication mode - can switch between Supabase and custom auth
export type AuthMode = 'supabase' | 'custom';

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  private loadingState = true;
  private authMode: AuthMode = 'custom'; // Default to custom auth (migrated from Supabase)
  private eventListeners: Map<AuthEvent, AuthEventListener[]> = new Map();
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize the authentication service
   */
  private async initialize(): Promise<void> {
    try {
      if (this.authMode === 'supabase') {
        await this.initializeSupabaseAuth();
      } else {
        await this.initializeCustomAuth();
      }
      
      this.setupSessionMonitoring();
      this.loadingState = false;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      this.loadingState = false;
    }
  }

  /**
   * Initialize Supabase authentication
   */
  private async initializeSupabaseAuth(): Promise<void> {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.handleSupabaseSession(session);
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth event:', event, session?.user?.email);
      
      if (session?.user) {
        await this.handleSupabaseSession(session);
        this.emitEvent('signed_in', { user: this.currentUser });
      } else {
        this.clearSession();
        this.emitEvent('signed_out');
      }
    });
  }

  /**
   * Handle Supabase session and fetch user profile
   */
  private async handleSupabaseSession(session: SupabaseSession): Promise<void> {
    try {
      const profile = await this.fetchUserProfile(session.user.id);
      
      this.currentUser = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: profile?.first_name || session.user.user_metadata?.first_name,
        lastName: profile?.last_name || session.user.user_metadata?.last_name,
        fullName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : session.user.user_metadata?.full_name,
        userType: profile?.user_type || UserRole.USER,
        isActive: profile?.is_active ?? true,
        emailVerified: session.user.email_confirmed_at ? true : false
      };

      this.currentSession = {
        user: this.currentUser,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
      };

      this.scheduleTokenRefresh();
    } catch (error) {
      console.error('Error handling Supabase session:', error);
    }
  }

  /**
   * Initialize custom authentication
   */
  private async initializeCustomAuth(): Promise<void> {
    const session = customAuth.getSession();
    if (session) {
      // Verify and refresh if needed
      const { session: refreshedSession } = await customAuth.refreshSession();
      if (refreshedSession) {
        this.currentUser = this.mapCustomUser(refreshedSession.user);
        this.currentSession = this.mapCustomSession(refreshedSession);
        
        // Debug logging
        console.log('AuthService initializeCustomAuth - User loaded:', {
          email: this.currentUser.email,
          userType: this.currentUser.userType,
          isAdmin: this.isAdmin(),
          isSuperAdmin: this.isSuperAdmin(),
          isExpert: this.isExpert()
        });
        
        this.scheduleTokenRefresh();
      }
    }
  }

  /**
   * Fetch user profile from database
   */
  private async fetchUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, user_type, is_active')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }

  /**
   * Switch authentication mode
   */
  public setAuthMode(mode: AuthMode): void {
    if (this.authMode !== mode) {
      this.authMode = mode;
      this.clearSession();
      this.initialize();
    }
  }

  /**
   * Get current authentication mode
   */
  public getAuthMode(): AuthMode {
    return this.authMode;
  }

  /**
   * Sign up a new user
   */
  public async signUp(email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
    try {
      if (this.authMode === 'supabase') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`
            }
          }
        });
        
        if (error) throw error;
        
        return { error: undefined };
      } else {
        const result = await customAuth.signUp(email, password, firstName, lastName);
        if (!result.error && result.user) {
          return {
            user: this.mapCustomUser(result.user),
            error: undefined
          };
        }
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message || 'Sign up failed' };
    }
  }

  /**
   * Sign in an existing user
   */
  public async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      if (this.authMode === 'supabase') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;
        
        // Session will be handled by the auth state change listener
        return { error: undefined };
      } else {
        const result = await customAuth.signIn(email, password);
        
        if (!result.error && result.user && result.session) {
          this.currentUser = this.mapCustomUser(result.user);
          this.currentSession = this.mapCustomSession(result.session);
          
          // Debug logging
          console.log('AuthService signIn - User mapped:', {
            email: this.currentUser.email,
            userType: this.currentUser.userType,
            isAdmin: this.isAdmin(),
            isSuperAdmin: this.isSuperAdmin(),
            isExpert: this.isExpert()
          });
          
          this.scheduleTokenRefresh();
          this.emitEvent('signed_in', { user: this.currentUser });
          return {
            user: this.currentUser,
            session: this.currentSession,
            error: undefined
          };
        }
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message || 'Sign in failed' };
    }
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    try {
      if (this.authMode === 'supabase') {
        await supabase.auth.signOut();
      } else {
        await customAuth.signOut();
      }
      
      this.clearSession();
      this.emitEvent('signed_out');
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear session anyway on error
      this.clearSession();
      this.emitEvent('signed_out');
    }
  }

  /**
   * Reset password for a user
   */
  public async resetPassword(email: string): Promise<AuthResponse> {
    try {
      if (this.authMode === 'supabase') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        return { error: undefined };
      } else {
        const result = await customAuth.resetPassword(email);
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message || 'Password reset failed' };
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(firstName: string, lastName: string): Promise<AuthResponse> {
    try {
      if (!this.currentUser) {
        throw new Error('Not authenticated');
      }

      if (this.authMode === 'supabase') {
        // Update in Supabase profiles table
        const { error: profileError } = await supabase
          .from('users')
          .update({
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.currentUser.id);

        if (profileError) throw profileError;

        // Update user metadata in Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          }
        });

        if (authError) throw authError;

        // Update local user object
        this.currentUser = {
          ...this.currentUser,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`
        };

        this.emitEvent('user_updated', { user: this.currentUser });
        return { user: this.currentUser, error: undefined };
      } else {
        const result = await customAuth.updateProfile(firstName, lastName);
        if (!result.error && result.user) {
          this.currentUser = this.mapCustomUser(result.user);
          this.emitEvent('user_updated', { user: this.currentUser });
          return { user: this.currentUser, error: undefined };
        }
        return { error: result.error };
      }
    } catch (error: any) {
      return { error: error.message || 'Profile update failed' };
    }
  }

  /**
   * Refresh the current session
   */
  public async refreshSession(): Promise<AuthResponse> {
    try {
      if (this.authMode === 'supabase') {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) throw error;
        
        if (data.session) {
          await this.handleSupabaseSession(data.session);
          this.emitEvent('token_refreshed', { session: this.currentSession });
        }
        
        return { 
          user: this.currentUser || undefined, 
          session: this.currentSession || undefined, 
          error: undefined 
        };
      } else {
        const result = await customAuth.refreshSession();
        if (!result.error && result.session) {
          this.currentUser = this.mapCustomUser(result.session.user);
          this.currentSession = this.mapCustomSession(result.session);
          this.scheduleTokenRefresh();
          this.emitEvent('token_refreshed', { session: this.currentSession });
          return { 
            user: this.currentUser || undefined, 
            session: this.currentSession || undefined, 
            error: undefined 
          };
        }
        return { error: result.error };
      }
    } catch (error: any) {
      this.handleSessionExpiration();
      return { error: error.message || 'Session refresh failed' };
    }
  }

  /**
   * Get current user
   */
  public getUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  public getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  /**
   * Check if authentication is loading
   */
  public isLoading(): boolean {
    return this.loadingState;
  }

  /**
   * Get user role
   */
  public getUserRole(): UserRole {
    return this.currentUser?.userType || UserRole.USER;
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(resource: string, action: string): boolean {
    return hasPermission(this.getUserRole(), resource, action);
  }

  /**
   * Check if user has feature access
   */
  public hasFeatureAccess(feature: keyof typeof FEATURE_FLAGS): boolean {
    return hasFeatureAccess(this.getUserRole(), feature);
  }

  /**
   * Backward compatibility - check if user is admin
   */
  public isAdmin(): boolean {
    const role = this.getUserRole();
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  /**
   * Backward compatibility - check if user is super admin
   */
  public isSuperAdmin(): boolean {
    return this.getUserRole() === UserRole.SUPER_ADMIN;
  }

  /**
   * Backward compatibility - check if user is expert
   */
  public isExpert(): boolean {
    const role = this.getUserRole();
    return role === UserRole.EXPERT || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  /**
   * Get user type as string for backward compatibility
   */
  public getUserType(): 'user' | 'expert' | 'admin' | 'super_admin' {
    return this.getUserRole() as 'user' | 'expert' | 'admin' | 'super_admin';
  }

  /**
   * Add event listener
   */
  public addEventListener(event: AuthEvent, listener: AuthEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: AuthEvent, listener: AuthEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Remove all event listeners for an event
   */
  public removeAllListeners(event?: AuthEvent): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: AuthEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, data);
        } catch (error) {
          console.error('Error in auth event listener:', error);
        }
      });
    }
  }

  /**
   * Clear current session
   */
  private clearSession(): void {
    this.currentUser = null;
    this.currentSession = null;
    this.clearTimers();
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpiration(): void {
    console.warn('Session expired');
    this.clearSession();
    this.emitEvent('session_expired');
  }

  /**
   * Setup session monitoring
   */
  private setupSessionMonitoring(): void {
    // Check session every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      if (this.currentSession?.expiresAt) {
        const now = new Date();
        const expiresAt = this.currentSession.expiresAt;
        
        // If session expires in the next 10 minutes, refresh it
        if (expiresAt.getTime() - now.getTime() < 10 * 60 * 1000) {
          this.refreshSession().catch(error => {
            console.error('Automatic session refresh failed:', error);
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Schedule token refresh before expiration
   */
  private scheduleTokenRefresh(): void {
    this.clearTokenRefreshTimer();
    
    if (this.currentSession?.expiresAt) {
      const now = new Date();
      const expiresAt = this.currentSession.expiresAt;
      const refreshTime = expiresAt.getTime() - now.getTime() - (5 * 60 * 1000); // 5 minutes before expiry
      
      if (refreshTime > 0) {
        this.tokenRefreshTimer = setTimeout(() => {
          this.refreshSession().catch(error => {
            console.error('Scheduled token refresh failed:', error);
          });
        }, refreshTime);
      }
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    this.clearTokenRefreshTimer();
  }

  /**
   * Clear token refresh timer
   */
  private clearTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Map custom user to unified user interface
   */
  private mapCustomUser(customUser: CustomUser): User {
    return {
      id: customUser.id,
      email: customUser.email,
      firstName: customUser.firstName,
      lastName: customUser.lastName,
      fullName: customUser.firstName && customUser.lastName 
        ? `${customUser.firstName} ${customUser.lastName}` 
        : undefined,
      userType: customUser.userType as UserRole,
      isActive: customUser.isActive,
      emailVerified: customUser.emailVerified
    };
  }

  /**
   * Map custom session to unified session interface
   */
  private mapCustomSession(customSession: CustomSession): Session {
    return {
      user: this.mapCustomUser(customSession.user),
      token: customSession.token,
      refreshToken: customSession.refreshToken,
      expiresAt: customSession.expiresAt
    };
  }

  /**
   * Cleanup resources when service is destroyed
   */
  public destroy(): void {
    this.clearTimers();
    this.eventListeners.clear();
    this.currentUser = null;
    this.currentSession = null;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export the class for testing purposes
export { AuthService };
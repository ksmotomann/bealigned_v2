/**
 * Custom Authentication Service
 * Replaces Supabase Auth with our own portable authentication system
 */

import { supabase } from './supabase';

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'user' | 'expert' | 'admin' | 'super_admin';
  isActive: boolean;
  emailVerified: boolean;
}

export interface Session {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthResponse {
  user?: User;
  session?: Session;
  error?: string;
}

class CustomAuthService {
  private currentSession: Session | null = null;
  private tokenKey = 'bealigned_auth_token';
  private refreshTokenKey = 'bealigned_refresh_token';

  constructor() {
    this.loadSession();
  }

  /**
   * Sign up a new user
   */
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<AuthResponse> {
    try {
      // Hash password on client side using SHA256
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          user_type: 'user',
          is_active: true,
          email_verification_token: this.generateToken(),
          email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        })
        .select()
        .single();

      if (error) throw error;

      // Send verification email (via Edge Function)
      await this.sendVerificationEmail(user.email, user.email_verification_token);

      return {
        user: this.mapUser(user),
        error: undefined
      };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to sign up'
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Get user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !user) {
        throw new Error('Invalid email or password');
      }

      // Verify password (using SHA256)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (inputHash !== user.password_hash) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Create session
      const session = await this.createSession(user);

      // Update last sign in
      await supabase
        .from('users')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', user.id);

      // Log audit event
      await this.logAuthEvent(user.id, 'login');

      return {
        user: this.mapUser(user),
        session,
        error: undefined
      };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to sign in'
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    if (this.currentSession) {
      // Delete session from database
      await supabase
        .from('app_sessions')
        .delete()
        .eq('token_hash', this.hashToken(this.currentSession.token));

      // Log audit event
      await this.logAuthEvent(this.currentSession.user.id, 'logout');
    }

    // Clear local storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.currentSession = null;
  }

  /**
   * Reset password request
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const resetToken = this.generateToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      const { data: user, error } = await supabase
        .from('users')
        .update({
          password_reset_token: resetToken,
          password_reset_expires: resetExpires.toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;

      // Send reset email (via Edge Function)
      await this.sendPasswordResetEmail(email, resetToken);

      return {
        error: undefined
      };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to reset password'
      };
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      // Find user with valid token
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('password_reset_token', token)
        .gt('password_reset_expires', new Date().toISOString())
        .single();

      if (userError || !user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password using SHA256
      const encoder = new TextEncoder();
      const data = encoder.encode(newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Update password and clear reset token
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log audit event
      await this.logAuthEvent(user.id, 'password_reset');

      return {
        error: undefined
      };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to reset password'
      };
    }
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.currentSession?.user || null;
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return { error: 'No refresh token' };
    }

    try {
      // Get session from database
      const { data: session, error } = await supabase
        .from('app_sessions')
        .select('*, user:users(*)')
        .eq('refresh_token_hash', this.hashToken(refreshToken))
        .gt('refresh_expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        throw new Error('Invalid refresh token');
      }
      
      // Debug logging
      console.log('CustomAuth refreshSession - User from DB:', {
        email: session.user.email,
        user_type: session.user.user_type,
        is_active: session.user.is_active
      });

      // Create new session
      const newSession = await this.createSession(session.user);

      // Delete old session
      await supabase
        .from('app_sessions')
        .delete()
        .eq('id', session.id);

      return {
        user: this.mapUser(session.user),
        session: newSession,
        error: undefined
      };
    } catch (error: any) {
      this.signOut();
      return {
        error: error.message || 'Failed to refresh session'
      };
    }
  }

  /**
   * Admin function to reset a user's password
   */
  async adminResetUserPassword(userId: string, newPassword: string): Promise<AuthResponse> {
    try {
      // Check if current user is admin
      const currentUser = this.getUser();
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.userType)) {
        throw new Error('Unauthorized');
      }

      // Hash new password using SHA256
      const encoder = new TextEncoder();
      const data = encoder.encode(newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log audit event
      await this.logAuthEvent(userId, 'admin_password_reset', {
        admin_id: currentUser.id
      });

      return {
        error: undefined
      };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to reset user password'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(firstName: string, lastName: string): Promise<AuthResponse> {
    try {
      const currentUser = this.getUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Update user in database
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Update current session with new user data
      if (this.currentSession) {
        this.currentSession.user = this.mapUser(updatedUser);
      }

      // Log audit event
      await this.logAuthEvent(currentUser.id, 'profile_update');

      return {
        user: this.mapUser(updatedUser),
        error: undefined
      };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to update profile'
      };
    }
  }

  // Private helper methods

  private async createSession(user: any): Promise<Session> {
    const token = this.generateToken();
    const refreshToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in database
    await supabase
      .from('app_sessions')
      .insert({
        user_id: user.id,
        token_hash: this.hashToken(token),
        refresh_token_hash: this.hashToken(refreshToken),
        expires_at: expiresAt.toISOString(),
        refresh_expires_at: refreshExpiresAt.toISOString(),
        user_agent: navigator.userAgent
      });

    // Store tokens in localStorage
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);

    const session: Session = {
      user: this.mapUser(user),
      token,
      refreshToken,
      expiresAt
    };

    this.currentSession = session;
    return session;
  }

  private loadSession(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      // Verify token and load session
      this.verifyToken(token);
    }
  }

  private async verifyToken(token: string): Promise<boolean> {
    try {
      const { data: session, error } = await supabase
        .from('app_sessions')
        .select('*, user:users(*)')
        .eq('token_hash', this.hashToken(token))
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        this.signOut();
        return false;
      }

      this.currentSession = {
        user: this.mapUser(session.user),
        token,
        refreshToken: localStorage.getItem(this.refreshTokenKey) || '',
        expiresAt: new Date(session.expires_at)
      };

      return true;
    } catch {
      this.signOut();
      return false;
    }
  }

  private mapUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      userType: dbUser.user_type,
      isActive: dbUser.is_active,
      emailVerified: dbUser.email_verified
    };
  }

  private generateToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private hashToken(token: string): string {
    // Simple hash for demonstration - in production use proper hashing
    return btoa(token);
  }

  private async logAuthEvent(userId: string, eventType: string, eventData: any = {}): Promise<void> {
    await supabase
      .from('app_auth_audit')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        user_agent: navigator.userAgent
      });
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Call Edge Function to send email
    await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: email,
        subject: 'Verify your BeAligned account',
        html: `
          <p>Welcome to BeAligned!</p>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${window.location.origin}/verify-email?token=${token}">Verify Email</a>
        `
      })
    });
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Call Edge Function to send email
    await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: email,
        subject: 'Reset your BeAligned password',
        html: `
          <p>You requested a password reset for your BeAligned account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${window.location.origin}/reset-password?token=${token}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
        `
      })
    });
  }
}

// Export singleton instance
export const customAuth = new CustomAuthService();
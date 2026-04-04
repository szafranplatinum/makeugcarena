'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { apiClient } from '@/lib/api-client';

export interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider component that manages authentication state and user profile
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);

        // Fetch current user session
        const userData = await apiClient.get<{ user: any } | null>('/api/auth/me').catch(() => null);

        if (userData && (userData as any).user) {
          setUser((userData as any).user);

          // Fetch user profile
          const profileData = await apiClient.get<UserProfile>('/api/auth/profile').catch(() => null);
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signOut = async () => {
    try {
      await apiClient.post('/api/auth/signout');
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
      // Still clear local state even if request fails
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await apiClient.get<UserProfile>('/api/auth/profile');
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

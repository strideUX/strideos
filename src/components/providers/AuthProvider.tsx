'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';


interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'pm' | 'task_owner' | 'client';
  clientId?: string;
  departmentIds?: string[];
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  createOrUpdateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  // Get current user from Convex
  const user = useQuery(api.auth.getCurrentUser);

  useEffect(() => {
    // Set loading to false once we have user data or know there's no user
    setIsLoading(false);
  }, [user]);

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading,
    isAuthenticated: !!user,
    createOrUpdateUser: async () => {
      // This will be handled by the auth system
      console.log('User creation/update handled by auth system');
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
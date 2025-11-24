'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
}

interface ProfileUpdateData {
  fullName?: string;
  email?: string;
}

// Hook for authentication
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => 
      authApi.login(credentials.email, credentials.password),
    onSuccess: () => {
      // Invalidate queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Redirect to dashboard
      router.push('/dashboard');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => 
      authApi.register(credentials.email, credentials.password, credentials.fullName),
    onSuccess: () => {
      // Invalidate queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Redirect to dashboard
      router.push('/dashboard');
    },
  });

  // Logout function
  const logout = () => {
    // Clear JWT token from localStorage
    authApi.logout();
    // Clear all queries in the cache
    queryClient.clear();
    // Redirect to login page
    router.push('/login');
  };

  // Get user profile
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    retry: false, // Don't retry if it fails
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => authApi.updateProfile(data),
    onSuccess: () => {
      // Invalidate profile query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // isAuthenticated is true if profileQuery is successful
  const isAuthenticated = profileQuery.isSuccess;
  const isLoading = profileQuery.isLoading;
  const user = profileQuery.data;

  return {
    isAuthenticated,
    isLoading,
    user,
    login: loginMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    isRegisterLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
    updateProfile: updateProfileMutation.mutate,
    isUpdateProfileLoading: updateProfileMutation.isPending,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Get API URL
function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'finflowapp.ch' || hostname.endsWith('.finflowapp.ch')) {
      return 'https://api.finflowapp.ch';
    }
  }
  return 'http://localhost:8081';
}

// Create axios instance for admin API
const adminApi = axios.create({
  baseURL: getApiUrl(),
  withCredentials: false,
});

// Add auth interceptor
adminApi.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  defaultCurrency: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminUserDetails extends AdminUser {
  stats: {
    accounts: number;
    transactions: number;
    budgets: number;
    categories: number;
    tradingAgents: number;
  };
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    admins: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  data: {
    transactions: number;
    accounts: number;
    budgets: number;
    tradingAgents: number;
  };
}

export interface PaginatedUsers {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get admin stats
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      const response = await adminApi.get('/admin/stats');
      return response.data;
    },
  });
}

// Get all users with pagination
export function useAdminUsers(page: number = 1, limit: number = 20, search?: string) {
  return useQuery({
    queryKey: ['admin', 'users', page, limit, search],
    queryFn: async (): Promise<PaginatedUsers> => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.append('search', search);
      const response = await adminApi.get(`/admin/users?${params}`);
      return response.data;
    },
  });
}

// Get single user details
export function useAdminUserDetails(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: async (): Promise<{ user: AdminUser; stats: AdminUserDetails['stats'] }> => {
      const response = await adminApi.get(`/admin/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

// Create user
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      email: string; 
      password: string; 
      name?: string; 
      role?: 'user' | 'admin';
      defaultCurrency?: string;
    }) => {
      const response = await adminApi.post('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { 
      userId: string; 
      data: Partial<{
        email: string;
        name: string;
        role: 'user' | 'admin';
        isActive: boolean;
        defaultCurrency: string;
        password: string;
      }>;
    }) => {
      const response = await adminApi.put(`/admin/users/${userId}`, data);
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

// Delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// Toggle user active status
export function useToggleUserActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.post(`/admin/users/${userId}/toggle-active`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// Make user admin
export function useMakeAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.post(`/admin/users/${userId}/make-admin`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// Remove admin role
export function useRemoveAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.post(`/admin/users/${userId}/remove-admin`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

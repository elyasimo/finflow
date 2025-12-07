'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api';
import { Account, CreateAccountData, UpdateAccountData } from '@/lib/types';

// Hook for accounts
export function useAccounts() {
  const queryClient = useQueryClient();

  // Get all accounts
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  });

  // Helper to find account by ID from cached data
  const getAccountById = (id: string): Account | undefined => {
    return (accountsQuery.data as Account[] | undefined)?.find(acc => acc.id === id);
  };

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: (data: CreateAccountData) => accountsApi.create(data),
    onSuccess: () => {
      // Invalidate accounts query to refetch with new account
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountData }) => 
      accountsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific account query and all accounts query
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate specific account query and all accounts query
      queryClient.invalidateQueries({ queryKey: ['accounts', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  return {
    // Queries
    accounts: accountsQuery.data as Account[] | undefined,
    isLoading: accountsQuery.isLoading,
    error: accountsQuery.error,
    getAccountById,
    
    // Mutations
    createAccount: createAccountMutation.mutate,
    isCreating: createAccountMutation.isPending,
    createError: createAccountMutation.error,
    
    updateAccount: updateAccountMutation.mutate,
    isUpdating: updateAccountMutation.isPending,
    updateError: updateAccountMutation.error,
    
    deleteAccount: deleteAccountMutation.mutate,
    isDeleting: deleteAccountMutation.isPending,
    deleteError: deleteAccountMutation.error,
  };
}

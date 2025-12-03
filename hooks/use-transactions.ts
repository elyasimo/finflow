'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';
import { Transaction, CreateTransactionData, UpdateTransactionData } from '@/lib/types';

// Hook for transactions
export function useTransactions() {
  const queryClient = useQueryClient();

  // Get all transactions
  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
  });

  // Get transaction by ID
  const getTransaction = (id: string) => {
    return useQuery({
      queryKey: ['transactions', id],
      queryFn: () => transactionsApi.getById(id),
      enabled: !!id, // Only run if id is provided
    });
  };

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionData) => transactionsApi.create(data),
    onSuccess: () => {
      // Invalidate transactions query to refetch with new transaction
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Also invalidate accounts and budgets as they might be affected
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) => 
      transactionsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific transaction query and all transactions query
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Also invalidate accounts and budgets as they might be affected
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate specific transaction query and all transactions query
      queryClient.invalidateQueries({ queryKey: ['transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Also invalidate accounts and budgets as they might be affected
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  return {
    // Queries
    transactions: transactionsQuery.data as Transaction[] | undefined,
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    getTransaction,
    refetch: transactionsQuery.refetch,
    
    // Mutations - use mutateAsync for proper async/await handling
    createTransaction: createTransactionMutation.mutateAsync,
    isCreating: createTransactionMutation.isPending,
    createError: createTransactionMutation.error,
    
    updateTransaction: updateTransactionMutation.mutateAsync,
    isUpdating: updateTransactionMutation.isPending,
    updateError: updateTransactionMutation.error,
    
    deleteTransaction: deleteTransactionMutation.mutateAsync,
    isDeleting: deleteTransactionMutation.isPending,
    deleteError: deleteTransactionMutation.error,
  };
}

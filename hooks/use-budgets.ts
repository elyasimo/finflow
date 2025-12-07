'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '@/lib/api';
import { Budget, CreateBudgetData, UpdateBudgetData } from '@/lib/types';

interface BudgetUsage {
  budgetId: string;
  budgetName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
}

// Hook for budgets
export function useBudgets() {
  const queryClient = useQueryClient();

  // Get all budgets
  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetsApi.getAll,
  });

  // Helper to find budget by ID from cached data
  const getBudgetById = (id: string): Budget | undefined => {
    return (budgetsQuery.data as Budget[] | undefined)?.find(b => b.id === id);
  };

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: (data: CreateBudgetData) => budgetsApi.create(data),
    onSuccess: () => {
      // Invalidate budgets query to refetch with new budget
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetData }) => 
      budgetsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific budget query and all budgets query
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.id, 'usage'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate specific budget query and all budgets query
      queryClient.invalidateQueries({ queryKey: ['budgets', id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', id, 'usage'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  return {
    // Queries
    budgets: budgetsQuery.data as Budget[] | undefined,
    isLoading: budgetsQuery.isLoading,
    error: budgetsQuery.error,
    getBudgetById,
    
    // Mutations
    createBudget: createBudgetMutation.mutate,
    isCreating: createBudgetMutation.isPending,
    createError: createBudgetMutation.error,
    
    updateBudget: updateBudgetMutation.mutate,
    isUpdating: updateBudgetMutation.isPending,
    updateError: updateBudgetMutation.error,
    
    deleteBudget: deleteBudgetMutation.mutate,
    isDeleting: deleteBudgetMutation.isPending,
    deleteError: deleteBudgetMutation.error,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/lib/types';

export function useCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const createCategory = useMutation({
    mutationFn: (data: { name: string }) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
} 
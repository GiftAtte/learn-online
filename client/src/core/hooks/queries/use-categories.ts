import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import * as categoriesService from '@/core/services/categories.service';
import { invalidateLearningData } from './invalidate';
import { queryKeys } from './query-keys';

/** Loads every category. Cached for 5 minutes because categories rarely change. */
export const useGetAllCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => categoriesService.getAllCategories(signal),
  });

/** Creates a category, then refreshes every view that shows categories. Form errors (such as a duplicate name) are left for the form to show. */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string }) => categoriesService.createCategory(values),
    meta: { handlesOwnError: true },
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.category.created);
    },
  });
};

/** Renames a category. Call `mutate({ id, values })`. Form errors are left for the form to show. */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: { name: string } }) =>
      categoriesService.updateCategory(id, values),
    meta: { handlesOwnError: true },
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.category.updated);
    },
  });
};

/** Deletes a category. Call `mutate(id)`. Fails with the standard error toast while courses still use it. */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.deleteCategory(id),
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.category.deleted);
    },
  });
};

/**
 * Categories service: the API calls for course categories.
 * Plain async functions, no React. The hooks in `hooks/queries/use-categories.ts` wrap them.
 */
import { api } from '@/core/api/client';
import type { Category } from '@/core/types/category.types';

/**
 * Gets every category with its number of published courses.
 * GET /categories. Public.
 */
export const getAllCategories = async (signal?: AbortSignal) =>
  (await api.get<Category[]>('/categories', { signal })).data;

/**
 * Creates a category.
 * POST /categories. Administrators only.
 * @throws ApiError 409 when a category with that name already exists (names ignore case)
 */
export const createCategory = async (values: { name: string }) =>
  (await api.post<Category>('/categories', values)).data;

/**
 * Renames a category.
 * PATCH /categories/:id. Administrators only.
 * @param id the category to rename
 * @throws ApiError 404 when it does not exist, 409 when the new name is taken
 */
export const updateCategory = async (id: string, values: { name: string }) =>
  (await api.patch<Category>(`/categories/${id}`, values)).data;

/**
 * Deletes a category.
 * DELETE /categories/:id. Administrators only.
 * @param id the category to delete
 * @throws ApiError 409 while courses still use it
 */
export const deleteCategory = (id: string) => api.delete(`/categories/${id}`);

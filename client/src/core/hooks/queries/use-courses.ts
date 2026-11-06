import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import * as coursesService from '@/core/services/courses.service';
import type { CourseFilters, CourseInput } from '@/core/types/course.types';
import { invalidateLearningData } from './invalidate';
import { queryKeys } from './query-keys';

/** Loads one page of courses for the catalog or the admin table. The previous page stays visible while the next one loads. */
export const useGetAllCourses = (filters: CourseFilters) =>
  useQuery({
    queryKey: queryKeys.courses(filters),
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads
    queryFn: ({ signal }) => coursesService.getAllCourses(filters, signal),
  });

/** Loads one course with its lessons and the viewer’s progress. */
export const useGetCourseById = (courseId: string) =>
  useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: ({ signal }) => coursesService.getCourseById(courseId, signal),
  });

/** Creates a course, then refreshes the catalog and dashboards. Form errors are left for the form to show. */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseInput) => coursesService.createCourse(input),
    meta: { handlesOwnError: true },
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.course.created);
    },
  });
};

/** Updates a course. Call `mutate({ id, input })` with only the fields that changed. Form errors are left for the form to show. */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CourseInput> }) =>
      coursesService.updateCourse(id, input),
    meta: { handlesOwnError: true },
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.course.updated);
    },
  });
};

/** Publishes or unpublishes a course from a table row. Call `mutate({ id, published })`. Failures (for example a course with no lessons yet) show the standard error toast. */
export const usePublishCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      coursesService.updateCourse(id, { published }),
    onSuccess: async (course) => {
      await invalidateLearningData(queryClient);
      notify.success(course.published ? MESSAGES.course.published : MESSAGES.course.unpublished);
    },
  });
};

/** Deletes a course and everything under it. Call `mutate(id)`. */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesService.deleteCourse(id),
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.course.deleted);
    },
  });
};

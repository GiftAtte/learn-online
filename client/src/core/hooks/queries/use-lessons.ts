import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import * as lessonsService from '@/core/services/lessons.service';
import type { LessonInput } from '@/core/types/lesson.types';
import { invalidateLearningData } from './invalidate';
import { queryKeys } from './query-keys';

/** Loads one lesson with the learner’s saved position and the next and previous lessons. */
export const useGetLessonById = (lessonId: string) =>
  useQuery({
    queryKey: queryKeys.lesson(lessonId),
    queryFn: ({ signal }) => lessonsService.getLessonById(lessonId, signal),
  });

/** Adds a lesson to a course. Call `mutate({ courseId, input })`. Form errors are left for the form to show. */
export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: LessonInput }) =>
      lessonsService.createLesson(courseId, input),
    meta: { handlesOwnError: true },
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.lesson.created);
    },
  });
};

/** Updates a lesson’s details. Call `mutate({ id, input })`. Form errors are left for the form to show. */
export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LessonInput }) =>
      lessonsService.updateLesson(id, input),
    meta: { handlesOwnError: true },
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.lesson.updated);
    },
  });
};

/** Deletes a lesson. Call `mutate(id)`. */
export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonsService.deleteLesson(id),
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.lesson.deleted);
    },
  });
};

/** Saves a new lesson order for one course. Call `mutate(lessonIds)` with every lesson id in the new order. */
export const useReorderLessons = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonIds: string[]) => lessonsService.reorderLessons(courseId, lessonIds),
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.lesson.reordered, { id: 'lesson-reordered' });
    },
  });
};

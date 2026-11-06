import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import * as progressService from '@/core/services/progress.service';
import type { UpdateLessonProgressInput } from '@/core/types/progress.types';
import { invalidateLearningData } from './invalidate';

/**
 * Saves the playback position. Progress is saved often, so other views are only marked stale
 * (they refresh the next time they are opened) instead of refetching while the video plays.
 * Completion refreshes everything immediately and confirms with one toast.
 */
export const useUpdateLessonProgress = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLessonProgressInput) =>
      progressService.updateLessonProgress(lessonId, input),
    // Saving in the background must never interrupt the video with an error toast.
    meta: { handlesOwnError: true },
    onSuccess: async (progress, input) => {
      if (input.completed) {
        await invalidateLearningData(queryClient);
        notify.success(MESSAGES.lesson.completed, { id: `lesson-${lessonId}-done` });
      } else {
        await queryClient.invalidateQueries({ refetchType: 'none' });
      }
      return progress;
    },
  });
};

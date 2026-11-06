/**
 * Progress service: the API call that records how far a learner has watched a lesson.
 * Plain async function, no React. The hook in `hooks/queries/use-progress.ts` wraps it.
 */
import { api } from '@/core/api/client';
import type { LessonProgress, UpdateLessonProgressInput } from '@/core/types/progress.types';

/**
 * Saves the learner's position (and completion) for one lesson. Safe to call repeatedly: the server keeps one
 * record per learner and lesson, never moves a finished lesson back to unfinished, and clamps the position to the lesson length.
 * PUT /lessons/:id/progress. Enrolled learners only.
 * @param lessonId the lesson being watched
 * @throws ApiError 403 when not enrolled in the course
 */
export const updateLessonProgress = async (lessonId: string, input: UpdateLessonProgressInput) =>
  (await api.put<LessonProgress>(`/lessons/${lessonId}/progress`, input)).data;

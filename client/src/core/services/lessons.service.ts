/**
 * Lessons service: the API calls for the video lessons inside a course.
 * Plain async functions, no React. The hooks in `hooks/queries/use-lessons.ts` wrap them.
 */
import { api } from '@/core/api/client';
import type { Lesson, LessonDetail, LessonInput } from '@/core/types/lesson.types';

/** An empty thumbnail box means "no picture", which the API expects as null. */
const withThumbnail = (input: LessonInput) => ({
  ...input,
  thumbnailUrl: input.thumbnailUrl || null,
});

/**
 * Gets one lesson with the learner's saved position, the other lessons in the course and the next and previous lesson.
 * GET /lessons/:id. Enrolled learners and administrators only.
 * @throws ApiError 403 when not enrolled, 404 when it does not exist
 */
export const getLessonById = async (lessonId: string, signal?: AbortSignal) =>
  (await api.get<LessonDetail>(`/lessons/${lessonId}`, { signal })).data;

/**
 * Adds a lesson at the end of a course.
 * POST /courses/:courseId/lessons. Administrators only.
 * @param courseId the course to add the lesson to
 */
export const createLesson = async (courseId: string, input: LessonInput) =>
  (await api.post<Lesson>(`/courses/${courseId}/lessons`, withThumbnail(input))).data;

/**
 * Updates a lesson's details (not its order; use `reorderLessons` for that).
 * PATCH /lessons/:id. Administrators only.
 * @param id the lesson to update
 */
export const updateLesson = async (id: string, input: LessonInput) =>
  (await api.patch<Lesson>(`/lessons/${id}`, withThumbnail(input))).data;

/**
 * Deletes a lesson and every learner's progress on it.
 * DELETE /lessons/:id. Administrators only.
 * @param id the lesson to delete
 */
export const deleteLesson = (id: string) => api.delete(`/lessons/${id}`);

/**
 * Sets the order of a course's lessons.
 * PUT /courses/:courseId/lessons/reorder. Administrators only.
 * @param lessonIds every lesson id of the course, in the new order
 */
export const reorderLessons = (courseId: string, lessonIds: string[]) =>
  api.put(`/courses/${courseId}/lessons/reorder`, { lessonIds });

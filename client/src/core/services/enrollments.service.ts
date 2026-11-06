/**
 * Enrollments service: the API calls for joining and leaving courses.
 * Plain async functions, no React. The hooks in `hooks/queries/use-enrollments.ts` wrap them.
 */
import { api } from '@/core/api/client';
import type { CourseSummary } from '@/core/types/course.types';

/**
 * Gets the courses the signed-in learner is enrolled in, each with their progress.
 * GET /enrollments/me. Needs a token.
 */
export const getAllMyCourses = async (signal?: AbortSignal) =>
  (await api.get<CourseSummary[]>('/enrollments/me', { signal })).data;

/**
 * Enrolls the signed-in learner in a course. Safe to repeat: enrolling twice does nothing the second time.
 * POST /courses/:courseId/enroll. Needs a token.
 * @param courseId the course to join
 * @throws ApiError 404 when the course does not exist or is not published
 */
export const createEnrollment = (courseId: string) => api.post(`/courses/${courseId}/enroll`);

/**
 * Removes the signed-in learner from a course. Their saved progress is kept.
 * DELETE /courses/:courseId/enroll. Needs a token.
 * @param courseId the course to leave
 * @throws ApiError 404 when they were not enrolled
 */
export const deleteEnrollment = (courseId: string) => api.delete(`/courses/${courseId}/enroll`);

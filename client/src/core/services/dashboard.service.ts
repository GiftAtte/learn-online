/**
 * Dashboard service: the API calls for the summary screens, for learners and for administrators.
 * Plain async functions, no React. The hooks in `hooks/queries/use-dashboard.ts` wrap them.
 */
import { api } from '@/core/api/client';
import type { AdminDashboard, CourseActivity, LearnerDashboard } from '@/core/types/dashboard.types';
import type { AdminLearner, LearnerDetail, LearnerFilters } from '@/core/types/learner.types';

/**
 * Gets the signed-in learner's summary: courses enrolled, lessons completed, minutes watched,
 * the lesson to continue, per-course progress and recent activity.
 * GET /dashboard/learner. Needs a token.
 */
export const getLearnerDashboard = async (signal?: AbortSignal) =>
  (await api.get<LearnerDashboard>('/dashboard/learner', { signal })).data;

/**
 * Gets the platform summary: learner, course and enrollment totals, completion rate per course
 * and the most recent enrollments.
 * GET /dashboard/admin. Administrators only.
 */
export const getAdminDashboard = async (signal?: AbortSignal) =>
  (await api.get<AdminDashboard>('/dashboard/admin', { signal })).data;

/**
 * Gets one page of learners, each with their progress in every course they are enrolled in.
 * GET /dashboard/admin/learners. Administrators only.
 * @returns the learners plus paging details
 */
export const getAllLearners = async (filters: LearnerFilters, signal?: AbortSignal) => {
  const { data, meta } = await api.get<AdminLearner[]>('/dashboard/admin/learners', {
    query: { ...filters },
    signal,
  });
  return { items: data, meta: meta! };
};

/**
 * Gets one learner in full: every enrolled course with the status of each lesson.
 * GET /dashboard/admin/learners/:id. Administrators only.
 * @param learnerId the learner to look up
 * @throws ApiError 404 when there is no such user
 */
export const getLearnerById = async (learnerId: string, signal?: AbortSignal) =>
  (await api.get<LearnerDetail>(`/dashboard/admin/learners/${learnerId}`, { signal })).data;

/**
 * Gets one course's full activity: enrolled learners with their progress, and completions per lesson.
 * GET /dashboard/admin/courses/:id. Administrators only.
 * @throws ApiError 404 when there is no such course
 */
export const getCourseActivity = async (courseId: string, signal?: AbortSignal) =>
  (await api.get<CourseActivity>(`/dashboard/admin/courses/${courseId}`, { signal })).data;

/**
 * Courses service: the API calls for the course catalog and for managing courses.
 * Plain async functions, no React. The hooks in `hooks/queries/use-courses.ts` wrap them.
 */
import { api } from '@/core/api/client';
import type {
  CourseDetail,
  CourseFilters,
  CourseInput,
  CourseSummary,
} from '@/core/types/course.types';

/**
 * Gets one page of courses matching the filters.
 * GET /courses. Public; learners only ever see published courses.
 * @returns the courses plus paging details (page, total, totalPages)
 */
export const getAllCourses = async (filters: CourseFilters, signal?: AbortSignal) => {
  const { data, meta } = await api.get<CourseSummary[]>('/courses', {
    query: { ...filters },
    signal,
  });
  return { items: data, meta: meta! };
};

/**
 * Gets one course with its lessons. Video links are only included for enrolled learners and administrators.
 * GET /courses/:id. Public for published courses.
 * @throws ApiError 404 when it does not exist or is a draft the viewer may not see
 */
export const getCourseById = async (courseId: string, signal?: AbortSignal) =>
  (await api.get<CourseDetail>(`/courses/${courseId}`, { signal })).data;

/**
 * Creates a course.
 * POST /courses. Administrators only.
 * @throws ApiError 400 when the input is invalid
 */
export const createCourse = async (input: CourseInput) =>
  (await api.post<CourseSummary>('/courses', input)).data;

/**
 * Updates a course. Send only the fields that changed; this is also how a course is published or unpublished.
 * PATCH /courses/:id. Administrators only.
 * @param id the course to update
 * @throws ApiError 404 when it does not exist, 400 when it cannot be published yet (no lessons)
 */
export const updateCourse = async (id: string, input: Partial<CourseInput>) =>
  (await api.patch<CourseSummary>(`/courses/${id}`, input)).data;

/**
 * Deletes a course together with its lessons, enrollments and every learner's progress in it.
 * DELETE /courses/:id. Administrators only.
 * @param id the course to delete
 */
export const deleteCourse = (id: string) => api.delete(`/courses/${id}`);

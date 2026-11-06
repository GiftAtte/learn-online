/**
 * Every TanStack Query key in one place. Keys start with the resource name, so invalidating
 * `['courses']` refreshes every course list regardless of filters.
 */
export const queryKeys = {
  me: ['me'] as const,
  settings: ['settings'] as const,
  categories: ['categories'] as const,
  courses: (params?: object) => ['courses', 'list', params ?? {}] as const,
  coursesAll: ['courses'] as const,
  course: (id: string) => ['courses', 'detail', id] as const,
  lesson: (id: string) => ['lessons', id] as const,
  lessonsAll: ['lessons'] as const,
  myCourses: ['enrollments', 'me'] as const,
  learnerDashboard: ['dashboard', 'learner'] as const,
  adminDashboard: ['dashboard', 'admin'] as const,
  adminLearners: (params: object) => ['dashboard', 'admin', 'learners', params] as const,
  adminLearner: (id: string) => ['dashboard', 'admin', 'learner', id] as const,
  adminCourseActivity: (id: string) => ['dashboard', 'admin', 'course', id] as const,
  dashboardAll: ['dashboard'] as const,
};

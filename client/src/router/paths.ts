import { generatePath } from 'react-router-dom';

/**
 * Every address of the app, written once. `:name` marks the part that changes, such as an id.
 * The route table in `router.tsx` uses these addresses, and so do all links and redirects.
 *
 *   learner pages  /learner/...   (the catalog and course pages are open to everyone)
 *   admin pages    /admin/...     (administrators only)
 */
export const PATHS = {
  /** The bare address; it redirects to the catalog. */
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',

  learner: {
    catalog: '/learner/catalog',
    course: '/learner/courses/:courseId',
    lesson: '/learner/lessons/:lessonId',
    myLearning: '/learner/my-learning',
    dashboard: '/learner/dashboard',
  },

  admin: {
    overview: '/admin',
    courses: '/admin/courses',
    course: '/admin/courses/:courseId',
    categories: '/admin/categories',
    learners: '/admin/learners',
    learner: '/admin/learners/:learnerId',
  },
} as const;

/**
 * Fills in the changing part of an address to make a link.
 *
 *   link(PATHS.learner.lesson, { lessonId: '42' })   // "/learner/lessons/42"
 *
 * Addresses without a `:name` (like `PATHS.signIn`) are used as they are.
 */
export const link = generatePath;

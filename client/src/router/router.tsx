import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { PageLoader } from '@/components/feedback/page-loader';
import { RootLayout } from '@/components/layout/root-layout';
import { GuestOnly } from '@/router/guards/guest-only';
import { RequireAdmin } from '@/router/guards/require-admin';
import { RequireAuth } from '@/router/guards/require-auth';
import { PATHS } from './paths';

// Each page is loaded when it is first opened, so the first visit only downloads what it needs.
const LandingPage = lazy(() => import('@/pages/landing-page'));
const CatalogPage = lazy(() => import('@/pages/learner/catalog-page'));
const CoursePage = lazy(() => import('@/pages/learner/course-page'));
const LessonPage = lazy(() => import('@/pages/learner/lesson-page'));
const MyLearningPage = lazy(() => import('@/pages/learner/my-learning-page'));
const DashboardPage = lazy(() => import('@/pages/learner/dashboard-page'));
const SignInPage = lazy(() => import('@/pages/auth/sign-in-page'));
const SignUpPage = lazy(() => import('@/pages/auth/sign-up-page'));
const AdminOverviewPage = lazy(() => import('@/pages/admin/overview-page'));
const AdminCoursesPage = lazy(() => import('@/pages/admin/courses-page'));
const AdminCourseLessonsPage = lazy(() => import('@/pages/admin/course-lessons-page'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/categories-page'));
const AdminLearnersPage = lazy(() => import('@/pages/admin/learners-page'));
const AdminLearnerDetailPage = lazy(() => import('@/pages/admin/learner-detail-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));
// Developer-only component library; it is only added to the routes while developing.
const StyleguidePage = lazy(() =>
  import('@/pages/styleguide-page').then((m) => ({ default: m.StyleguidePage })),
);

/**
 * Who may open a page:
 *   everyone   anybody, signed in or not
 *   guest      only people who are signed out (sign-in and sign-up)
 *   signedIn   any signed-in person
 *   admin      signed-in administrators only
 */
type Who = 'everyone' | 'guest' | 'signedIn' | 'admin';

interface PageRoute {
  path: string;
  page: ComponentType;
  who: Who;
}

/** The sitemap: one line per page. */
const PAGES: PageRoute[] = [
  // The first page a visitor sees
  { path: PATHS.home, page: LandingPage, who: 'everyone' },

  // Learner pages
  { path: PATHS.learner.catalog, page: CatalogPage, who: 'everyone' },
  { path: PATHS.learner.course, page: CoursePage, who: 'everyone' },
  { path: PATHS.learner.lesson, page: LessonPage, who: 'signedIn' },
  { path: PATHS.learner.myLearning, page: MyLearningPage, who: 'signedIn' },
  { path: PATHS.learner.dashboard, page: DashboardPage, who: 'signedIn' },

  // Sign in and sign up
  { path: PATHS.signIn, page: SignInPage, who: 'guest' },
  { path: PATHS.signUp, page: SignUpPage, who: 'guest' },

  // Admin pages
  { path: PATHS.admin.overview, page: AdminOverviewPage, who: 'admin' },
  { path: PATHS.admin.courses, page: AdminCoursesPage, who: 'admin' },
  { path: PATHS.admin.course, page: AdminCourseLessonsPage, who: 'admin' },
  { path: PATHS.admin.categories, page: AdminCategoriesPage, who: 'admin' },
  { path: PATHS.admin.learners, page: AdminLearnersPage, who: 'admin' },
  { path: PATHS.admin.learner, page: AdminLearnerDetailPage, who: 'admin' },
];

/** Turns one line of the sitemap into a route. */
const toRoute = ({ path, page: Page }: PageRoute): RouteObject => ({
  path,
  element: (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  ),
});

/** The routes of every page that is open to the given kind of visitor. */
const pagesFor = (who: Who) => PAGES.filter((p) => p.who === who).map(toRoute);

export const router = createBrowserRouter([
  // Sign in and sign up: full screen, and closed to people who are already signed in.
  { element: <GuestOnly />, children: pagesFor('guest') },

  // Everything else sits inside the app frame (menu, sidebar).
  {
    element: <RootLayout />,
    children: [
      ...pagesFor('everyone'),

      // Signed-in people only. Admin pages need that too, plus the administrator role.
      {
        element: <RequireAuth />,
        children: [
          ...pagesFor('signedIn'),
          { element: <RequireAdmin />, children: pagesFor('admin') },
        ],
      },

      ...(import.meta.env.DEV
        ? [toRoute({ path: 'styleguide', page: StyleguidePage, who: 'everyone' })]
        : []),
      toRoute({ path: '*', page: NotFoundPage, who: 'everyone' }),
    ],
  },
]);

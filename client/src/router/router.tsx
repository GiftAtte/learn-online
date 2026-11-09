import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { PageLoader } from '@/components/feedback/page-loader';
import { RootLayout } from '@/components/layout/root-layout';
import { GuestOnly } from '@/router/guards/guest-only';
import { PublicOnly } from '@/router/guards/public-only';
import { RequireAdmin } from '@/router/guards/require-admin';
import { RequireAuth } from '@/router/guards/require-auth';
import RouteErrorPage from '@/pages/route-error-page';
import { PATHS } from './paths';

// Each page is loaded when it is first opened, so the first visit only downloads what it needs.
const LandingPage = lazy(() => import('@/pages/landing-page'));
const CatalogPage = lazy(() => import('@/pages/browse/catalog-page'));
const CoursePage = lazy(() => import('@/pages/browse/course-page'));
const LessonPage = lazy(() => import('@/pages/learner/lesson-page'));
const MyLearningPage = lazy(() => import('@/pages/learner/my-learning-page'));
const ProgressPage = lazy(() => import('@/pages/learner/progress-page'));
const SignInPage = lazy(() => import('@/pages/auth/sign-in-page'));
const SignUpPage = lazy(() => import('@/pages/auth/sign-up-page'));
const AdminOverviewPage = lazy(() => import('@/pages/admin/overview-page'));
const AdminCoursesPage = lazy(() => import('@/pages/admin/courses-page'));
const AdminCourseLessonsPage = lazy(() => import('@/pages/admin/course-lessons-page'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/categories-page'));
const AdminLearnersPage = lazy(() => import('@/pages/admin/learners-page'));
const AdminLearnerDetailPage = lazy(() => import('@/pages/admin/learner-detail-page'));
const AdminCourseActivityPage = lazy(() => import('@/pages/admin/course-activity-page'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/settings-page'));
const ProfilePage = lazy(() => import('@/pages/profile-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));
// Developer-only component library; it is only added to the routes while developing.
const StyleguidePage = lazy(() =>
  import('@/pages/styleguide-page').then((m) => ({ default: m.StyleguidePage })),
);

/**
 * Who may open a page:
 *   everyone   anybody, signed in or not
 *   public     the free pages for visitors; signed-in people are sent to the /learner version
 *   guest      only people who are signed out (sign-in and sign-up)
 *   signedIn   any signed-in person
 *   admin      signed-in administrators only
 */
type Who = 'everyone' | 'public' | 'guest' | 'signedIn' | 'admin';

interface PageRoute {
  path: string;
  page: ComponentType;
  who: Who;
}

/** The sitemap: one line per page. */
const PAGES: PageRoute[] = [
  // Free pages (no account needed)
  { path: PATHS.catalog, page: CatalogPage, who: 'public' },
  { path: PATHS.course, page: CoursePage, who: 'public' },

  // Learner pages. The catalog and course are the same screens as the free ones, inside the app.
  { path: PATHS.learner.catalog, page: CatalogPage, who: 'signedIn' },
  { path: PATHS.learner.course, page: CoursePage, who: 'signedIn' },
  { path: PATHS.learner.lesson, page: LessonPage, who: 'signedIn' },
  { path: PATHS.learner.myLearning, page: MyLearningPage, who: 'signedIn' },
  { path: PATHS.learner.progress, page: ProgressPage, who: 'signedIn' },
  { path: PATHS.profile, page: ProfilePage, who: 'signedIn' },

  // Sign in and sign up
  { path: PATHS.signIn, page: SignInPage, who: 'guest' },
  { path: PATHS.signUp, page: SignUpPage, who: 'guest' },

  // Admin pages
  { path: PATHS.admin.overview, page: AdminOverviewPage, who: 'admin' },
  { path: PATHS.admin.courses, page: AdminCoursesPage, who: 'admin' },
  { path: PATHS.admin.course, page: AdminCourseLessonsPage, who: 'admin' },
  { path: PATHS.admin.courseActivity, page: AdminCourseActivityPage, who: 'admin' },
  { path: PATHS.admin.categories, page: AdminCategoriesPage, who: 'admin' },
  { path: PATHS.admin.learners, page: AdminLearnersPage, who: 'admin' },
  { path: PATHS.admin.learner, page: AdminLearnerDetailPage, who: 'admin' },
  { path: PATHS.admin.settings, page: AdminSettingsPage, who: 'admin' },
];

/** Turns one line of the sitemap into a route. */
const toRoute = ({ path, page: Page }: PageRoute): RouteObject => ({
  path,
  errorElement: <RouteErrorPage />,
  element: (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  ),
});

/** The routes of every page that is open to the given kind of visitor. */
const pagesFor = (who: Who) => PAGES.filter((p) => p.who === who).map(toRoute);

export const router = createBrowserRouter([
  // The landing page has its own header and footer, so it sits outside the app frame.
  toRoute({ path: PATHS.home, page: LandingPage, who: 'everyone' }),

  // Sign in and sign up: full screen, and closed to people who are already signed in.
  { element: <GuestOnly />, errorElement: <RouteErrorPage />, children: pagesFor('guest') },

  // Everything else sits inside the app frame (menu, sidebar).
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      // Free pages: visitors only. Signed-in people are redirected to /learner/...
      { element: <PublicOnly />, children: pagesFor('public') },

      // Signed-in people only. Admin pages need that too, plus the administrator role.
      {
        element: <RequireAuth />,
        children: [
          ...pagesFor('signedIn'),
          // Bookmarks to the old address keep working.
          {
            path: PATHS.learner.legacyDashboard,
            element: <Navigate to={PATHS.learner.progress} replace />,
          },
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

import { useSession } from '@/core/hooks/queries/use-auth';
import { link, PATHS } from './paths';

/**
 * Addresses of the catalog and a course, for screens that both visitors and signed-in people see.
 * Visitors get the free addresses (/catalog); signed-in people stay inside the app (/learner/catalog).
 *
 *   const browse = useBrowsePaths();
 *   <Link to={browse.course(course.id)}>
 */
export function useBrowsePaths() {
  const { user } = useSession();
  const paths = user ? PATHS.learner : PATHS;

  return {
    catalog: paths.catalog,
    course: (courseId: string) => link(paths.course, { courseId }),
  };
}

import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/logo';
import { useSession } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

/** The bottom of every public page (landing, catalog, course): logo and a few links. */
export function PublicFooter() {
  const { user } = useSession();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span className="text-ink">
          <Logo />
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          <Link to={PATHS.learner.catalog} className="hover:text-ink">
            Courses
          </Link>
          {!user && (
            <>
              <Link to={PATHS.signIn} className="hover:text-ink">
                Sign in
              </Link>
              <Link to={PATHS.signUp} className="hover:text-ink">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}

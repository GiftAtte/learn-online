import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { useSession } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

const LINK_STYLE =
  'rounded-control px-3 py-2 text-sm text-white/75 transition-colors hover:text-white';

/** The landing page's top bar: logo, links to the sections below, and sign-in or "open the app". */
export function LandingHeader() {
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-spruce-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={PATHS.home} aria-label="LearnOnline home">
          <Logo inverted />
        </Link>

        <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
          <a href="#how-it-works" className={LINK_STYLE}>
            How it works
          </a>
          <a href="#features" className={LINK_STYLE}>
            What you get
          </a>
          <Link to={PATHS.learner.catalog} className={LINK_STYLE}>
            Courses
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="accent" size="sm">
              <Link to={PATHS.learner.catalog}>Open the app</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Link to={PATHS.signIn}>Sign in</Link>
              </Button>
              <Button asChild variant="accent" size="sm">
                <Link to={PATHS.signUp}>Sign up free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

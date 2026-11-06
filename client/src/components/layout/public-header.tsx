import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { useSession } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

const LINK_STYLE =
  'rounded-control px-3 py-2 text-sm text-white/75 transition-colors hover:text-white';

interface PublicHeaderProps {
  /** Show links that jump to the sections of the landing page (only meaningful on that page). */
  showSections?: boolean;
}

/**
 * The top bar for everyone who is not inside the app: the landing page and the public catalog.
 * Logo, links, and sign-in / sign-up buttons (or "Open the app" when already signed in).
 */
export function PublicHeader({ showSections }: PublicHeaderProps) {
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-spruce-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={PATHS.home} aria-label="LearnOnline home">
          <Logo inverted />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {showSections && (
            <>
              <a href="#how-it-works" className={LINK_STYLE}>
                How it works
              </a>
              <a href="#features" className={LINK_STYLE}>
                What you get
              </a>
            </>
          )}
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

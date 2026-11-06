import { Link, useLocation } from 'react-router-dom';
import type { To } from 'react-router-dom';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { useSession } from '@/core/hooks/queries/use-auth';
import { cn } from '@/core/lib/cn';
import { homeFor, PATHS } from '@/router/paths';

interface MenuItem {
  label: string;
  to: To;
  /** True when the visitor is looking at what this item leads to. */
  active: boolean;
}

/**
 * The same menu on every public page. The first two items jump to a section of the landing page;
 * once someone is signed in they are not needed, so only "Courses" stays.
 */
function useMenuItems(signedIn: boolean): MenuItem[] {
  const { pathname, hash } = useLocation();
  const onLanding = pathname === PATHS.home;

  const sections: MenuItem[] = [
    {
      label: 'How it works',
      to: { pathname: PATHS.home, hash: 'how-it-works' },
      active: onLanding && hash === '#how-it-works',
    },
    {
      label: 'What you get',
      to: { pathname: PATHS.home, hash: 'features' },
      active: onLanding && hash === '#features',
    },
  ];
  const courses: MenuItem = {
    label: 'Courses',
    to: signedIn ? PATHS.learner.catalog : PATHS.catalog,
    active:
      pathname === PATHS.catalog ||
      pathname.startsWith('/courses/') ||
      pathname.startsWith('/learner/'),
  };

  return signedIn ? [courses] : [...sections, courses];
}

/**
 * The top bar for everyone who is not inside the app: the landing page, the public catalog and the
 * course pages. Logo, the menu, and sign-in / sign-up buttons (or "Open the app" when signed in).
 * The menu is shown from tablet width up; on phones the header keeps only the logo and the buttons.
 */
export function PublicHeader() {
  const { user, isAdmin } = useSession();
  const items = useMenuItems(!!user);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-spruce-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-10">
          <Link to={PATHS.home} aria-label="LearnOnline home">
            <Logo inverted />
          </Link>

          {/* Tablet and wider: the menu sits next to the logo; the current item is underlined in yellow. */}
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items.map(({ label, to, active }) => (
              <Link
                key={label}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-control px-3 py-2 text-sm transition-colors',
                  active ? 'text-white' : 'text-white/75 hover:text-white',
                  active &&
                    'after:absolute after:inset-x-3 after:-bottom-[1.05rem] after:h-[3px] after:rounded-full after:bg-pencil-500',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="accent" size="sm">
              <Link to={homeFor(isAdmin)}>{isAdmin ? 'Open the dashboard' : 'Open the app'}</Link>
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

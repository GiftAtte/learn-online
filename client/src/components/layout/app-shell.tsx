import { useAppSettings } from '@/core/hooks/queries/use-settings';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/core/lib/cn';
import { AccountMenu } from './account-menu';
import { Container } from './container';
import { Logo } from './logo';
import type { NavItem, ShellUser } from '@/core/types/ui.types';
import { Sidebar } from './sidebar';
import { PATHS } from '@/router/paths';

interface AppShellProps {
  nav: NavItem[];
  /** Links pinned to the bottom of the sidebar (such as Settings). Phones get them in the tab bar. */
  footerNav?: NavItem[];
  user: ShellUser;
  onSignOut?: () => void;
}

/**
 * The frame around every page for signed-in people (signed-out visitors get PublicLayout).
 *  - Desktop (lg+): a sidebar with navigation and the account.
 *  - Tablet and phone: a top bar with the logo and the avatar (which opens the account menu), plus a
 *    bottom tab bar.
 */
export function AppShell({ nav, footerNav = [], user, onSignOut }: AppShellProps) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Skip to content
      </a>

      <Sidebar nav={nav} footerNav={footerNav} user={user} onSignOut={onSignOut} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={user}
          home={nav[0]?.to ?? PATHS.learner.catalog}
          menuLinks={footerNav}
          onSignOut={onSignOut}
        />

        <main id="main" className="flex-1 py-6 pb-28 sm:py-10 lg:pb-14">
          {/* Pages fill the width next to the sidebar, with small margins on both sides. */}
          <Container fluid>
            <Outlet />
          </Container>
        </main>

        <BottomTabs nav={[...nav, ...footerNav]} />
      </div>
    </div>
  );
}

/**
 * Sticky header for tablet and phone (below `lg`, where there is no sidebar): the logo, and the
 * person's avatar at the top right, which opens the account menu. On desktop the sidebar carries both.
 */
function TopBar({
  user,
  home,
  menuLinks,
  onSignOut,
}: {
  user: ShellUser;
  /** Where the logo leads: the person's own home. */
  home: string;
  menuLinks: NavItem[];
  onSignOut?: () => void;
}) {
  const { appName } = useAppSettings();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md lg:hidden">
      <Container fluid className="flex h-16 items-center justify-between gap-3 sm:gap-6">
        <Link to={home} aria-label={`${appName} home`} className="rounded-control">
          <Logo />
        </Link>
        <AccountMenu user={user} links={menuLinks} onSignOut={onSignOut} />
      </Container>
    </header>
  );
}

/** Phone and tablet navigation: the main destinations, one thumb away. */
function BottomTabs({ nav }: { nav: NavItem[] }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 safe-bottom backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                  isActive ? 'text-ink' : 'text-ink-faint',
                  isActive &&
                    'before:absolute before:top-0 before:h-[3px] before:w-8 before:rounded-b-full before:bg-pencil-500',
                )
              }
            >
              <Icon className="size-[1.4rem]" strokeWidth={1.8} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

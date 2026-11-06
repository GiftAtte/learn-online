import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/core/lib/cn';
import { Container } from './container';
import { Logo } from './logo';
import type { NavItem, ShellUser } from '@/core/types/ui.types';
import { Sidebar } from './sidebar';
import { PATHS } from '@/router/paths';

interface AppShellProps {
  nav: NavItem[];
  user: ShellUser | null;
  onSignOut?: () => void;
  /** Rendered in the top bar when no one is signed in (sign-in / sign-up buttons). */
  guestActions?: ReactNode;
}

/**
 * The frame around every page.
 *  - Signed in, desktop (lg+): a sidebar with navigation and the account.
 *  - Signed in, tablet and phone: a slim top bar with the account menu, plus a bottom tab bar.
 *  - Signed out: a simple top bar with the catalog link and sign-in / sign-up buttons.
 */
export function AppShell({ nav, user, onSignOut, guestActions }: AppShellProps) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Skip to content
      </a>

      {user && <Sidebar nav={nav} user={user} onSignOut={onSignOut} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          nav={nav}
          user={user}
          onSignOut={onSignOut}
          guestActions={guestActions}
          // With a sidebar, the top bar is only needed below `lg`.
          className={user ? 'lg:hidden' : undefined}
        />

        <main id="main" className={cn('flex-1 py-6 sm:py-10', user && 'pb-28 lg:pb-14')}>
          {/* Signed-in pages fill the width next to the sidebar, with small margins on both sides. */}
          <Container fluid={!!user}>
            <Outlet />
          </Container>
        </main>

        {user && <BottomTabs nav={nav} />}
      </div>
    </div>
  );
}

interface TopBarProps extends AppShellProps {
  className?: string;
}

/** Sticky header: logo, inline links (signed-out only) and the account menu or sign-in buttons. */
function TopBar({ nav, user, onSignOut, guestActions, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md',
        className,
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-3 sm:gap-6">
        <Link to={PATHS.learner.catalog} aria-label="LearnOnline home" className="rounded-control">
          <Logo />
        </Link>

        {!user && (
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-control px-3.5 py-2 text-[0.95rem] font-medium transition-colors',
                    isActive ? 'text-ink' : 'text-ink-soft hover:text-ink',
                    // The pencil underline marks where you are.
                    isActive &&
                      'after:absolute after:inset-x-3.5 after:-bottom-[1.1rem] after:h-[3px] after:rounded-full after:bg-pencil-500',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        {user ? (
          <AccountMenu user={user} onSignOut={onSignOut} />
        ) : (
          (guestActions ?? <Button size="sm">Sign in</Button>)
        )}
      </Container>
    </header>
  );
}

/** Avatar button that opens the account menu (used below `lg`, where there is no sidebar). */
function AccountMenu({ user, onSignOut }: { user: ShellUser; onSignOut?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex cursor-pointer items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-sunken"
      >
        <Avatar name={user.name} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block font-medium text-ink">{user.name}</span>
          <span className="block">{user.email}</span>
          {user.roleLabel && <span className="mt-1 block text-xs">{user.roleLabel}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Phone and tablet navigation for signed-in people: the main destinations, one thumb away. */
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

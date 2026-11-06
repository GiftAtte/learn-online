import { LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/core/lib/cn';
import { Logo } from './logo';
import type { NavItem, ShellUser } from '@/core/types/ui.types';
import { PATHS } from '@/router/paths';

interface SidebarProps {
  nav: NavItem[];
  user: ShellUser;
  onSignOut?: () => void;
}

/**
 * Desktop navigation for signed-in people (learners and administrators): a "chalkboard" panel with
 * the logo, the main destinations, and the account with sign out at the bottom.
 * The pencil-yellow bar marks the page you are on. Hidden below `lg`, where the top bar and the
 * bottom tab bar take over.
 */
export function Sidebar({ nav, user, onSignOut }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-spruce-900 text-white lg:flex">
      <Link
        to={nav[0]?.to ?? PATHS.learner.catalog}
        aria-label="LearnOnline home"
        className="m-3 mt-4 w-fit rounded-control p-2"
      >
        <Logo inverted />
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => (
          <div key={item.to} className={cn(item.separated && 'mt-3 border-t border-white/10 pt-4')}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 items-center gap-3 rounded-control px-3 text-[0.95rem] font-medium transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-spruce-200 hover:bg-white/5 hover:text-white',
                  // The pencil marker for "you are here"
                  isActive &&
                    'before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-pencil-500',
                )
              }
            >
              <item.icon className="size-[1.2rem]" strokeWidth={1.8} aria-hidden />
              {item.label}
            </NavLink>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={user.name} size="md" className="bg-spruce-700 text-white" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            {user.roleLabel && (
              <span className="truncate text-xs text-spruce-300">{user.roleLabel}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-[0.95rem] font-medium text-spruce-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-[1.2rem]" strokeWidth={1.8} aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}

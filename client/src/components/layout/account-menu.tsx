import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/core/lib/cn';
import { initialsOf } from '@/core/lib/format';
import type { NavItem, ShellUser } from '@/core/types/ui.types';
import { PATHS } from '@/router/paths';

interface AccountMenuProps {
  user: ShellUser;
  /** Extra places to go, such as Settings for administrators. */
  links?: NavItem[];
  onSignOut?: () => void;
  /**
   * Where the menu lives. "bar" is the avatar at the top right of the phone and tablet header;
   * "sidebar" is the full-width account row at the bottom of the desktop sidebar (dark, opens upward).
   */
  placement?: 'bar' | 'sidebar';
}

/**
 * The person's avatar as a dropdown. The menu shows who they are (avatar, name, email, role), then their
 * profile, any extra links, and Sign out.
 */
export function AccountMenu({ user, links = [], onSignOut, placement = 'bar' }: AccountMenuProps) {
  const sidebar = placement === 'sidebar';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // A name must contain the text people see. In the sidebar it is built from that text; on the phone only the
        // initials are visible, so they are part of the name (voice control can say what it sees).
        aria-label={sidebar ? undefined : `Account menu, ${user.name}, ${initialsOf(user.name)}`}
        className={cn(
          'group flex cursor-pointer items-center gap-3 outline-none',
          sidebar
            ? 'w-full rounded-card p-2 text-left text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-pencil-500 data-[state=open]:bg-white/10'
            : 'shrink-0 rounded-full border border-transparent p-1 transition-colors hover:border-line hover:bg-surface focus-visible:ring-4 focus-visible:ring-spruce-700/15 data-[state=open]:border-line data-[state=open]:bg-surface',
        )}
      >
        <Avatar
          name={user.name}
          size={sidebar ? 'md' : 'sm'}
          className={sidebar ? 'bg-spruce-700 text-white' : undefined}
        />
        {sidebar && (
          <>
            <span className="sr-only">Account menu, </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              {user.roleLabel && (
                <span className="truncate text-xs text-spruce-300">{user.roleLabel}</span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-spruce-300" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={sidebar ? 'top' : 'bottom'}
        align={sidebar ? 'start' : 'end'}
        sideOffset={sidebar ? 8 : 10}
        className="w-72 p-0"
      >
        <div className="flex items-center gap-3.5 border-b border-line px-4 py-4">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{user.name}</p>
            <p className="truncate text-sm text-ink-faint">{user.email}</p>
            {user.roleLabel && (
              <span className="mt-1.5 inline-block rounded-full bg-spruce-100 px-2 py-0.5 text-xs font-medium text-spruce-800">
                {user.roleLabel}
              </span>
            )}
          </div>
        </div>

        <div className="p-1.5">
          <DropdownMenuItem asChild>
            <Link to={PATHS.profile}>
              <UserRound className="size-[1.15rem] text-ink-soft" strokeWidth={1.8} aria-hidden />
              Your profile
            </Link>
          </DropdownMenuItem>
          {links.map(({ to, label, icon: Icon }) => (
            <DropdownMenuItem asChild key={to}>
              <Link to={to}>
                <Icon className="size-[1.15rem] text-ink-soft" strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={onSignOut}>
            <LogOut className="size-[1.15rem]" strokeWidth={1.8} aria-hidden />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

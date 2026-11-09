import { useAppSettings } from '@/core/hooks/queries/use-settings';
import { Globe } from 'lucide-react';
import { useId } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/core/lib/cn';
import { AccountMenu } from './account-menu';
import { Logo } from './logo';
import type { NavItem, ShellUser } from '@/core/types/ui.types';
import { PATHS } from '@/router/paths';

/** One sidebar link. The pencil-yellow bar marks the page you are on. */
const linkStyles = (isActive: boolean) =>
  cn(
    'relative flex min-h-11 items-center gap-3 rounded-control px-3 text-[0.95rem] font-medium transition-colors',
    isActive ? 'bg-white/10 text-white' : 'text-spruce-200 hover:bg-white/5 hover:text-white',
    isActive &&
      'before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-pencil-500',
  );

/** Consecutive items with the same `group` heading, in the order they were given. */
const toSections = (nav: NavItem[]) =>
  nav.reduce<{ heading?: string; items: NavItem[] }[]>((sections, item) => {
    const last = sections[sections.length - 1];
    if (last && last.heading === item.group) last.items.push(item);
    else sections.push({ heading: item.group, items: [item] });
    return sections;
  }, []);

interface SidebarProps {
  nav: NavItem[];
  /** Links pinned above the account, e.g. Settings. */
  footerNav?: NavItem[];
  user: ShellUser;
  onSignOut?: () => void;
}

/**
 * Desktop navigation for signed-in people (learners and administrators): a "chalkboard" panel with
 * the logo, the main destinations, and at the bottom Settings, the landing page and the account
 * (avatar, name and role) which opens a menu with the profile and Sign out.
 * The pencil-yellow bar marks the page you are on. Hidden below `lg`, where the top bar and the
 * bottom tab bar take over.
 */
export function Sidebar({ nav, footerNav = [], user, onSignOut }: SidebarProps) {
  const { appName } = useAppSettings();
  const headingId = useId();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-spruce-900 text-white lg:flex">
      <Link
        to={nav[0]?.to ?? PATHS.learner.catalog}
        aria-label={`${appName} home`}
        className="m-3 mt-4 w-fit rounded-control p-2"
      >
        <Logo inverted />
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {toSections(nav).map(({ heading, items }, index) => {
          const id = `${headingId}-${index}`;
          return (
            <div
              key={heading ?? items[0]!.to}
              role={heading ? 'group' : undefined}
              aria-labelledby={heading ? id : undefined}
            >
              {heading && (
                <p
                  id={id}
                  className="px-3 pb-2 text-[0.6875rem] font-semibold tracking-[0.1em] text-spruce-300 uppercase"
                >
                  {heading}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => linkStyles(isActive)}
                    >
                      <item.icon className="size-[1.2rem]" strokeWidth={1.8} aria-hidden />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 p-3">
        {footerNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => linkStyles(isActive)}
          >
            <item.icon className="size-[1.2rem]" strokeWidth={1.8} aria-hidden />
            {item.label}
          </NavLink>
        ))}
        <Link to={PATHS.home} className={linkStyles(false)}>
          <Globe className="size-[1.2rem]" strokeWidth={1.8} aria-hidden />
          Landing page
        </Link>

        <div className="mt-1 border-t border-white/10 pt-2">
          <AccountMenu user={user} placement="sidebar" onSignOut={onSignOut} />
        </div>
      </div>
    </aside>
  );
}

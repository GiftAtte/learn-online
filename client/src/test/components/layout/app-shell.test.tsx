import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Library, ListVideo, Settings, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import type { NavItem } from '@/core/types/ui.types';

const user = { name: 'Ada Admin', email: 'ada@test.dev', roleLabel: 'Administrator' };

const nav: NavItem[] = [
  { to: '/admin/courses', label: 'Courses', icon: Library, group: 'Content' },
  { to: '/admin/lessons', label: 'Lessons', icon: ListVideo, group: 'Content' },
  {
    to: '/admin/categories',
    label: 'Categories',
    icon: Library,
    group: 'Content',
    inTabBar: false,
  },
  { to: '/admin/learners', label: 'Learners', icon: Users, group: 'People' },
];
const footerNav: NavItem[] = [
  { to: '/admin/settings', label: 'Settings', icon: Settings, inTabBar: false },
];

const renderShell = () =>
  render(
    <MemoryRouter>
      <AppShell nav={nav} footerNav={footerNav} user={user} />
    </MemoryRouter>,
  );

describe('phone navigation', () => {
  it('keeps the main destinations in the tab bar and moves the rest into the avatar menu', async () => {
    renderShell();
    // Two "Main" navigations: the desktop sidebar, then the phone tab bar.
    const [, tabs] = screen.getAllByRole('navigation', { name: 'Main' });
    expect(
      within(tabs!)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Home', 'Courses', 'Lessons', 'Learners']);

    // The top bar's avatar opens a menu that holds what did not fit.
    const avatar = screen
      .getAllByRole('button', { name: /Account menu/ })
      .find((button) => button.closest('header'))!;
    await userEvent.setup().click(avatar);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Categories' })).toHaveAttribute(
      'href',
      '/admin/categories',
    );
    expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/admin/settings',
    );
    expect(within(menu).queryByRole('menuitem', { name: 'Courses' })).not.toBeInTheDocument();
  });

  it('still shows every item in the desktop sidebar', () => {
    renderShell();
    const [sidebar] = screen.getAllByRole('navigation', { name: 'Main' });
    expect(
      within(sidebar!)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Courses', 'Lessons', 'Categories', 'Learners']);
  });
});

describe('phone navigation with a drawer (administrators)', () => {
  const renderDrawerShell = () =>
    render(
      <MemoryRouter initialEntries={['/admin/courses']}>
        <AppShell nav={nav} footerNav={footerNav} user={user} mobileNav="drawer" />
      </MemoryRouter>,
    );

  it('has no bottom tab bar, only a menu button in the top bar', () => {
    renderDrawerShell();
    // Only the desktop sidebar is a "Main" navigation; the phone tab bar is gone.
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Open menu' }).closest('header')).not.toBeNull();
  });

  it('opens a drawer holding every destination, grouped, with settings and the account', async () => {
    const user_ = userEvent.setup();
    renderDrawerShell();
    await user_.click(screen.getByRole('button', { name: 'Open menu' }));

    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    const links = within(drawer)
      .getAllByRole('link')
      .map((l) => l.textContent);
    // The logo link first, then the groups, then the footer links.
    expect(links).toEqual(
      expect.arrayContaining([
        'Courses',
        'Lessons',
        'Categories',
        'Learners',
        'Settings',
        'Landing page',
      ]),
    );
    expect(within(drawer).getByRole('group', { name: 'Content' })).toBeInTheDocument();
    expect(within(drawer).getByRole('group', { name: 'People' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: /Account menu/ })).toBeInTheDocument();
  });

  it('closes when you pick a page, press Escape, or use the close button', async () => {
    const user_ = userEvent.setup();
    renderDrawerShell();

    await user_.click(screen.getByRole('button', { name: 'Open menu' }));
    await user_.click(
      within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('link', { name: 'Learners' }),
    );
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();

    await user_.click(screen.getByRole('button', { name: 'Open menu' }));
    await user_.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();

    await user_.click(screen.getByRole('button', { name: 'Open menu' }));
    await user_.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('keeps the avatar menu for the profile and sign out only', async () => {
    renderDrawerShell();
    const avatar = screen
      .getAllByRole('button', { name: /Account menu/ })
      .find((button) => button.closest('header'))!;
    await userEvent.setup().click(avatar);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Your profile' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Categories' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Settings' })).not.toBeInTheDocument();
  });
});

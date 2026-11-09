import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Settings, Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import type { NavItem } from '@/core/types/ui.types';

const user = { name: 'Ada Admin', email: 'ada@test.dev', roleLabel: 'Administrator' };
const nav = [{ to: '/admin/learners', label: 'Learners', icon: Users }];

describe('sidebar footer', () => {
  it('pins Settings and the landing page link below the main menu, above the account', async () => {
    render(
      <MemoryRouter>
        <Sidebar
          nav={nav}
          footerNav={[{ to: '/admin/settings', label: 'Settings', icon: Settings }]}
          user={user}
        />
      </MemoryRouter>,
    );

    const main = screen.getByRole('navigation', { name: 'Main' });
    expect(within(main).getByRole('link', { name: 'Learners' })).toBeInTheDocument();
    expect(within(main).queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/admin/settings',
    );
    expect(screen.getByRole('link', { name: 'Landing page' })).toHaveAttribute('href', '/');
    // The account row is the avatar dropdown: name and role on the row, profile and sign out inside.
    const account = screen.getByRole('button', { name: /Account menu,\s*Ada Admin/ });
    expect(account).toHaveTextContent('Ada Admin');
    expect(account).toHaveTextContent('Administrator');
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).not.toBeInTheDocument();

    await userEvent.setup().click(account);
    expect(screen.getByRole('menuitem', { name: 'Your profile' })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.getByText('ada@test.dev')).toBeInTheDocument();
  });

  it('shows only the landing page link when there are no footer items (learners)', () => {
    render(
      <MemoryRouter>
        <Sidebar nav={nav} user={user} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Landing page' })).toBeInTheDocument();
  });
});

describe('sidebar groups', () => {
  const adminNav: NavItem[] = [
    { to: '/admin', label: 'Overview', icon: Users, end: true },
    { to: '/admin/courses', label: 'Courses', icon: Users, group: 'Content' },
    { to: '/admin/lessons', label: 'Lessons', icon: Users, group: 'Content' },
    { to: '/admin/categories', label: 'Categories', icon: Users, group: 'Content' },
    { to: '/admin/learners', label: 'Learners', icon: Users, group: 'People' },
  ];

  const renderNav = (items: NavItem[]) =>
    render(
      <MemoryRouter>
        <Sidebar nav={items} user={user} />
      </MemoryRouter>,
    );

  it('puts items under a labelled heading, and keeps ungrouped items on their own', () => {
    renderNav(adminNav);
    const main = screen.getByRole('navigation', { name: 'Main' });

    const content = within(main).getByRole('group', { name: 'Content' });
    expect(
      within(content)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Courses', 'Lessons', 'Categories']);
    const people = within(main).getByRole('group', { name: 'People' });
    expect(
      within(people)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Learners']);

    // Overview is not in a group.
    const overview = within(main).getByRole('link', { name: 'Overview' });
    expect(content).not.toContainElement(overview);
    expect(people).not.toContainElement(overview);
    expect(within(main).getAllByRole('group')).toHaveLength(2);
  });

  it('keeps the order it was given', () => {
    renderNav(adminNav);
    const main = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(main)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Overview', 'Courses', 'Lessons', 'Categories', 'Learners']);
  });

  it('shows a plain list, with no headings, when nothing is grouped (learners)', () => {
    renderNav([
      { to: '/learner/catalog', label: 'Catalog', icon: Users },
      { to: '/learner/my-learning', label: 'My learning', icon: Users },
    ]);
    const main = screen.getByRole('navigation', { name: 'Main' });
    expect(within(main).queryByRole('group')).not.toBeInTheDocument();
    expect(within(main).getAllByRole('listitem')).toHaveLength(2);
  });
});

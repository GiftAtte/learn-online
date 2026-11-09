import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Settings, Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';

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

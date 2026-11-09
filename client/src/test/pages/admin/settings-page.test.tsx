import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminSettingsPage from '@/pages/admin/settings-page';
import * as settingsService from '@/core/services/settings.service';
import type { AppSettings } from '@/core/types/settings.types';

vi.mock('@/core/services/settings.service');

const saved: AppSettings = {
  appName: 'LearnOnline',
  tagline: null,
  logoUrl: null,
  supportEmail: null,
  imageMaxMegabytes: 10,
  videoMaxMegabytes: 100,
  imageFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  videoFormats: ['mp4', 'webm', 'mov'],
  allowSignups: true,
};

const renderPage = async (path = '/admin/settings') => {
  vi.mocked(settingsService.getSettings).mockResolvedValue(saved);
  vi.mocked(settingsService.updateSettings).mockImplementation(async (values) => ({
    ...values,
    tagline: values.tagline || null,
    logoUrl: values.logoUrl || null,
    supportEmail: values.supportEmail || null,
  }));
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[path]}>
        <AdminSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await screen.findByRole('tablist', { name: 'Settings sections' });
};

// A tab's name is its label plus a one-line hint ("Media Upload size and file types"), and a tab
// with a problem also announces it, so match on the start.
const openTab = (user: ReturnType<typeof userEvent.setup>, label: string) =>
  user.click(screen.getByRole('tab', { name: new RegExp(`^${label}`) }));

const saveButton = () => screen.queryByRole('button', { name: 'Save changes' });

describe('admin settings page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('has a vertical tab for each section, says what is in it, and opens on Application', async () => {
    await renderPage();
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    ['Application', 'Branding', 'Media', 'Access'].forEach((label, i) => {
      expect(tabs[i]).toHaveTextContent(new RegExp(`^${label}`));
    });
    expect(tabs[0]).toHaveTextContent('Name, tagline and contact');
    expect(tabs[2]).toHaveTextContent('Upload size and file types');

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/application name/i)).toHaveValue('LearnOnline');
    // Other sections are not on screen until opened.
    expect(screen.queryByLabelText(/largest video/i)).not.toBeInTheDocument();
  });

  it('opens straight on the section named in the address', async () => {
    await renderPage('/admin/settings?tab=media');
    expect(screen.getByLabelText(/largest video/i)).toHaveValue(100);
  });

  it('shows the saved upload rules and sign-up switch, with no Save bar until something changes', async () => {
    const user = userEvent.setup();
    await renderPage();

    await openTab(user, 'Media');
    expect(screen.getByLabelText(/largest image/i)).toHaveValue(10);
    expect(screen.getByLabelText(/largest video/i)).toHaveValue(100);
    expect(screen.getByRole('checkbox', { name: 'PNG' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'AVIF' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'MP4' })).toBeChecked();

    await openTab(user, 'Access');
    expect(screen.getByRole('switch', { name: /allow new sign-ups/i })).toBeChecked();

    // Nothing has changed, so there is nothing to save yet.
    expect(saveButton()).not.toBeInTheDocument();
    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
  });

  it('saves changes made across several tabs with one Save', async () => {
    const user = userEvent.setup();
    await renderPage();

    const name = screen.getByLabelText(/application name/i);
    await user.clear(name);
    await user.type(name, 'Brightpath');

    await openTab(user, 'Media');
    const video = screen.getByLabelText(/largest video/i);
    await user.clear(video);
    await user.type(video, '50');
    await user.click(screen.getByRole('checkbox', { name: 'AVIF' })); // allow
    await user.click(screen.getByRole('checkbox', { name: 'GIF' })); // forbid

    await openTab(user, 'Access');
    await user.click(screen.getByRole('switch', { name: /allow new sign-ups/i }));

    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    await user.click(saveButton()!);

    await waitFor(() => expect(settingsService.updateSettings).toHaveBeenCalledTimes(1));
    expect(vi.mocked(settingsService.updateSettings).mock.calls[0]![0]).toEqual({
      appName: 'Brightpath',
      tagline: '',
      logoUrl: '',
      supportEmail: '',
      imageMaxMegabytes: 10,
      videoMaxMegabytes: 50,
      imageFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      videoFormats: ['mp4', 'webm', 'mov'],
      allowSignups: false,
    });
    // Saved: the bar goes away again.
    await waitFor(() => expect(saveButton()).not.toBeInTheDocument());
  });

  it('discards unsaved changes', async () => {
    const user = userEvent.setup();
    await renderPage();
    const name = screen.getByLabelText(/application name/i);
    await user.clear(name);
    await user.type(name, 'Something else');
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByLabelText(/application name/i)).toHaveValue('LearnOnline');
    expect(saveButton()).not.toBeInTheDocument();
  });

  it('explains bad values, jumps to the section with the problem, and sends nothing', async () => {
    const user = userEvent.setup();
    await renderPage('/admin/settings?tab=media');

    await user.clear(screen.getByLabelText(/largest image/i));
    await user.type(screen.getByLabelText(/largest image/i), '500');
    for (const type of ['MP4', 'WEBM', 'MOV']) {
      await user.click(screen.getByRole('checkbox', { name: type }));
    }
    await openTab(user, 'Application');
    await user.clear(screen.getByLabelText(/application name/i));
    await user.type(screen.getByLabelText(/application name/i), 'A');
    await openTab(user, 'Access'); // the problem is now out of sight
    await user.click(saveButton()!);

    // It brings you to the first section with a problem and flags both.
    expect(await screen.findByText('Enter at least 2 characters')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Application/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getAllByRole('img', { name: 'Has a problem' })).toHaveLength(2);

    await openTab(user, 'Media');
    expect(screen.getByText('Use 50 MB or less')).toBeInTheDocument();
    expect(screen.getByText('Allow at least one file type')).toBeInTheDocument();
    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('rejects a bad support email', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText(/support email/i), 'not-an-email');
    await user.click(saveButton()!);
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('previews the logo area with the name being typed', async () => {
    const user = userEvent.setup();
    await renderPage();
    const name = screen.getByLabelText(/application name/i);
    await user.clear(name);
    await user.type(name, 'Brightpath');
    await openTab(user, 'Branding');
    expect(screen.getAllByText('Brightpath')).toHaveLength(2); // on light and dark
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonFormModal } from '@/components/lessons/lesson-form-modal';

const create = vi.hoisted(() => vi.fn());
vi.mock('@/core/hooks/queries/use-lessons', () => ({
  useCreateLesson: () => ({ mutateAsync: create, isPending: false }),
  useUpdateLesson: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/core/lib/youtube-api', () => ({
  fetchYouTubeDuration: vi.fn(async () => 212),
}));

const renderForm = (props: Partial<React.ComponentProps<typeof LessonFormModal>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LessonFormModal courseId="course-1" onClose={vi.fn()} {...props} />
    </QueryClientProvider>,
  );

const ID = 'dQw4w9WgXcQ';
const videoBox = () => screen.getByPlaceholderText(/video id or link/i);

describe('lesson form: YouTube videos', () => {
  beforeEach(() => {
    create.mockReset().mockResolvedValue({});
  });

  it('adds a lesson from a pasted YouTube link: stores the standard address, fills length and thumbnail', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^title/i), 'Welcome to the course');
    await user.type(screen.getByLabelText(/^description/i), 'What we will cover.');
    await user.click(screen.getByRole('radio', { name: 'YouTube' }));
    await user.type(videoBox(), `https://youtu.be/${ID}?si=abc`);

    // The preview confirms the video, and the length is read from YouTube.
    expect(await screen.findByText(`YouTube video ${ID}`)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/video length/i)).toHaveValue(212));
    expect(screen.getByText(/Length 3:32/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add lesson' }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0]![0]).toEqual({
      courseId: 'course-1',
      input: expect.objectContaining({
        title: 'Welcome to the course',
        videoUrl: `https://www.youtube.com/watch?v=${ID}`,
        durationSeconds: 212,
        thumbnailUrl: `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`,
      }),
    });
  });

  it('accepts the bare video ID too', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('radio', { name: 'YouTube' }));
    await user.type(videoBox(), ID);
    expect(await screen.findByText(`YouTube video ${ID}`)).toBeInTheDocument();
  });

  it('explains something that is not a YouTube video and does not accept it', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^title/i), 'A lesson');
    await user.type(screen.getByLabelText(/^description/i), 'Something');
    await user.click(screen.getByRole('radio', { name: 'YouTube' }));
    await user.type(videoBox(), 'https://vimeo.com/123456');

    expect(screen.getByText(/doesn.t look like a YouTube video ID or link/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add lesson' }));
    expect(await screen.findByText(/Add a video/i)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('opens an existing YouTube lesson on the YouTube tab, showing its ID', () => {
    renderForm({
      existing: {
        id: 'l1',
        courseId: 'course-1',
        title: 'Existing',
        description: 'Already here',
        videoUrl: `https://www.youtube.com/watch?v=${ID}`,
        thumbnailUrl: null,
        durationSeconds: 100,
        order: 1,
      } as never,
    });
    expect(screen.getByRole('radio', { name: 'YouTube' })).toHaveAttribute('aria-checked', 'true');
    expect(videoBox()).toHaveValue(ID);
  });

  it('keeps the upload option for normal videos', () => {
    renderForm();
    expect(screen.getByRole('radio', { name: 'Upload or link' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.queryByPlaceholderText(/video id or link/i)).not.toBeInTheDocument();
  });
});

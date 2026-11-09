import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConfirmProvider } from '@/components/feedback/confirm-dialog';
import * as coursesService from '@/core/services/courses.service';
import * as lessonsService from '@/core/services/lessons.service';
import type { CourseSummary } from '@/core/types/course.types';
import type { AdminLesson } from '@/core/types/lesson.types';
import AdminLessonsPage from '@/pages/admin/lessons-page';

vi.mock('@/core/services/lessons.service');
vi.mock('@/core/services/courses.service');

const course = (id: string, title: string): CourseSummary => ({
  id,
  title,
  description: 'A course.',
  thumbnailUrl: null,
  published: true,
  category: { id: 'cat', name: 'Programming' },
  lessonCount: 2,
  totalDurationSeconds: 600,
  completedLessons: 0,
  progressPercent: 0,
  status: 'NOT_STARTED',
});

const lesson = (id: string, title: string, courseTitle: string, order = 1): AdminLesson => ({
  id,
  courseId: `course-${courseTitle}`,
  title,
  description: 'About the lesson.',
  videoUrl: 'https://example.com/video.mp4',
  thumbnailUrl: null,
  durationSeconds: 300,
  order,
  createdAt: '2026-11-09T10:00:00.000Z',
  course: { id: `course-${courseTitle}`, title: courseTitle, published: true },
});

const page = (items: AdminLesson[]) => ({
  items,
  meta: { page: 1, pageSize: 10, total: items.length, totalPages: 1 },
});

const renderPage = (path = '/admin/lessons') =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[path]}>
        <ConfirmProvider>
          <AdminLessonsPage />
        </ConfirmProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('admin lessons page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(coursesService.getAllCourses).mockResolvedValue({
      items: [course('course-Cooking', 'Cooking'), course('course-Gardening', 'Gardening')],
      meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
    });
    vi.mocked(lessonsService.getAllLessons).mockResolvedValue(
      page([
        lesson('l1', 'Sharpening knives', 'Cooking'),
        lesson('l2', 'Planting seeds', 'Gardening'),
      ]),
    );
  });

  it('lists lessons from every course with their course and length', async () => {
    renderPage();
    const table = await screen.findByRole('table', { name: 'Lessons' });
    expect(within(table).getByText('Sharpening knives')).toBeInTheDocument();
    expect(within(table).getByText('Planting seeds')).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Cooking' })).toHaveAttribute(
      'href',
      '/admin/courses/course-Cooking',
    );
    expect(screen.getByText('2 lessons')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Lessons' })).toBeInTheDocument();
  });

  it('searches through the API and keeps the search in the address', async () => {
    renderPage();
    await screen.findByRole('table', { name: 'Lessons' });
    await userEvent
      .setup()
      .type(screen.getByRole('searchbox', { name: 'Search lessons' }), 'knife');
    await waitFor(() =>
      expect(lessonsService.getAllLessons).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'knife', page: 1 }),
        expect.anything(),
      ),
    );
  });

  it('starts from the course in the address', async () => {
    renderPage('/admin/lessons?courseId=course-Cooking');
    await screen.findByRole('table', { name: 'Lessons' });
    expect(lessonsService.getAllLessons).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'course-Cooking' }),
      expect.anything(),
    );
  });

  it('offers a course filter listing the courses by name', async () => {
    renderPage();
    await screen.findByRole('table', { name: 'Lessons' });
    expect(screen.getByRole('combobox', { name: 'Filter by course' })).toBeInTheDocument();
    expect(coursesService.getAllCourses).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 50, sortBy: 'title' }),
      expect.anything(),
    );
  });

  it('deletes a lesson only after confirming', async () => {
    vi.mocked(lessonsService.deleteLesson).mockResolvedValue({ data: undefined });
    renderPage();
    const user = userEvent.setup();
    await screen.findByRole('table', { name: 'Lessons' });

    await user.click(screen.getAllByRole('button', { name: 'Actions for Sharpening knives' })[0]!);
    await user.click(screen.getByRole('menuitem', { name: 'Delete lesson' }));
    expect(lessonsService.deleteLesson).not.toHaveBeenCalled();
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete lesson' }),
    );
    await waitFor(() => expect(lessonsService.deleteLesson).toHaveBeenCalledWith('l1'));
  });

  it('opens the edit form for the chosen lesson, in its own course', async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByRole('table', { name: 'Lessons' });

    await user.click(screen.getAllByRole('button', { name: 'Actions for Planting seeds' })[0]!);
    await user.click(screen.getByRole('menuitem', { name: 'Edit lesson' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/^Title/)).toHaveValue('Planting seeds');
  });

  it('says so, and points to Courses, when there are no lessons at all', async () => {
    vi.mocked(lessonsService.getAllLessons).mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('No lessons yet')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Go to courses' }).length).toBeGreaterThan(0);
  });

  it('offers to clear the filters when a search finds nothing', async () => {
    vi.mocked(lessonsService.getAllLessons).mockResolvedValue(page([]));
    renderPage('/admin/lessons?q=zzz');
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });
});

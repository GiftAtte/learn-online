import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConfirmProvider } from '@/components/feedback/confirm-dialog';
import type { CourseDetail } from '@/core/types/course.types';
import { CourseActions } from '@/components/courses/course-actions';
import { link, PATHS } from '@/router/paths';

const session = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('@/core/hooks/queries/use-auth', () => ({ useSession: () => session.current }));

const course = (overrides: Partial<CourseDetail> = {}) =>
  ({
    id: 'c1',
    enrolled: false,
    status: 'NOT_STARTED',
    completedLessons: 0,
    lessons: [{ id: 'l1', completed: false, lastPositionSeconds: 0 }],
    ...overrides,
  }) as CourseDetail;

const renderActions = (c: CourseDetail) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ConfirmProvider>
        <MemoryRouter>
          <CourseActions course={c} />
        </MemoryRouter>
      </ConfirmProvider>
    </QueryClientProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('CourseActions', () => {
  it('asks guests to sign in', () => {
    session.current = { user: null, isAdmin: false };
    renderActions(course());
    expect(screen.getByRole('link', { name: 'Sign in to enroll' })).toHaveAttribute(
      'href',
      PATHS.signIn,
    );
  });

  it('offers administrators course management instead of enrollment', () => {
    session.current = { user: { id: 'a' }, isAdmin: true };
    renderActions(course());
    expect(screen.getByRole('link', { name: 'Manage course' })).toHaveAttribute(
      'href',
      link(PATHS.admin.course, { courseId: 'c1' }),
    );
    expect(screen.queryByRole('button', { name: /enroll/i })).not.toBeInTheDocument();
  });

  it('enrolls a learner with a POST to the enroll endpoint', async () => {
    session.current = { user: { id: 'u' }, isAdmin: false };
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderActions(course());
    await userEvent.click(screen.getByRole('button', { name: 'Enroll in this course' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/courses/c1/enroll');
    expect(init.method).toBe('POST');
  });

  it('sends an enrolled learner to the first unfinished lesson', () => {
    session.current = { user: { id: 'u' }, isAdmin: false };
    renderActions(
      course({
        enrolled: true,
        completedLessons: 1,
        status: 'IN_PROGRESS',
        lessons: [
          { id: 'l1', completed: true, lastPositionSeconds: 0 },
          { id: 'l2', completed: false, lastPositionSeconds: 5 },
        ] as CourseDetail['lessons'],
      }),
    );
    expect(screen.getByRole('link', { name: 'Continue learning' })).toHaveAttribute(
      'href',
      link(PATHS.learner.lesson, { lessonId: 'l2' }),
    );
  });
});

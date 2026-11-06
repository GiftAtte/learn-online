import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyLearningPage from '@/pages/learner/my-learning-page';
import type { CourseSummary } from '@/core/types/course.types';

const state = vi.hoisted(() => ({ courses: [] as unknown[], resume: null as unknown }));

vi.mock('@/core/hooks/queries/use-enrollments', () => ({
  useGetAllMyCourses: () => ({
    data: state.courses,
    isPending: false,
    isError: false,
    isSuccess: true,
    status: 'success',
  }),
}));
vi.mock('@/core/hooks/queries/use-dashboard', () => ({
  useGetLearnerDashboard: () => ({ data: { continueLearning: state.resume } }),
}));

const course = (over: Partial<CourseSummary>): CourseSummary => ({
  id: over.title ?? 'c',
  title: 'Course',
  description: 'About the course',
  thumbnailUrl: null,
  published: true,
  category: { id: 'k', name: 'Programming' },
  lessonCount: 4,
  totalDurationSeconds: 1200,
  completedLessons: 0,
  progressPercent: 0,
  status: 'NOT_STARTED',
  ...over,
});

const mine = [
  course({ title: 'Done Course', status: 'COMPLETED', completedLessons: 4, progressPercent: 100 }),
  course({ title: 'Fresh Course', status: 'NOT_STARTED' }),
  course({ title: 'Half Course', status: 'IN_PROGRESS', completedLessons: 2, progressPercent: 50 }),
];

const renderPage = (path = '/learner/my-learning') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <MyLearningPage />
    </MemoryRouter>,
  );

const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('my learning page', () => {
  beforeEach(() => {
    state.courses = mine;
    state.resume = null;
  });

  it('puts what you are in the middle of first, then not started, then finished', () => {
    renderPage();
    expect(titles()).toEqual(['Half Course', 'Fresh Course', 'Done Course']);
  });

  it('says where you are and what to do next on each course', () => {
    renderPage();
    const half = screen.getByRole('link', { name: 'Half Course' }).closest('li')!;
    expect(within(half).getByText('2 of 4 lessons done')).toBeInTheDocument();
    expect(within(half).getByText('2 lessons to go')).toBeInTheDocument();
    expect(within(half).getByText('Continue')).toBeInTheDocument();

    const fresh = screen.getByRole('link', { name: 'Fresh Course' }).closest('li')!;
    expect(within(fresh).getByText('Start course')).toBeInTheDocument();
    const done = screen.getByRole('link', { name: 'Done Course' }).closest('li')!;
    expect(within(done).getByText('All lessons finished')).toBeInTheDocument();
    expect(within(done).getByText('Review')).toBeInTheDocument();
  });

  it('counts each progress tab and filters by it', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole('tab', { name: /^Alls*3/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^In progresss*1/ })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Completed/ }));
    expect(titles()).toEqual(['Done Course']);
  });

  it('searches by title, and offers a way back when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByRole('searchbox', { name: 'Search my courses' }), 'fresh');
    expect(titles()).toEqual(['Fresh Course']);

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('No matches')).toBeInTheDocument();
    // The search box has its own clear button; the empty state's is the last one.
    await user.click(screen.getAllByRole('button', { name: 'Clear search' }).at(-1)!);
    expect(titles()).toHaveLength(3);
  });

  it('opens on the filter and sort named in the address', () => {
    renderPage('/learner/my-learning?status=NOT_STARTED&sort=title');
    expect(titles()).toEqual(['Fresh Course']);
  });

  it('offers to resume the lesson you were on', () => {
    state.resume = {
      lessonId: 'l1',
      lessonTitle: 'Type Narrowing',
      courseId: 'c',
      courseTitle: 'Half Course',
      lastPositionSeconds: 10,
      durationSeconds: 30,
    };
    renderPage();
    expect(screen.getByRole('link', { name: /Resume lesson/ })).toHaveAttribute(
      'href',
      '/learner/lessons/l1',
    );
  });

  it('invites a learner with no courses to browse the catalog', () => {
    state.courses = [];
    renderPage();
    expect(screen.getByRole('link', { name: 'Browse courses' })).toHaveAttribute(
      'href',
      '/learner/catalog',
    );
  });
});

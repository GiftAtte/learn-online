import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseCard } from '@/components/courses/course-card';
import type { CourseSummary } from '@/core/types/course.types';

const course = (overrides: Partial<CourseSummary> = {}): CourseSummary => ({
  id: 'c1',
  title: 'TypeScript for Professionals',
  description: 'Types, generics and narrowing.',
  thumbnailUrl: null,
  published: true,
  category: { id: 'cat1', name: 'Programming' },
  lessonCount: 4,
  totalDurationSeconds: 2400,
  completedLessons: 0,
  progressPercent: 0,
  status: 'NOT_STARTED',
  ...overrides,
});

const renderCard = (c: CourseSummary) =>
  render(
    <MemoryRouter>
      <CourseCard course={c} to="/courses/c1" />
    </MemoryRouter>,
  );

describe('CourseCard progress indicator', () => {
  it('shows an empty progress bar and "Not enrolled" when the learner has not enrolled', () => {
    renderCard(course());
    const bar = screen.getByRole('progressbar', {
      name: 'TypeScript for Professionals: not enrolled',
    });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('Not enrolled')).toBeInTheDocument();
    expect(screen.getByText('0 of 4 done')).toBeInTheDocument();
  });

  it('shows the real progress, status and lesson count once enrolled', () => {
    renderCard(
      course({ enrolled: true, status: 'IN_PROGRESS', completedLessons: 1, progressPercent: 25 }),
    );
    const bar = screen.getByRole('progressbar', { name: 'TypeScript for Professionals progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('1 of 4 done')).toBeInTheDocument();
    expect(screen.queryByText('Not enrolled')).not.toBeInTheDocument();
  });

  it('still shows title, category, description and duration', () => {
    renderCard(course());
    expect(screen.getByRole('link', { name: 'TypeScript for Professionals' })).toHaveAttribute(
      'href',
      '/courses/c1',
    );
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('Types, generics and narrowing.')).toBeInTheDocument();
    expect(screen.getByText('4 lessons')).toBeInTheDocument();
  });
});

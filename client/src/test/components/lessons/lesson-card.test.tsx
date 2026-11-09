import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LessonPath } from '@/components/lessons/lesson-path';
import type { LessonSummary } from '@/core/types/lesson.types';

const lesson = (
  id: string,
  order: number,
  overrides: Partial<LessonSummary> = {},
): LessonSummary => ({
  id,
  title: `Lesson ${order}`,
  order,
  durationSeconds: 300,
  thumbnailUrl: null,
  completed: false,
  lastPositionSeconds: 0,
  progressPercent: 0,
  ...overrides,
});

const lessons = [
  lesson('a', 1, { completed: true, progressPercent: 100, lastPositionSeconds: 300 }),
  lesson('b', 2, { lastPositionSeconds: 90, progressPercent: 30 }),
  lesson('c', 3),
  lesson('d', 4),
];

const renderPath = (props: { currentId?: string; nextId?: string | null; locked?: boolean }) =>
  render(
    <MemoryRouter>
      <LessonPath lessons={lessons} compact {...props} />
    </MemoryRouter>,
  );

describe('lesson cards beside the video', () => {
  it('gives every lesson a visible status', () => {
    renderPath({ currentId: 'b', nextId: 'c' });
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('30% watched')).toBeInTheDocument();
    expect(screen.getByText('Up next')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('labels only the next lesson "Up next", and only until it is started', () => {
    renderPath({ currentId: 'a', nextId: 'c' });
    const next = screen.getByRole('link', { name: /Lesson 3/ });
    expect(next).toHaveTextContent('Up next');
    expect(screen.getByRole('link', { name: /Lesson 4/ })).toHaveTextContent('Not started');
    expect(screen.getAllByText('Up next')).toHaveLength(1);
  });

  it('shows progress, not "Up next", on a next lesson that is already started', () => {
    renderPath({ currentId: 'a', nextId: 'b' });
    expect(screen.getByRole('link', { name: /Lesson 2/ })).toHaveTextContent('30% watched');
    expect(screen.queryByText('Up next')).not.toBeInTheDocument();
  });

  it('shows "Enroll to unlock" instead of a status when the course is locked', () => {
    renderPath({ locked: true });
    expect(screen.getAllByText('Enroll to unlock').length).toBeGreaterThan(0);
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from 'vitest';
import {
  courseStats,
  courseStatus,
  lessonProgressView,
  percent,
} from '../src/modules/progress/progress.helpers';
import { paginated } from '../src/utils/pagination';

describe('percent', () => {
  it('rounds and caps at 100', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 3)).toBe(100);
  });
  it('returns 0 when there is nothing to complete', () => {
    expect(percent(0, 0)).toBe(0);
  });
});

describe('courseStatus', () => {
  it.each([
    [0, 3, 'NOT_STARTED'],
    [1, 3, 'IN_PROGRESS'],
    [3, 3, 'COMPLETED'],
    [0, 0, 'NOT_STARTED'],
  ])('%i of %i lessons -> %s', (done, total, expected) => {
    expect(courseStatus(done, total)).toBe(expected);
  });
});

describe('courseStats', () => {
  it('aggregates duration, counts and progress', () => {
    const stats = courseStats([{ durationSeconds: 60 }, { durationSeconds: 40 }], 1);
    expect(stats).toEqual({
      lessonCount: 2,
      totalDurationSeconds: 100,
      completedLessons: 1,
      progressPercent: 50,
      status: 'IN_PROGRESS',
    });
  });
});

describe('lessonProgressView', () => {
  it('defaults to untouched', () => {
    expect(lessonProgressView(100)).toEqual({ completed: false, lastPositionSeconds: 0, progressPercent: 0 });
  });
  it('reports 100% when completed regardless of position', () => {
    expect(lessonProgressView(100, { completed: true, lastPositionSeconds: 10 }).progressPercent).toBe(100);
  });
  it('derives percent from the resume position', () => {
    expect(lessonProgressView(200, { completed: false, lastPositionSeconds: 50 }).progressPercent).toBe(25);
  });
});

describe('paginated', () => {
  it('computes meta and at least one page', () => {
    expect(paginated([], { page: 1, pageSize: 10 }, 0).meta.totalPages).toBe(1);
    expect(paginated([1], { page: 2, pageSize: 10 }, 25).meta).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });
});

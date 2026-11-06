import { formatClock, formatDuration, initialsOf, pluralize } from '@/core/lib/format';

describe('formatDuration', () => {
  it.each([
    [10, '1 min'],
    [125, '2 min'],
    [3600, '1 h'],
    [3900, '1 h 5 min'],
  ])('%i seconds -> %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatClock', () => {
  it.each([
    [0, '0:00'],
    [75, '1:15'],
    [3725, '1:02:05'],
    [Number.NaN, '0:00'],
  ])('%s -> %s', (seconds, expected) => {
    expect(formatClock(seconds)).toBe(expected);
  });
});

describe('small helpers', () => {
  it('pluralizes', () => {
    expect(pluralize(1, 'lesson')).toBe('1 lesson');
    expect(pluralize(3, 'lesson')).toBe('3 lessons');
  });
  it('builds initials from the first two words', () => {
    expect(initialsOf('leo learner')).toBe('LL');
    expect(initialsOf('  Ada  ')).toBe('A');
  });
});

import { prisma } from '../../db/prisma';

export const percent = (done: number, total: number) =>
  total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));

type CourseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export const courseStatus = (done: number, total: number): CourseStatus =>
  total > 0 && done >= total ? 'COMPLETED' : done > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

/** Aggregate figures shown on every course card. Single source of truth. */
export const courseStats = (lessons: { durationSeconds: number }[], completedLessons: number) => ({
  lessonCount: lessons.length,
  totalDurationSeconds: lessons.reduce((sum, l) => sum + l.durationSeconds, 0),
  completedLessons,
  progressPercent: percent(completedLessons, lessons.length),
  status: courseStatus(completedLessons, lessons.length),
});

interface ProgressFields {
  completed: boolean;
  lastPositionSeconds: number;
}

/** Per-lesson progress fields shown on every lesson card. Single source of truth. */
export const lessonProgressView = (durationSeconds: number, p?: ProgressFields) => ({
  completed: p?.completed ?? false,
  lastPositionSeconds: p?.lastPositionSeconds ?? 0,
  progressPercent: p?.completed ? 100 : percent(p?.lastPositionSeconds ?? 0, durationSeconds),
});

/** Adds one learner's progress (completed, resume position, percent) to each lesson. */
export const withLessonProgress = <L extends { id: string; durationSeconds: number }>(
  lessons: L[],
  progress: (ProgressFields & { lessonId: string })[],
) => {
  const byLesson = new Map(progress.map((p) => [p.lessonId, p]));
  return lessons.map((lesson) => ({
    ...lesson,
    ...lessonProgressView(lesson.durationSeconds, byLesson.get(lesson.id)),
  }));
};

/** How many of the given lessons appear in `completedIds`. */
export const countCompleted = (lessons: { id: string }[], completedIds: Set<string>) =>
  lessons.filter((l) => completedIds.has(l.id)).length;

/** Number of completed lessons per course for one user. */
export const completedLessonsByCourse = async (userId: string, courseIds: string[]) => {
  const counts = new Map<string, number>();
  if (courseIds.length === 0) return counts;

  const rows = await prisma.lessonProgress.findMany({
    where: { userId, completed: true, lesson: { courseId: { in: courseIds } } },
    select: { lesson: { select: { courseId: true } } },
  });
  for (const { lesson } of rows) counts.set(lesson.courseId, (counts.get(lesson.courseId) ?? 0) + 1);
  return counts;
};

import { prisma } from '../../db/prisma';
import type { Viewer } from '../../types/viewer';
import { AppError } from '../../utils/AppError';
import { isEnrolled } from '../enrollments/enrollments.service';
import { getAccessibleLesson } from '../lessons/lessons.service';
import type { SaveProgressInput } from './progress.schemas';

/** Watching at least this fraction of a lesson counts as completing it. */
export const AUTO_COMPLETE_RATIO = 0.95;

const view = (
  lessonId: string,
  p?: { lastPositionSeconds: number; completed: boolean; completedAt: Date | null },
) => ({
  lessonId,
  lastPositionSeconds: p?.lastPositionSeconds ?? 0,
  completed: p?.completed ?? false,
  completedAt: p?.completedAt ?? null,
});

const key = (userId: string, lessonId: string) => ({ userId_lessonId: { userId, lessonId } });

export const getProgress = async (lessonId: string, viewer: Viewer) => {
  await getAccessibleLesson(lessonId, viewer);
  return view(
    lessonId,
    (await prisma.lessonProgress.findUnique({ where: key(viewer.id, lessonId) })) ?? undefined,
  );
};

/**
 * Called by the player periodically and on `ended`. Rules:
 *  - only enrolled learners in a published course can record progress
 *  - the position is clamped to the lesson length (never trust the client)
 *  - the lesson completes on the `ended` event or once 95% has been watched
 *  - completion is sticky: re-watching moves the resume point but never un-completes
 */
export const saveProgress = async (lessonId: string, viewer: Viewer, input: SaveProgressInput) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { published: true } } },
  });
  if (!lesson || !lesson.course.published) throw AppError.notFound('Lesson not found');
  if (!(await isEnrolled(viewer.id, lesson.courseId))) {
    throw AppError.forbidden('Enroll in this course to track progress');
  }

  const position = Math.min(Math.floor(input.positionSeconds), lesson.durationSeconds);
  const reachedEnd = input.completed === true || position >= lesson.durationSeconds * AUTO_COMPLETE_RATIO;

  const existing = await prisma.lessonProgress.findUnique({ where: key(viewer.id, lessonId) });
  // Completion is sticky: re-watching never un-completes a lesson.
  const completed = !!existing?.completed || reachedEnd;
  const completedAt = existing?.completedAt ?? (completed ? new Date() : null);

  // Upsert on the (userId, lessonId) unique key so concurrent saves can't create duplicates.
  const data = { lastPositionSeconds: position, completed, completedAt };
  return view(
    lessonId,
    await prisma.lessonProgress.upsert({
      where: key(viewer.id, lessonId),
      create: { userId: viewer.id, lessonId, ...data },
      update: data,
    }),
  );
};

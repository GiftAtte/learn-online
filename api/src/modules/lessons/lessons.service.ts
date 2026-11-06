import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import type { Viewer } from '../../types/viewer';
import { AppError } from '../../utils/AppError';
import { categorySelect } from '../categories/categories.service';
import { isEnrolled } from '../enrollments/enrollments.service';
import { percent, withLessonProgress } from '../progress/progress.helpers';
import type { CreateLessonInput, UpdateLessonInput } from './lessons.schemas';

/**
 * The single access rule for watching a lesson:
 *  - admins can always view (for previewing/moderating)
 *  - learners need the course to be published AND to be enrolled
 * Throws 404 when missing/hidden and 403 when the learner just needs to enroll.
 */
export const getAccessibleLesson = async (lessonId: string, viewer: Viewer) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { category: categorySelect } } },
  });
  if (!lesson) throw AppError.notFound('Lesson not found');
  if (viewer.role === 'ADMIN') return lesson;

  if (!lesson.course.published) throw AppError.notFound('Lesson not found');
  if (!(await isEnrolled(viewer.id, lesson.courseId))) {
    throw AppError.forbidden('Enroll in this course to watch its lessons');
  }
  return lesson;
};

/**
 * Everything the lesson page needs in one call: the lesson, plus sibling lessons with status
 * (for the "up next" cards) and previous/next ids for navigation.
 */
export const getLessonDetail = async (lessonId: string, viewer: Viewer) => {
  const { course, ...lesson } = await getAccessibleLesson(lessonId, viewer);

  const [siblings, progress] = await Promise.all([
    prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true, durationSeconds: true },
    }),
    prisma.lessonProgress.findMany({ where: { userId: viewer.id, lesson: { courseId: lesson.courseId } } }),
  ]);

  const lessons = withLessonProgress(siblings, progress);
  const index = lessons.findIndex((l) => l.id === lessonId);

  return {
    // The sibling entry for this lesson supplies its progress fields.
    lesson: { ...lesson, ...lessons[index] },
    course: { id: course.id, title: course.title, category: course.category },
    lessons,
    previousLessonId: lessons[index - 1]?.id ?? null,
    nextLessonId: lessons[index + 1]?.id ?? null,
    courseProgressPercent: percent(lessons.filter((l) => l.completed).length, lessons.length),
  };
};

const assertCourseExists = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw AppError.notFound('Course not found');
};

/** Next free position at the end of a course. */
const nextOrder = async (courseId: string) => {
  const { _max } = await prisma.lesson.aggregate({ where: { courseId }, _max: { order: true } });
  return (_max.order ?? 0) + 1;
};

export const createLesson = async (courseId: string, input: CreateLessonInput) => {
  await assertCourseExists(courseId);
  const order = input.order ?? (await nextOrder(courseId));
  return prisma.lesson.create({ data: { ...input, order, courseId } });
};

export const updateLesson = (lessonId: string, input: UpdateLessonInput) =>
  prisma.lesson.update({ where: { id: lessonId }, data: input });

/** Deletes a lesson and closes the gap so the remaining lessons stay numbered 1..n. */
export const deleteLesson = async (lessonId: string) => {
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.lesson.delete({ where: { id: lessonId } });
    const later = await tx.lesson.findMany({
      where: { courseId: deleted.courseId, order: { gt: deleted.order } },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    await setOrders(
      tx,
      later.map((l) => l.id),
      deleted.order,
    );
  });
};

/** Gives the lessons consecutive positions starting at `start`, in the order of `ids`. */
const setOrders = async (tx: Prisma.TransactionClient, ids: string[], start = 1) => {
  for (const [i, id] of ids.entries()) {
    await tx.lesson.update({ where: { id }, data: { order: start + i } });
  }
};

/** True when `given` contains exactly the `expected` ids, each once. */
const isExactSet = (expected: string[], given: string[]) =>
  expected.length === given.length &&
  new Set(given).size === given.length &&
  expected.every((id) => given.includes(id));

export const reorderLessons = async (courseId: string, lessonIds: string[]) => {
  await assertCourseExists(courseId);
  const existing = await prisma.lesson.findMany({ where: { courseId }, select: { id: true } });
  if (
    !isExactSet(
      existing.map((l) => l.id),
      lessonIds,
    )
  ) {
    throw AppError.badRequest('lessonIds must contain every lesson of the course exactly once');
  }

  await prisma.$transaction(async (tx) => {
    // Two passes avoid violating the (courseId, order) unique constraint mid-update:
    // first park everything at unused negative positions, then assign the final 1..n.
    for (const [i, id] of lessonIds.entries()) {
      await tx.lesson.update({ where: { id }, data: { order: -(i + 1) } });
    }
    await setOrders(tx, lessonIds);
  });
  return prisma.lesson.findMany({ where: { courseId }, orderBy: { order: 'asc' } });
};

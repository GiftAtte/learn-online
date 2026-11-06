import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/AppError';
import { categorySelect } from '../categories/categories.service';
import { completedLessonsByCourse, courseStats } from '../progress/progress.helpers';

const key = (userId: string, courseId: string) => ({ userId_courseId: { userId, courseId } });

export const isEnrolled = async (userId: string, courseId: string) =>
  !!(await prisma.enrollment.findUnique({ where: key(userId, courseId), select: { id: true } }));

export const enroll = async (userId: string, courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) throw AppError.notFound('Course not found');

  const existing = await prisma.enrollment.findUnique({ where: key(userId, courseId) });
  if (existing) return { enrollment: existing, created: false };

  try {
    return { enrollment: await prisma.enrollment.create({ data: { userId, courseId } }), created: true };
  } catch (err) {
    // Lost a race with a concurrent request: the unique constraint guarantees a single row.
    const again = await prisma.enrollment.findUnique({ where: key(userId, courseId) });
    if (again) return { enrollment: again, created: false };
    throw err;
  }
};

export const unenroll = async (userId: string, courseId: string) => {
  const { count } = await prisma.enrollment.deleteMany({ where: { userId, courseId } });
  if (count === 0) throw AppError.notFound('You are not enrolled in this course');
  // Progress is intentionally kept so re-enrolling restores the learner's position.
};

export const listMine = async (userId: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: { include: { category: categorySelect, lessons: { select: { durationSeconds: true } } } },
    },
  });
  const completed = await completedLessonsByCourse(
    userId,
    enrollments.map((e) => e.courseId),
  );

  return enrollments.map(({ course: { lessons, ...course }, enrolledAt }) => ({
    ...course,
    enrolledAt,
    enrolled: true,
    ...courseStats(lessons, completed.get(course.id) ?? 0),
  }));
};

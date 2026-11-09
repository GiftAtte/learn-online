import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/AppError';
import { pageArgs, paginated } from '../../utils/pagination';
import { categorySelect } from '../categories/categories.service';
import { countCompleted, courseStats, percent } from '../progress/progress.helpers';
import type { AdminLearnersQuery } from './dashboard.schemas';

const sum = (numbers: number[]) => numbers.reduce((total, n) => total + n, 0);

/* ----------------------------------------------------------------------------------------------
 * Learner dashboard
 * -------------------------------------------------------------------------------------------- */

const fetchEnrollments = (userId: string) =>
  prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: { category: categorySelect, lessons: { select: { id: true, durationSeconds: true } } },
      },
    },
  });

/** All of the learner's lesson progress, most recently touched first. */
const fetchProgress = (userId: string) =>
  prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { lesson: { include: { course: { select: { id: true, title: true } } } } },
  });

type ProgressEntry = Awaited<ReturnType<typeof fetchProgress>>[number];

/** The lesson/course names shown next to a progress entry. */
const lessonRef = (p: ProgressEntry) => ({
  lessonId: p.lessonId,
  lessonTitle: p.lesson.title,
  courseId: p.lesson.course.id,
  courseTitle: p.lesson.course.title,
  thumbnailUrl: p.lesson.thumbnailUrl,
  videoUrl: p.lesson.videoUrl,
  durationSeconds: p.lesson.durationSeconds,
  lastPositionSeconds: p.lastPositionSeconds,
});

interface CourseCard {
  status: string;
  lessonCount: number;
  completedLessons: number;
}

const learnerSummary = (courses: CourseCard[], progress: ProgressEntry[]) => {
  const secondsWatched = sum(
    progress.map((p) => (p.completed ? p.lesson.durationSeconds : p.lastPositionSeconds)),
  );
  return {
    enrolledCourses: courses.length,
    inProgressCourses: courses.filter((c) => c.status === 'IN_PROGRESS').length,
    completedCourses: courses.filter((c) => c.status === 'COMPLETED').length,
    completedLessons: progress.filter((p) => p.completed).length,
    minutesWatched: Math.round(secondsWatched / 60),
    overallProgressPercent: percent(
      sum(courses.map((c) => c.completedLessons)),
      sum(courses.map((c) => c.lessonCount)),
    ),
  };
};

/** Learner home: headline numbers, the lesson to resume, per-course progress and recent activity. */
export const learnerDashboard = async (userId: string) => {
  const [enrollments, progress] = await Promise.all([fetchEnrollments(userId), fetchProgress(userId)]);

  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const courses = enrollments.map(({ course: { lessons, ...c } }) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    thumbnailUrl: c.thumbnailUrl,
    ...courseStats(lessons, countCompleted(lessons, completedIds)),
  }));

  // Progress is kept after unenrolling, so only count lessons from courses the learner is still in.
  const enrolledLessonIds = new Set(enrollments.flatMap((e) => e.course.lessons.map((l) => l.id)));
  const current = progress.filter((p) => enrolledLessonIds.has(p.lessonId));
  // Most recently touched lesson that isn't finished yet.
  const resume = current.find((p) => !p.completed);

  return {
    summary: learnerSummary(courses, current),
    continueLearning: resume
      ? { ...lessonRef(resume), durationSeconds: resume.lesson.durationSeconds }
      : null,
    courses,
    recentActivity: progress
      .slice(0, 8)
      .map((p) => ({ ...lessonRef(p), completed: p.completed, updatedAt: p.updatedAt })),
  };
};

/* ----------------------------------------------------------------------------------------------
 * Admin dashboard
 * -------------------------------------------------------------------------------------------- */

const completionKey = (userId: string, courseId: string) => `${userId}:${courseId}`;

/** Lessons finished per learner per course, keyed by `completionKey`. */
const countCompletions = (rows: { userId: string; lesson: { courseId: string } }[]) => {
  const counts = new Map<string, number>();
  for (const { userId, lesson } of rows) {
    const key = completionKey(userId, lesson.courseId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

/** Learner ids enrolled in each course. */
const groupLearnersByCourse = (enrollments: { userId: string; courseId: string }[]) => {
  const byCourse = new Map<string, string[]>();
  for (const { userId, courseId } of enrollments) {
    byCourse.set(courseId, [...(byCourse.get(courseId) ?? []), userId]);
  }
  return byCourse;
};

/**
 * Admin overview. Completion is computed in memory from a few bulk queries, which is simple and fine
 * at this scale; for large datasets this should move to SQL aggregates (GROUP BY).
 */
export const adminDashboard = async () => {
  const [learners, courses, lessonCount, enrollments, completions, recent] = await Promise.all([
    prisma.user.count({ where: { role: 'LEARNER' } }),
    prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: categorySelect,
        lessons: { select: { id: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.lesson.count(),
    prisma.enrollment.findMany({ select: { userId: true, courseId: true } }),
    prisma.lessonProgress.findMany({
      where: { completed: true },
      select: { userId: true, lesson: { select: { courseId: true } } },
    }),
    prisma.enrollment.findMany({
      orderBy: { enrolledAt: 'desc' },
      take: 8,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    }),
  ]);

  const completedBy = countCompletions(completions);
  const learnersByCourse = groupLearnersByCourse(enrollments);

  const perCourse = courses.map((course) => {
    const lessonTotal = course.lessons.length;
    // Lessons finished by each enrolled learner; they've completed the course at `lessonTotal`.
    const doneCounts = (learnersByCourse.get(course.id) ?? []).map(
      (userId) => completedBy.get(completionKey(userId, course.id)) ?? 0,
    );
    const completedLearners = lessonTotal > 0 ? doneCounts.filter((n) => n >= lessonTotal).length : 0;

    return {
      id: course.id,
      title: course.title,
      category: course.category,
      thumbnailUrl: course.thumbnailUrl,
      published: course.published,
      lessonCount: lessonTotal,
      enrollmentCount: course._count.enrollments,
      completedLearners,
      completionRate: percent(completedLearners, doneCounts.length),
      averageProgressPercent: percent(sum(doneCounts), lessonTotal * doneCounts.length),
    };
  });

  return {
    summary: {
      learners,
      courses: courses.length,
      publishedCourses: courses.filter((c) => c.published).length,
      lessons: lessonCount,
      enrollments: enrollments.length,
      completionRate: percent(sum(perCourse.map((c) => c.completedLearners)), enrollments.length),
    },
    courses: perCourse,
    recentEnrollments: recent.map(({ enrolledAt, user, course }) => ({ enrolledAt, user, course })),
  };
};

/** Paginated learners (searchable by name or email, sortable) with their progress in each enrolled course. */
export const adminLearners = async (query: AdminLearnersQuery) => {
  const where: Prisma.UserWhereInput = {
    role: 'LEARNER',
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ],
    }),
    ...(query.enrolled && {
      enrollments: query.enrolled === 'yes' ? { some: {} } : { none: {} },
    }),
  };
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      // Newest first as the tie-breaker keeps paging stable when names match.
      orderBy: [{ [query.sortBy]: query.sortDir }, { createdAt: 'desc' }],
      ...pageArgs(query),
      include: {
        enrollments: { include: { course: { include: { lessons: { select: { id: true } } } } } },
        progress: { where: { completed: true }, select: { lessonId: true } },
      },
    }),
  ]);

  const items = users.map((user) => {
    const completedIds = new Set(user.progress.map((p) => p.lessonId));
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      joinedAt: user.createdAt,
      courses: user.enrollments.map(({ course }) => {
        const done = countCompleted(course.lessons, completedIds);
        return {
          courseId: course.id,
          title: course.title,
          completedLessons: done,
          lessonCount: course.lessons.length,
          progressPercent: percent(done, course.lessons.length),
        };
      }),
    };
  });
  return paginated(items, query, total);
};

/** One learner in full: every enrolled course with the status of each lesson (admin drill-down). */
export const adminLearnerDetail = async (learnerId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: learnerId },
    include: {
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            include: { category: categorySelect, lessons: { orderBy: { order: 'asc' } } },
          },
        },
      },
      progress: true,
    },
  });
  if (!user) throw AppError.notFound('Learner not found');

  const progressByLesson = new Map(user.progress.map((p) => [p.lessonId, p]));
  const courses = user.enrollments.map(({ enrolledAt, course }) => {
    const lessons = course.lessons.map((lesson) => {
      const p = progressByLesson.get(lesson.id);
      return {
        lessonId: lesson.id,
        title: lesson.title,
        order: lesson.order,
        durationSeconds: lesson.durationSeconds,
        lastPositionSeconds: p?.lastPositionSeconds ?? 0,
        completed: p?.completed ?? false,
        completedAt: p?.completedAt ?? null,
        lastActivityAt: p?.updatedAt ?? null,
      };
    });
    const done = lessons.filter((l) => l.completed).length;
    return {
      courseId: course.id,
      title: course.title,
      category: course.category,
      enrolledAt,
      ...courseStats(lessons, done),
      lessons,
    };
  });

  const watchedSeconds = sum(
    courses.flatMap((c) => c.lessons).map((l) => (l.completed ? l.durationSeconds : l.lastPositionSeconds)),
  );
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    joinedAt: user.createdAt,
    summary: {
      enrolledCourses: courses.length,
      completedCourses: courses.filter((c) => c.status === 'COMPLETED').length,
      completedLessons: sum(courses.map((c) => c.completedLessons)),
      minutesWatched: Math.round(watchedSeconds / 60),
    },
    courses,
  };
};

/**
 * One course's full activity (admin drill-down): headline numbers, how many learners finished each
 * lesson, and every enrolled learner with their progress and last activity.
 */
export const adminCourseActivity = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: categorySelect,
      lessons: { orderBy: { order: 'asc' } },
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!course) throw AppError.notFound('Course not found');

  const learnerIds = course.enrollments.map((e) => e.userId);
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: { in: learnerIds }, lessonId: { in: course.lessons.map((l) => l.id) } },
  });
  const byLearner = new Map<string, typeof progress>();
  for (const p of progress) byLearner.set(p.userId, [...(byLearner.get(p.userId) ?? []), p]);

  const learners = course.enrollments.map(({ enrolledAt, user }) => {
    const mine = byLearner.get(user.id) ?? [];
    const done = mine.filter((p) => p.completed).length;
    const last = mine.reduce<Date | null>((m, p) => (!m || p.updatedAt > m ? p.updatedAt : m), null);
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      enrolledAt,
      lastActivityAt: last,
      ...courseStats(course.lessons, done),
    };
  });

  const lessons = course.lessons.map((lesson) => {
    const rows = progress.filter((p) => p.lessonId === lesson.id);
    return {
      lessonId: lesson.id,
      title: lesson.title,
      order: lesson.order,
      durationSeconds: lesson.durationSeconds,
      completedLearners: rows.filter((p) => p.completed).length,
      startedLearners: rows.filter((p) => !p.completed && p.lastPositionSeconds > 0).length,
    };
  });

  const completed = learners.filter((l) => l.status === 'COMPLETED').length;
  return {
    course: {
      id: course.id,
      title: course.title,
      category: course.category,
      published: course.published,
      lessonCount: course.lessons.length,
      totalDurationSeconds: sum(course.lessons.map((l) => l.durationSeconds)),
    },
    summary: {
      enrolled: learners.length,
      completed,
      inProgress: learners.filter((l) => l.status === 'IN_PROGRESS').length,
      notStarted: learners.filter((l) => l.status === 'NOT_STARTED').length,
      completionRate: percent(completed, learners.length),
      averageProgressPercent: percent(
        sum(learners.map((l) => l.completedLessons)),
        course.lessons.length * learners.length,
      ),
    },
    lessons,
    learners,
  };
};

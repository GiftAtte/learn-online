import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import type { Viewer } from '../../types/viewer';
import { AppError } from '../../utils/AppError';
import { pageArgs, paginated } from '../../utils/pagination';
import { assertCategoryExists, categorySelect } from '../categories/categories.service';
import { isEnrolled } from '../enrollments/enrollments.service';
import { completedLessonsByCourse, courseStats, withLessonProgress } from '../progress/progress.helpers';
import type { CreateCourseInput, ListCoursesQuery, UpdateCourseInput } from './courses.schemas';

const isAdmin = (viewer?: Viewer) => viewer?.role === 'ADMIN';

/** Catalog filter. Non-admins only see published courses; each optional filter is added only if given. */
const catalogFilter = (query: ListCoursesQuery, viewer?: Viewer): Prisma.CourseWhereInput => ({
  // Non-admins only see published courses; admins may narrow by status.
  ...(isAdmin(viewer) ? query.status && { published: query.status === 'published' } : { published: true }),
  ...(query.categoryId && { categoryId: query.categoryId }),
  ...(query.q && {
    OR: [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ],
  }),
});

/** Sort order for the list. Newest first is the tie-breaker so paging stays stable. */
const courseOrderBy = ({ sortBy, sortDir }: ListCoursesQuery): Prisma.CourseOrderByWithRelationInput[] => {
  const primary: Record<ListCoursesQuery['sortBy'], Prisma.CourseOrderByWithRelationInput> = {
    createdAt: { createdAt: sortDir },
    title: { title: sortDir },
    learners: { enrollments: { _count: sortDir } },
    lessons: { lessons: { _count: sortDir } },
  };
  return [primary[sortBy], { createdAt: 'desc' }];
};

/**
 * The viewer's enrollments and completed-lesson counts for a page of courses.
 * Two queries for the whole page (not one per course) to avoid N+1.
 */
const viewerCourseState = async (courseIds: string[], viewer?: Viewer) => {
  if (!viewer) return { enrolledIds: new Set<string>(), completed: new Map<string, number>() };

  const [completed, enrollments] = await Promise.all([
    completedLessonsByCourse(viewer.id, courseIds),
    prisma.enrollment.findMany({
      where: { userId: viewer.id, courseId: { in: courseIds } },
      select: { courseId: true },
    }),
  ]);
  return { enrolledIds: new Set(enrollments.map((e) => e.courseId)), completed };
};

/**
 * Paginated catalog. When a viewer is given, each card also carries their enrollment flag and progress.
 */
export const listCourses = async (query: ListCoursesQuery, viewer?: Viewer) => {
  const where = catalogFilter(query, viewer);

  // Count and page in one transaction so `total` matches the returned page.
  const [total, courses] = await prisma.$transaction([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      orderBy: courseOrderBy(query),
      ...pageArgs(query),
      include: {
        category: categorySelect,
        lessons: { select: { durationSeconds: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  const { enrolledIds, completed } = await viewerCourseState(
    courses.map((c) => c.id),
    viewer,
  );

  const items = courses.map(({ lessons, _count, ...course }) => ({
    ...course,
    enrollmentCount: _count.enrollments,
    enrolled: enrolledIds.has(course.id),
    ...courseStats(lessons, completed.get(course.id) ?? 0),
  }));
  return paginated(items, query, total);
};

/**
 * Course detail with its ordered lessons and the viewer's progress on each.
 * Drafts are reported as 404 (not 403) to non-admins so their existence isn't leaked.
 */
export const getCourse = async (courseId: string, viewer?: Viewer) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { category: categorySelect, lessons: { orderBy: { order: 'asc' } } },
  });
  if (!course || (!course.published && !isAdmin(viewer))) throw AppError.notFound('Course not found');

  const [enrolled, progress] = viewer
    ? await Promise.all([
        isEnrolled(viewer.id, courseId),
        prisma.lessonProgress.findMany({ where: { userId: viewer.id, lesson: { courseId } } }),
      ])
    : [false, []];
  const canWatch = enrolled || isAdmin(viewer);

  // The video URL is only exposed to enrolled learners and admins.
  const lessons = withLessonProgress(course.lessons, progress).map(({ videoUrl, ...lesson }) =>
    canWatch ? { ...lesson, videoUrl } : lesson,
  );

  const { lessons: rawLessons, ...fields } = course;
  return {
    ...fields,
    enrolled,
    ...courseStats(rawLessons, lessons.filter((l) => l.completed).length),
    lessons,
  };
};

export const createCourse = async (input: CreateCourseInput) => {
  await assertCategoryExists(input.categoryId);
  return prisma.course.create({ data: input, include: { category: categorySelect } });
};

/** Business rule: an empty course can't be published, so learners never land on one with nothing to watch. */
const assertPublishable = async (courseId: string) => {
  if ((await prisma.lesson.count({ where: { courseId } })) === 0) {
    throw AppError.badRequest('Add at least one lesson before publishing a course');
  }
};

export const updateCourse = async (courseId: string, input: UpdateCourseInput) => {
  if (input.published) await assertPublishable(courseId);
  if (input.categoryId) await assertCategoryExists(input.categoryId);

  return prisma.course.update({
    where: { id: courseId },
    data: input,
    include: { category: categorySelect },
  });
};

// Lessons, enrollments and progress are removed by ON DELETE CASCADE in the schema.
export const deleteCourse = async (courseId: string) => {
  await prisma.course.delete({ where: { id: courseId } });
};

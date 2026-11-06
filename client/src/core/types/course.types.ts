/** Courses: what the API returns, and what the client sends to search for or save one. */
import type { Category } from './category.types';
import type { Lesson } from './lesson.types';

export type CourseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

/** A course as shown on cards (catalog, my courses). */
export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  published: boolean;
  category: Pick<Category, 'id' | 'name'>;
  lessonCount: number;
  totalDurationSeconds: number;
  completedLessons: number;
  progressPercent: number;
  status: CourseStatus;
  enrolled?: boolean;
  enrollmentCount?: number;
  createdAt?: string;
}

/** A course with its lessons. */
export interface CourseDetail extends CourseSummary {
  lessons: Lesson[];
}

/** What the catalog and the admin course table can filter, sort and page by. */
export interface CourseFilters {
  /** Search text matched against title and description. */
  q?: string;
  categoryId?: string;
  /** Administrators only: show just published courses or just drafts. */
  status?: 'published' | 'draft';
  sortBy?: 'createdAt' | 'title' | 'learners' | 'lessons';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** The fields an administrator sets on a course. */
export interface CourseInput {
  title: string;
  description: string;
  categoryId: string;
  thumbnailUrl?: string | null;
  /** Drafts are only visible to administrators. */
  published?: boolean;
}

/** The tabs on My learning: every course, or only those with a given progress status. */
export type MyCoursesFilter = 'all' | CourseStatus;

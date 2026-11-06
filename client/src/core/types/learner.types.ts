/** Learners as seen by administrators: the learners table and the single-learner drill-down. */
import type { CourseStatus } from './course.types';
import type { Role } from './user.types';

/** One row of the admin learners table. */
export interface AdminLearner {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  courses: {
    courseId: string;
    title: string;
    completedLessons: number;
    lessonCount: number;
    progressPercent: number;
  }[];
}

/** A learner's status on one lesson. */
export interface LearnerLessonProgress {
  lessonId: string;
  title: string;
  order: number;
  durationSeconds: number;
  lastPositionSeconds: number;
  completed: boolean;
  completedAt: string | null;
  lastActivityAt: string | null;
}

/** One learner in full: every enrolled course with the status of each lesson. */
export interface LearnerDetail {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  summary: {
    enrolledCourses: number;
    completedCourses: number;
    completedLessons: number;
    minutesWatched: number;
  };
  courses: {
    courseId: string;
    title: string;
    category: { id: string; name: string };
    enrolledAt: string;
    lessonCount: number;
    totalDurationSeconds: number;
    completedLessons: number;
    progressPercent: number;
    status: CourseStatus;
    lessons: LearnerLessonProgress[];
  }[];
}

/** What the admin learners table can search, filter, sort and page by. */
export interface LearnerFilters {
  /** Search text matched against name and email. */
  q?: string;
  /** Only learners who have (yes) or haven't (no) enrolled in a course. */
  enrolled?: 'yes' | 'no';
  sortBy?: 'createdAt' | 'name';
  sortDir?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/** A simplified learner row, used by the style guide's example table. */
export interface LearnerRow {
  id: string;
  name: string;
  email: string;
  progress: number;
}

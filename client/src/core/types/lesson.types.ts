/** Video lessons inside a course. */
import type { Category } from './category.types';

/** A lesson as listed on lesson cards and the lesson path. */
export interface LessonSummary {
  id: string;
  title: string;
  order: number;
  durationSeconds: number;
  /** Picture for the lesson card; shown to everyone, unlike the video address. */
  thumbnailUrl?: string | null;
  completed: boolean;
  lastPositionSeconds: number;
  progressPercent: number;
}

export interface Lesson extends LessonSummary {
  description: string;
  /** Only present for enrolled learners and admins. */
  videoUrl?: string;
}

/** A lesson as the administrator's Lessons page lists it: any course, drafts included, with the video address. */
export interface AdminLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  order: number;
  createdAt: string;
  course: { id: string; title: string; published: boolean };
}

/** What the Lessons page can search, filter, sort and page by. */
export interface LessonFilters {
  /** Matches the lesson title or description, or the course title. */
  q?: string;
  courseId?: string;
  sortBy?: 'createdAt' | 'title' | 'course' | 'duration';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** One lesson opened for watching, with its neighbours in the course. */
export interface LessonDetail {
  lesson: Lesson & { videoUrl: string };
  course: { id: string; title: string; category: Pick<Category, 'id' | 'name'> };
  lessons: LessonSummary[];
  previousLessonId: string | null;
  nextLessonId: string | null;
  courseProgressPercent: number;
}

/** The fields an administrator sets on a lesson. Its position in the course is managed separately. */
export interface LessonInput {
  title: string;
  description: string;
  /** Must be an http(s) link. */
  videoUrl: string;
  /** Optional picture for the lesson card (an http(s) link); empty removes it. */
  thumbnailUrl?: string;
  durationSeconds: number;
}

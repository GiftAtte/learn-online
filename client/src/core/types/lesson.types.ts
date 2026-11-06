/** Video lessons inside a course. */
import type { Category } from './category.types';

/** A lesson as listed on lesson cards and the lesson path. */
export interface LessonSummary {
  id: string;
  title: string;
  order: number;
  durationSeconds: number;
  completed: boolean;
  lastPositionSeconds: number;
  progressPercent: number;
}

export interface Lesson extends LessonSummary {
  description: string;
  /** Only present for enrolled learners and admins. */
  videoUrl?: string;
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
  durationSeconds: number;
}

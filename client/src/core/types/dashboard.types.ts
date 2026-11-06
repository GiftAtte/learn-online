/** The summary screens for learners and for administrators. */
import type { Category } from './category.types';
import type { CourseSummary } from './course.types';

/** The lesson a learner should continue with. */
export interface ResumeTarget {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  lastPositionSeconds: number;
  durationSeconds: number;
}

export interface LearnerDashboard {
  summary: {
    enrolledCourses: number;
    inProgressCourses: number;
    completedCourses: number;
    completedLessons: number;
    minutesWatched: number;
    overallProgressPercent: number;
  };
  continueLearning: ResumeTarget | null;
  courses: Pick<
    CourseSummary,
    | 'id'
    | 'title'
    | 'category'
    | 'thumbnailUrl'
    | 'lessonCount'
    | 'completedLessons'
    | 'progressPercent'
    | 'status'
  >[];
  recentActivity: {
    lessonId: string;
    lessonTitle: string;
    courseId: string;
    courseTitle: string;
    completed: boolean;
    lastPositionSeconds: number;
    updatedAt: string;
  }[];
}

export interface AdminDashboard {
  summary: {
    learners: number;
    courses: number;
    publishedCourses: number;
    lessons: number;
    enrollments: number;
    completionRate: number;
  };
  courses: {
    id: string;
    title: string;
    category: Pick<Category, 'id' | 'name'>;
    thumbnailUrl: string | null;
    published: boolean;
    lessonCount: number;
    enrollmentCount: number;
    completedLearners: number;
    completionRate: number;
    averageProgressPercent: number;
  }[];
  recentEnrollments: {
    enrolledAt: string;
    user: { id: string; name: string; email: string };
    course: { id: string; title: string };
  }[];
}

/** One course row in the admin overview table. */
export type AdminCourseRow = AdminDashboard['courses'][number];

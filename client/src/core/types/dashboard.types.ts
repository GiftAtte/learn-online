/** The summary screens for learners and for administrators. */
import type { Category } from './category.types';
import type { CourseStatus, CourseSummary } from './course.types';

/** The lesson a learner should continue with. */
export interface ResumeTarget {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  videoUrl: string;
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
    thumbnailUrl: string | null;
    videoUrl: string;
    durationSeconds: number;
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

/** One course in full for administrators: who is enrolled, how far they are, and each lesson's completions. */
export interface CourseActivity {
  course: {
    id: string;
    title: string;
    category: Pick<Category, 'id' | 'name'>;
    published: boolean;
    lessonCount: number;
    totalDurationSeconds: number;
  };
  summary: {
    enrolled: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
    averageProgressPercent: number;
  };
  lessons: {
    lessonId: string;
    title: string;
    order: number;
    durationSeconds: number;
    completedLearners: number;
    startedLearners: number;
  }[];
  learners: {
    userId: string;
    name: string;
    email: string;
    enrolledAt: string;
    lastActivityAt: string | null;
    lessonCount: number;
    completedLessons: number;
    progressPercent: number;
    status: CourseStatus;
  }[];
}

export type CourseActivityLearner = CourseActivity['learners'][number];

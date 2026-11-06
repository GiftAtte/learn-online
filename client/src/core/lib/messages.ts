/**
 * Every sentence the interface shows in toasts, alerts and empty states lives here, so wording stays
 * consistent. Rules: sentence case, active voice, an action keeps one name end to end
 * ("Publish" button -> "Course published" confirmation), and errors say what to do next.
 */
export const MESSAGES = {
  generic: {
    saved: 'Changes saved',
    error: 'Something went wrong. Try again.',
    network: 'Can’t reach the server. Check your connection and try again.',
    notFound: 'We couldn’t find that page.',
    forbidden: 'You don’t have access to this page.',
    retry: 'Try again',
  },
  auth: {
    signedIn: 'Welcome back',
    registered: 'Account created. Welcome aboard.',
    signedOut: 'You’re signed out',
    roleChanged: 'Role updated',
    profileUpdated: 'Profile updated',
    passwordChanged: 'Password changed. Other devices were signed out.',
    sessionExpired: 'Your session ended. Sign in to continue.',
    invalidCredentials: 'That email and password don’t match.',
  },
  course: {
    created: 'Course created',
    updated: 'Course updated',
    deleted: 'Course deleted',
    published: 'Course published',
    unpublished: 'Course moved to drafts',
    enrolled: 'You’re enrolled. Start with the first lesson.',
    unenrolled: 'You’ve left the course',
  },
  lesson: {
    created: 'Lesson added',
    updated: 'Lesson updated',
    deleted: 'Lesson deleted',
    reordered: 'Lesson order saved',
    completed: 'Lesson completed',
    videoFailed: 'This video couldn’t be played. Try again in a moment.',
  },
  category: {
    created: 'Category created',
    updated: 'Category updated',
    deleted: 'Category deleted',
  },
  empty: {
    courses: {
      title: 'No courses yet',
      description: 'New courses will show up here once they’re published.',
    },
    search: { title: 'No matches', description: 'Try a different search or clear the filters.' },
    myCourses: {
      title: 'You haven’t enrolled in anything yet',
      description: 'Browse the catalog and pick your first course.',
    },
    lessons: {
      title: 'No lessons yet',
      description: 'Add the first lesson to get this course going.',
    },
    learners: { title: 'No learners yet', description: 'Learners appear here after they sign up.' },
  },
  confirm: {
    deleteCourse: {
      title: 'Delete this course?',
      description:
        'Its lessons and every learner’s progress will be removed. This can’t be undone.',
      confirmLabel: 'Delete course',
    },
    deleteLesson: {
      title: 'Delete this lesson?',
      description: 'Learners’ progress on it will be removed. This can’t be undone.',
      confirmLabel: 'Delete lesson',
    },
    deleteCategory: {
      title: 'Delete this category?',
      description: 'Only categories with no courses can be deleted.',
      confirmLabel: 'Delete category',
    },
    unenroll: {
      title: 'Leave this course?',
      description: 'Your progress is kept if you enroll again.',
      confirmLabel: 'Leave course',
    },
  },
} as const;

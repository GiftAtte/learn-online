/** How far a learner has watched a lesson video. */

/** A learner's saved progress on one lesson. */
export interface LessonProgress {
  lessonId: string;
  lastPositionSeconds: number;
  completed: boolean;
  completedAt: string | null;
}

/** What the player sends while a video plays. */
export interface UpdateLessonProgressInput {
  /** Where the learner is in the video, in seconds. Used to resume later. */
  positionSeconds: number;
  /** Sent when the video plays to the end. The server also marks a lesson complete at 95% watched. */
  completed?: boolean;
}

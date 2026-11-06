import { Badge, Card } from '@/components/ui';
import { VideoPlayer } from '@/components/media/video-player';
import { YouTubePlayer } from '@/components/media/youtube-player';
import { youTubeIdOf } from '@/core/lib/youtube';
import { formatDuration } from '@/core/lib/format';
import type { LessonDetail } from '@/core/types/lesson.types';
import { useUpdateLessonProgress } from '@/core/hooks/queries/use-progress';

interface LessonPlayerCardProps {
  detail: LessonDetail;
  /** False for administrators previewing a lesson: nothing is saved for them. */
  trackProgress: boolean;
}

/**
 * The focused video card: the player, plus the lesson's category, length and description.
 * It also connects the player to the API: it saves the position while watching and
 * marks the lesson complete when the video ends.
 */
export function LessonPlayerCard({ detail, trackProgress }: LessonPlayerCardProps) {
  const { lesson, course } = detail;
  const save = useUpdateLessonProgress(lesson.id);
  const youTubeId = youTubeIdOf(lesson.videoUrl);

  // Resume where they stopped, unless they already finished (then start over).
  const startAt =
    lesson.completed || lesson.lastPositionSeconds >= lesson.durationSeconds - 3
      ? 0
      : lesson.lastPositionSeconds;
  const onProgress = trackProgress
    ? (positionSeconds: number) => save.mutate({ positionSeconds })
    : undefined;
  const onEnded = trackProgress
    ? () => save.mutate({ positionSeconds: lesson.durationSeconds, completed: true })
    : undefined;

  return (
    <Card padding="none" className="rounded-stage p-2 sm:p-3">
      {youTubeId ? (
        <YouTubePlayer
          // A new key restarts the player when the learner moves to another lesson.
          key={lesson.id}
          videoId={youTubeId}
          title={lesson.title}
          startAt={startAt}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      ) : (
        <VideoPlayer
          key={lesson.id}
          src={lesson.videoUrl}
          title={lesson.title}
          startAt={startAt}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      )}
      <div className="flex flex-col gap-3 p-3 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{course.category.name}</Badge>
          <Badge>{formatDuration(lesson.durationSeconds)}</Badge>
          {lesson.completed && <Badge tone="success">Completed</Badge>}
        </div>
        <p className="max-w-prose text-[1.0625rem] text-ink-soft">{lesson.description}</p>
      </div>
    </Card>
  );
}

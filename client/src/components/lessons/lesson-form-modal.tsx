import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MediaField } from '@/components/media/media-field';
import { YouTubeField } from '@/components/lessons/youtube-field';
import { FormField, FormModal, Input, Textarea } from '@/components/ui';
import { cn } from '@/core/lib/cn';
import { youTubeIdOf, youTubeThumbnail } from '@/core/lib/youtube';
import { videoPosterUrl } from '@/core/lib/media';
import { handleSubmitError } from '@/core/lib/forms';
import type { Lesson } from '@/core/types/lesson.types';
import { useCreateLesson, useUpdateLesson } from '@/core/hooks/queries/use-lessons';
import { lessonSchema } from '@/core/schemas/lesson.schemas';
import type { LessonFormValues } from '@/core/types/form.types';

interface Props {
  courseId: string;
  /** Omit to add a new lesson. */
  existing?: Lesson;
  onClose: () => void;
}

/** Add or edit a lesson. Mount it only while open so the form starts fresh each time. */
export function LessonFormModal({ courseId, existing, onClose }: Props) {
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: existing?.title ?? '',
      description: existing?.description ?? '',
      videoUrl: existing?.videoUrl ?? '',
      thumbnailUrl: existing?.thumbnailUrl ?? '',
      durationSeconds: existing?.durationSeconds ?? (undefined as unknown as number),
    },
  });
  const errors = form.formState.errors;
  // Where the video comes from: a file or link (uploaded to Cloudinary, or any MP4 link), or YouTube.
  const [source, setSource] = useState<'file' | 'youtube'>(
    existing?.videoUrl && youTubeIdOf(existing.videoUrl) ? 'youtube' : 'file',
  );
  const chooseSource = (next: 'file' | 'youtube') => {
    if (next === source) return;
    setSource(next);
    form.setValue('videoUrl', '', { shouldValidate: form.formState.isSubmitted });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (existing) await updateLesson.mutateAsync({ id: existing.id, input: values });
      else await createLesson.mutateAsync({ courseId, input: values });
      onClose();
    } catch (error) {
      handleSubmitError(error, form.setError);
    }
  });

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={existing ? 'Edit lesson' : 'Add lesson'}
      submitLabel={existing ? 'Save changes' : 'Add lesson'}
      onSubmit={onSubmit}
      submitting={createLesson.isPending || updateLesson.isPending}
      size="lg"
    >
      <FormField label="Title" required error={errors.title?.message}>
        <Input autoFocus placeholder="e.g. Components and props" {...form.register('title')} />
      </FormField>
      <FormField label="Description" required error={errors.description?.message}>
        <Textarea className="min-h-24" {...form.register('description')} />
      </FormField>
      <FormField
        label="Video"
        required
        hint={
          source === 'youtube'
            ? 'Paste the YouTube video ID or the link. The length is filled in for you.'
            : 'Upload a video file, or paste a link to an MP4.'
        }
        error={errors.videoUrl?.message}
      >
        <div className="flex flex-col gap-3">
          <div
            role="radiogroup"
            aria-label="Where the video comes from"
            className="inline-flex w-fit rounded-full border border-line bg-sunken/50 p-1"
          >
            {(
              [
                { value: 'file', label: 'Upload or link' },
                { value: 'youtube', label: 'YouTube' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={source === value}
                onClick={() => chooseSource(value)}
                className={cn(
                  'cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  source === value
                    ? 'bg-surface text-ink shadow-card'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {source === 'youtube' ? (
            <Controller
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <YouTubeField
                  value={field.value}
                  onChange={field.onChange}
                  onDetected={({ id, durationSeconds }) => {
                    if (durationSeconds) {
                      form.setValue('durationSeconds', durationSeconds, { shouldValidate: true });
                    }
                    // No thumbnail yet? Use YouTube's own picture of the video.
                    if (!form.getValues('thumbnailUrl')) {
                      form.setValue('thumbnailUrl', youTubeThumbnail(id), { shouldValidate: true });
                    }
                  }}
                />
              )}
            />
          ) : (
            <Controller
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <MediaField
                  kind="video"
                  value={field.value}
                  onChange={field.onChange}
                  onUploaded={(media) => {
                    // Cloudinary reads the length from the file, so nobody has to type it.
                    if (media.durationSeconds) {
                      form.setValue('durationSeconds', media.durationSeconds, {
                        shouldValidate: true,
                      });
                    }
                    // No thumbnail yet? Use a picture taken from the video itself.
                    const poster = videoPosterUrl(media.url);
                    if (poster && !form.getValues('thumbnailUrl')) {
                      form.setValue('thumbnailUrl', poster, { shouldValidate: true });
                    }
                  }}
                />
              )}
            />
          )}
        </div>
      </FormField>
      <FormField
        label="Thumbnail"
        hint="Optional. The picture shown for this lesson on the course page."
        error={errors.thumbnailUrl?.message}
      >
        <Controller
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <MediaField kind="image" value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
      </FormField>
      <FormField
        label="Video length (seconds)"
        required
        hint="Used for progress and completion tracking. Filled in for you when you upload a video or enter a YouTube video."
        error={errors.durationSeconds?.message}
      >
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          {...form.register('durationSeconds', { valueAsNumber: true })}
        />
      </FormField>
    </FormModal>
  );
}

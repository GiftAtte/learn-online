import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormField, FormModal, Input, Select, Switch, Textarea } from '@/components/ui';
import { useGetAllCategories } from '@/core/hooks/queries/use-categories';
import { handleSubmitError } from '@/core/lib/forms';
import type { CourseSummary } from '@/core/types/course.types';
import { useCreateCourse, useUpdateCourse } from '@/core/hooks/queries/use-courses';
import { courseSchema } from '@/core/schemas/course.schemas';
import type { CourseFormValues } from '@/core/types/form.types';

interface Props {
  /** Omit to create a new course. */
  existing?: CourseSummary;
  onClose: () => void;
}

/** Create or edit a course's basic details. Mount it only while open so the form starts fresh. */
export function CourseFormModal({ existing, onClose }: Props) {
  const categories = useGetAllCategories();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: existing?.title ?? '',
      categoryId: existing?.category.id ?? '',
      description: existing?.description ?? '',
      thumbnailUrl: existing?.thumbnailUrl ?? '',
      published: existing?.published ?? false,
    },
  });
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const input = { ...values, thumbnailUrl: values.thumbnailUrl || null };
      if (existing) await updateCourse.mutateAsync({ id: existing.id, input });
      else await createCourse.mutateAsync(input);
      onClose();
    } catch (error) {
      handleSubmitError(error, form.setError);
    }
  });

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={existing ? 'Edit course' : 'New course'}
      description={existing ? undefined : 'Add the basics now. You can add lessons next.'}
      submitLabel={existing ? 'Save changes' : 'Create course'}
      onSubmit={onSubmit}
      submitting={createCourse.isPending || updateCourse.isPending}
      size="lg"
    >
      <FormField label="Title" required error={errors.title?.message}>
        <Input autoFocus placeholder="e.g. Modern React fundamentals" {...form.register('title')} />
      </FormField>

      <FormField label="Category" required error={errors.categoryId?.message}>
        <Controller
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              placeholder={categories.isPending ? 'Loading categories' : 'Choose a category'}
              options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
          )}
        />
      </FormField>

      <FormField
        label="Description"
        required
        hint="Shown on the course card and at the top of the course page."
        error={errors.description?.message}
      >
        <Textarea {...form.register('description')} />
      </FormField>

      <FormField
        label="Thumbnail address"
        hint="A link to an image. Leave empty to use a placeholder."
        error={errors.thumbnailUrl?.message}
      >
        <Input
          type="url"
          inputMode="url"
          placeholder="https://…"
          {...form.register('thumbnailUrl')}
        />
      </FormField>

      <Controller
        control={form.control}
        name="published"
        render={({ field }) => (
          <Switch
            label="Published"
            description="Learners can find and enroll in published courses. A course needs at least one lesson first."
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </FormModal>
  );
}

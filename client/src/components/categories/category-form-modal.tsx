import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, FormModal, Input } from '@/components/ui';
import { handleSubmitError } from '@/core/lib/forms';
import type { Category } from '@/core/types/category.types';
import { useCreateCategory, useUpdateCategory } from '@/core/hooks/queries/use-categories';
import { categorySchema } from '@/core/schemas/category.schemas';
import type { CategoryFormValues } from '@/core/types/form.types';

interface Props {
  /** Omit to create a new category. */
  existing?: Category;
  onClose: () => void;
}

/** Create or rename a category. Mount it only while open so the form starts fresh each time. */
export function CategoryFormModal({ existing, onClose }: Props) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: existing?.name ?? '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (existing) await updateCategory.mutateAsync({ id: existing.id, values });
      else await createCategory.mutateAsync(values);
      onClose();
    } catch (error) {
      handleSubmitError(error, form.setError);
    }
  });

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={existing ? 'Rename category' : 'New category'}
      description="Categories group courses in the catalog."
      submitLabel={existing ? 'Save changes' : 'Create category'}
      onSubmit={onSubmit}
      submitting={createCategory.isPending || updateCategory.isPending}
      size="sm"
    >
      <FormField label="Name" required error={form.formState.errors.name?.message}>
        <Input autoFocus placeholder="e.g. Design" {...form.register('name')} />
      </FormField>
    </FormModal>
  );
}

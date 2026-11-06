import type { ReactNode } from 'react';
import { Button } from './button';
import { Modal } from './modal';

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Submit button text. Name the action: "Create course", "Save changes", never "Submit". */
  submitLabel: string;
  /** Called on submit, normally `form.handleSubmit(onValid)` from React Hook Form. */
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  submitting?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** The form fields (use <FormField> for each). */
  children: ReactNode;
}

/**
 * The standard container for simple create / edit actions (categories, lessons, basic course details).
 * Keeps every form modal identical: same buttons, same loading state, Enter submits, Escape cancels.
 */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  submitting,
  size = 'md',
  children,
}: FormModalProps) {
  const formId = 'form-modal';
  return (
    <Modal
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {children}
      </form>
    </Modal>
  );
}

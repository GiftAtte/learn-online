import { CircleAlert } from 'lucide-react';
import { createContext, useContext, useId, type ReactNode } from 'react';
import { cn } from '@/core/lib/cn';
import { Label } from './label';
import type { FieldContextValue } from '@/core/types/ui.types';

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Accessibility wiring for form controls. Input, Textarea, Select and Checkbox call this so the
 * label, hint and error message are connected to the control without any manual id handling.
 */
export function useFieldControl() {
  const field = useContext(FieldContext);
  if (!field) return {};
  return {
    id: field.id,
    'aria-describedby': field.describedBy,
    'aria-invalid': field.invalid || undefined,
    'aria-required': field.required || undefined,
  };
}

interface FormFieldProps {
  label: string;
  /** Helper text shown under the control. */
  hint?: string;
  /** Validation message. Replaces the look of the field with an error state. */
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** The one standard wrapper for every labelled form control. */
export function FormField({
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: !!error, required }}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        <Label htmlFor={id}>
          {label}
          {!required && <span className="ml-1.5 font-normal text-ink-faint">(optional)</span>}
        </Label>
        {children}
        {hint && !error && (
          <p id={hintId} className="text-sm text-ink-faint">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm text-danger">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

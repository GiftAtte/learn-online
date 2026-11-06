import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { cn } from '@/core/lib/cn';

interface DropzoneProps {
  /** File types the picker offers, as for `<input accept>` (e.g. "image/png,image/jpeg"). */
  accept?: string;
  /** Called with the chosen or dropped file. Check the file's type and size yourself. */
  onFile: (file: File) => void;
  disabled?: boolean;
  /** Marks the zone as invalid (red border), e.g. when the form field has an error. */
  invalid?: boolean;
  /** Id for the clickable zone, so a form label can point at it. */
  id?: string;
  'aria-describedby'?: string;
  className?: string;
  /** What to show inside: usually an icon, a sentence and the rules. */
  children: ReactNode;
}

/**
 * A "drop a file here, or click to browse" area. It only collects ONE file and hands it to `onFile`;
 * it knows nothing about uploading. Works with mouse (click, drag and drop) and keyboard (Tab, then
 * Enter or Space). Used by MediaField, and ready for any other place that needs a file.
 */
export function Dropzone({
  accept,
  onFile,
  disabled,
  invalid,
  id,
  className,
  children,
  ...aria
}: DropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ''; // so choosing the same file again still counts as a change
          if (file) onFile(file);
        }}
      />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={aria['aria-describedby']}
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()} // required, or the browser refuses the drop
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed bg-surface px-4 py-7 text-center transition-colors',
          'hover:border-spruce-400 hover:bg-spruce-50/60 disabled:pointer-events-none disabled:opacity-50',
          invalid ? 'border-danger' : 'border-line-strong',
          dragging && 'border-pencil-600 bg-pencil-50',
          className,
        )}
      >
        {children}
      </button>
    </>
  );
}

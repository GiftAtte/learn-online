import { useState } from 'react';

/**
 * State for a create / edit modal: closed, creating a new item, or editing an existing one.
 * Every admin list uses it, so opening and closing forms works the same everywhere.
 *
 *   const editor = useEditTarget<Category>();
 *   <Button onClick={editor.openNew}>New category</Button>
 *   {editor.isOpen && <CategoryFormModal existing={editor.item} onClose={editor.close} />}
 */
export function useEditTarget<T>() {
  const [target, setTarget] = useState<T | 'new' | null>(null);
  return {
    isOpen: target !== null,
    /** The item being edited, or undefined when creating a new one. */
    item: target === 'new' || target === null ? undefined : target,
    openNew: () => setTarget('new'),
    openEdit: (item: T) => setTarget(item),
    close: () => setTarget(null),
  };
}

import { act, renderHook } from '@testing-library/react';
import { useEditTarget } from '@/core/hooks/ui/use-edit-target';

describe('useEditTarget', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useEditTarget<{ id: string }>());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.item).toBeUndefined();
  });

  it('opens for a new item without an existing one', () => {
    const { result } = renderHook(() => useEditTarget<{ id: string }>());
    act(() => result.current.openNew());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.item).toBeUndefined();
  });

  it('opens for an existing item and closes again', () => {
    const { result } = renderHook(() => useEditTarget<{ id: string }>());
    act(() => result.current.openEdit({ id: 'c1' }));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.item).toEqual({ id: 'c1' });

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});

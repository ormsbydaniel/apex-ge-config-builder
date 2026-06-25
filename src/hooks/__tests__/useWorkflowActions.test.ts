import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowActions } from '../useWorkflowActions';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const makeWf = (id: string) => ({ serviceId: id, serviceProvider: 'vito' });

describe('useWorkflowActions', () => {
  it('addWorkflow appends to the end', () => {
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowActions({ config: { workflows: [makeWf('a')] }, dispatch }),
    );
    act(() => result.current.addWorkflow(makeWf('b')));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_WORKFLOWS',
      payload: [makeWf('a'), makeWf('b')],
    });
  });

  it('updateWorkflow replaces at index', () => {
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowActions({ config: { workflows: [makeWf('a'), makeWf('b')] }, dispatch }),
    );
    act(() => result.current.updateWorkflow(1, makeWf('B')));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_WORKFLOWS',
      payload: [makeWf('a'), makeWf('B')],
    });
  });

  it('removeWorkflow filters by index', () => {
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowActions({
        config: { workflows: [makeWf('a'), makeWf('b'), makeWf('c')] },
        dispatch,
      }),
    );
    act(() => result.current.removeWorkflow(1));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_WORKFLOWS',
      payload: [makeWf('a'), makeWf('c')],
    });
  });

  it('duplicateWorkflow inserts a deep copy after the original with _copy suffix', () => {
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowActions({ config: { workflows: [makeWf('a')] }, dispatch }),
    );
    act(() => result.current.duplicateWorkflow(0));
    const call = dispatch.mock.calls[0][0];
    expect(call.type).toBe('UPDATE_WORKFLOWS');
    expect(call.payload).toHaveLength(2);
    expect(call.payload[0].serviceId).toBe('a');
    expect(call.payload[1].serviceId).toBe('a_copy');
  });

  it('moveWorkflow reorders entries', () => {
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowActions({
        config: { workflows: [makeWf('a'), makeWf('b'), makeWf('c')] },
        dispatch,
      }),
    );
    act(() => result.current.moveWorkflow(0, 2));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_WORKFLOWS',
      payload: [makeWf('b'), makeWf('c'), makeWf('a')],
    });
  });

  it('no-ops when indices are invalid', () => {
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowActions({ config: { workflows: [makeWf('a')] }, dispatch }),
    );
    act(() => result.current.removeWorkflow(5));
    act(() => result.current.moveWorkflow(0, 0));
    expect(dispatch).not.toHaveBeenCalled();
  });
});
